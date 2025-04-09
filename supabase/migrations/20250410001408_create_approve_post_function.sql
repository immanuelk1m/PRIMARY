-- Story 6.6: 게시물 승인 및 토큰 지급 트랜잭션 함수
CREATE OR REPLACE FUNCTION public.approve_post_and_grant_token(p_post_id uuid, p_admin_id uuid) -- 실행 관리자 ID 추가 (로깅용)
RETURNS boolean AS $$
DECLARE
  v_author_id uuid;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- 1. 게시물 상태 'approved'로 변경 및 작성자 ID 가져오기
  UPDATE public.posts
  SET status = 'approved'::public.post_status, approved_at = now()
  WHERE id = p_post_id AND status != 'approved'::public.post_status -- 이미 승인된 경우 제외
  RETURNING user_id INTO v_author_id;

  -- 업데이트된 행이 없으면 (이미 승인되었거나 게시물 없음) false 반환
  IF NOT FOUND THEN RETURN false; END IF;

  -- 2. 작성자 토큰 잔액 조회 (FOR UPDATE - 동시성 제어)
  SELECT token_balance INTO v_current_balance FROM public.users WHERE id = v_author_id FOR UPDATE;
  v_new_balance := v_current_balance + 1; -- 승인 보상 1 토큰

  -- 3. 작성자 토큰 잔액 업데이트
  UPDATE public.users SET token_balance = v_new_balance WHERE id = v_author_id;

  -- 4. 토큰 로그 기록
  INSERT INTO public.tokens_log (user_id, change_amount, balance_after_change, reason, related_post_id)
  VALUES (v_author_id, 1, v_new_balance, 'post_approved_reward'::public.token_reason, p_post_id);

  -- (선택적) 관리자 활동 로그 기록 (별도 테이블 필요)
  -- INSERT INTO admin_actions_log (admin_user_id, action_type, target_table, target_id, details)
  -- VALUES (p_admin_id, 'approve_post', 'posts', p_post_id, jsonb_build_object('previous_status', 'pending')); -- 예시

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 다른 사용자의 토큰 잔액 및 로그 테이블 수정 권한 필요

COMMENT ON FUNCTION public.approve_post_and_grant_token(uuid, uuid) IS 'Approves a post, grants 1 token to the author, and logs the transaction. Returns true on success, false if post not found or already approved.';