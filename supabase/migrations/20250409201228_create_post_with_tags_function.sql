-- 게시물 생성 및 태그 처리를 위한 DB 함수
-- 기존 함수가 있다면 덮어쓰기 위해 CREATE OR REPLACE 사용
CREATE OR REPLACE FUNCTION public.create_post_with_tags(
  p_user_id uuid,
  p_title text,
  p_content text,
  p_view_limit integer,
  p_tags text[] -- 태그 이름 배열
) RETURNS uuid AS $$ -- 생성된 post_id 반환
DECLARE
  v_post_id uuid;
  v_tag_id uuid;
  v_preview text;
  tag_name text;
BEGIN
  -- 미리보기 생성 (간단 버전: 첫 50자, 줄바꿈 공백으로 대체)
  -- TODO: 마크다운 제거 로직 추가 고려 (Story 8.4)
  v_preview := substr(regexp_replace(p_content, E'[\\r\\n]+', ' ', 'g'), 1, 50);

  -- 1. 게시물 생성 (posts 테이블)
  INSERT INTO public.posts (user_id, title, content, view_limit, preview, status)
  VALUES (p_user_id, p_title, p_content, p_view_limit, v_preview, 'pending') -- 초기 상태 'pending'
  RETURNING id INTO v_post_id; -- 생성된 게시물 ID 저장

  -- 2. 태그 처리 (tags, post_tags 테이블)
  -- 태그 배열이 비어있지 않은 경우에만 처리
  IF array_length(p_tags, 1) > 0 THEN
    FOREACH tag_name IN ARRAY p_tags LOOP
      -- 태그 이름 앞뒤 공백 제거
      tag_name := trim(tag_name);
      -- 태그 이름이 비어있지 않은 경우에만 처리
      IF char_length(tag_name) > 0 THEN
        -- 태그 조회 또는 생성 (UPSERT)
        -- tags 테이블에 해당 이름의 태그가 없으면 새로 삽입하고, 있으면 충돌 무시 후 기존 ID 반환
        INSERT INTO public.tags (name)
        VALUES (tag_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- 이름이 고유 제약 조건이므로 업데이트는 사실상 발생 안 함
        RETURNING id INTO v_tag_id; -- 생성되거나 기존 태그의 ID 저장

        -- 게시물과 태그 연결 (post_tags 테이블)
        -- 이미 연결되어 있다면 중복 삽입 방지 (ON CONFLICT DO NOTHING)
        INSERT INTO public.post_tags (post_id, tag_id)
        VALUES (v_post_id, v_tag_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 생성된 게시물 ID 반환
  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER 설정: 함수를 정의한 사용자의 권한으로 실행됨.
-- posts, tags, post_tags 테이블에 대한 INSERT 권한 필요.
-- 보안 검토 필수!