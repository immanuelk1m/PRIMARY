-- 초기 관리자 지정 (Story 6.2)
-- 주의: 이 마이그레이션은 특정 사용자를 초기 관리자로 지정합니다.
-- 운영 환경에서는 더 안전한 관리자 지정 프로세스를 고려해야 합니다.
UPDATE public.users
SET role = 'admin'::public.user_role
WHERE email = 'kse0119@naver.com';

-- 확인 (선택 사항): 마이그레이션 후 해당 사용자의 role 확인
-- SELECT id, email, role FROM public.users WHERE email = 'kse0119@naver.com';