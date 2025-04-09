import { useUserStore } from '@/store/user.store'; // 경로 수정

/**
 * 클라이언트 컴포넌트에서 사용자 인증 상태 및 프로필 정보에 쉽게 접근하기 위한 커스텀 훅.
 * Zustand 스토어의 상태를 반환합니다.
 */
export function useUser() {
  const { user, profile, isLoading } = useUserStore(
    (state) => ({ user: state.user, profile: state.profile, isLoading: state.isLoading })
  );

  return {
    user,          // Supabase Auth User 객체 | null
    profile,       // public.users 테이블 정보 | null
    isLoading,     // 인증 및 프로필 로딩 상태 boolean
    isLoggedIn: !!user, // 로그인 여부 편의 속성 boolean
  };
}