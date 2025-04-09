-- 1. 초대 코드 생성 함수 (중복 방지 강화)
-- 기존 함수가 있다면 덮어쓰기 위해 CREATE OR REPLACE 사용
CREATE OR REPLACE FUNCTION public.generate_unique_invite_code(length int DEFAULT 8)
RETURNS text AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text;
  max_attempts int := 5; -- 최대 시도 횟수
  attempts int := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..length LOOP
      result := result || chars[1+floor(random()*(array_length(chars, 1)))::int];
    END LOOP;
    -- 생성된 코드가 이미 public.users 테이블에 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE invite_code = result) THEN
      RETURN result; -- 중복되지 않으면 반환
    END IF;
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      -- 최대 시도 후에도 고유 코드 생성 실패 시 예외 발생
      RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE; -- random() 함수 사용으로 VOLATILE 설정

-- 2. 신규 사용자 처리 함수 (handle_new_user)
-- 기존 함수가 있다면 덮어쓰기 위해 CREATE OR REPLACE 사용
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_invite_code text;
  user_nickname text;
  inviter_user_id uuid;
BEGIN
  -- 1. 고유 초대 코드 생성
  generated_invite_code := public.generate_unique_invite_code();

  -- 2. 닉네임 설정: 카카오 메타데이터의 'nickname' 키 우선 사용, 없으면 기본값 ('사용자' + ID 앞 4자리)
  -- 참고: Supabase Auth 설정에서 카카오 로그인 시 'nickname' 메타데이터 매핑 필요
  user_nickname := COALESCE(new.raw_user_meta_data->>'nickname', '사용자' || substr(new.id::text, 1, 4));

  -- 3. 초대자 ID 확인: 가입 시 메타데이터에 포함된 'invite_code' 키 기준
  -- 참고: Supabase Auth 설정에서 카카오 로그인 시 'invite_code' 메타데이터 매핑 필요 (또는 다른 방식의 초대 코드 전달)
  SELECT id INTO inviter_user_id FROM public.users WHERE invite_code = new.raw_user_meta_data->>'invite_code' LIMIT 1;

  -- 4. public.users 테이블에 신규 사용자 레코드 삽입
  INSERT INTO public.users (id, email, nickname, invite_code, token_balance, invited_by_user_id)
  VALUES (
    new.id, -- auth.users 테이블의 id와 동일하게 설정
    new.email,
    user_nickname,
    generated_invite_code,
    1, -- 초기 토큰 1개 지급 (FR-TOKEN-01)
    inviter_user_id -- 초대자 ID 설정 (없으면 NULL)
  );

  -- 5. public.tokens_log 테이블에 가입 보상 토큰 지급 내역 기록
  INSERT INTO public.tokens_log (user_id, change_amount, balance_after_change, reason)
  VALUES (new.id, 1, 1, 'signup');

  -- 초대 보상 지급 로직 (Story 8.1)은 여기서 분리하는 것을 권장
  -- 예: PERFORM public.grant_invite_rewards(inviter_user_id, new.id);

  RETURN new; -- 트리거 함수는 new 또는 null 반환
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER 설정: auth 스키마 접근 및 public 스키마 쓰기 권한 필요.
-- 보안상 함수 내용을 최소화하고 검토 필요.

-- 3. 트리거 생성
-- 기존 트리거가 있다면 삭제 후 재생성 (멱등성 확보)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- auth.users 테이블에 INSERT 발생 후 실행될 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 트리거 비활성화/활성화 (필요시)
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;