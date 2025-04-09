-- is_admin 함수 생성 (STABLE 추가, SECURITY INVOKER 로 시도)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean AS $$
-- SECURITY INVOKER: 함수를 호출하는 사용자의 권한으로 실행됨
-- RLS 정책 등에서 auth.uid() 와 함께 사용될 때 해당 사용자의 role을 읽을 수 있어야 함
SELECT EXISTS (
  SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'admin'::public.user_role
);
$$ LANGUAGE sql STABLE SECURITY INVOKER; -- INVOKER가 RLS와 잘 작동하는지 테스트 필요

-- 주석 추가
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Checks if the given user ID has the admin role.';