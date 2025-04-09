-- 마이그레이션 파일에 추가
CREATE OR REPLACE FUNCTION public.consume_token_for_view(
  p_user_id uuid,
  p_post_id uuid
) RETURNS TABLE (can_view boolean, message text) AS $$ -- 열람 가능 여부 및 메시지 반환
DECLARE
  v_user_tier user_tier;
  v_token_balance integer;
  v_post_author_id uuid;
  v_view_limit integer;
  v_view_count integer;
  v_already_viewed boolean := false;
  v_new_balance integer;
BEGIN
  -- 1. 사용자 및 게시물 정보 조회 (FOR UPDATE 사용하여 행 잠금 - 경쟁 상태 방지)
  SELECT tier, token_balance INTO v_user_tier, v_token_balance
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  SELECT user_id, view_limit, view_count INTO v_post_author_id, v_view_limit, v_view_count
  FROM public.posts WHERE id = p_post_id FOR UPDATE;

  -- 게시물 존재 여부 확인
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '게시물을 찾을 수 없습니다.';
    RETURN;
  END IF;

  -- 2. 열람 조건 체크
  -- 2.1. 유료 사용자 또는 작성자 본인인가?
  IF v_user_tier = 'paid' OR p_user_id = v_post_author_id THEN
    RETURN QUERY SELECT true, '열람 가능 (유료/작성자)';
    RETURN;
  END IF;

  -- 2.2. 이미 조회한 기록이 있는가?
  SELECT EXISTS (SELECT 1 FROM public.post_views WHERE user_id = p_user_id AND post_id = p_post_id)
  INTO v_already_viewed;
  IF v_already_viewed THEN
    RETURN QUERY SELECT true, '열람 가능 (이미 조회함)';
    RETURN;
  END IF;

  -- 2.3. 토큰이 충분한가? (무료 사용자)
  IF v_token_balance < 1 THEN
    RETURN QUERY SELECT false, '토큰이 부족합니다.';
    RETURN;
  END IF;

  -- 2.4. N명 열람 제한에 도달했는가? (무료 사용자)
  IF v_view_limit IS NOT NULL AND v_view_count >= v_view_limit THEN
    RETURN QUERY SELECT false, '열람 인원 제한에 도달했습니다.';
    RETURN;
  END IF;

  -- 3. 모든 조건 통과: 토큰 차감 및 관련 정보 업데이트
  v_new_balance := v_token_balance - 1;

  -- 3.1. 사용자 토큰 잔액 차감
  UPDATE public.users SET token_balance = v_new_balance WHERE id = p_user_id;

  -- 3.2. 토큰 로그 기록
  INSERT INTO public.tokens_log (user_id, change_amount, balance_after_change, reason, related_post_id)
  VALUES (p_user_id, -1, v_new_balance, 'view_post_cost', p_post_id);

  -- 3.3. 조회 기록 삽입
  INSERT INTO public.post_views (user_id, post_id) VALUES (p_user_id, p_post_id);

  -- 3.4. 게시물 조회수 증가
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = p_post_id;

  -- 4. 최종 결과 반환
  RETURN QUERY SELECT true, '열람 가능 (토큰 사용)';

-- 함수 내에서는 별도 BEGIN/COMMIT 불필요, 호출 시 자동으로 트랜잭션 처리됨
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER 필요: users, posts 테이블 FOR UPDATE 및 모든 테이블 RW 권한 필요