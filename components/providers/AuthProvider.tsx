'use client'; // 클라이언트 컴포넌트

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // 경로 수정
import { useUserStore } from '@/store/user.store'; // 경로 수정
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'; // 타입 import 추가
import { getCurrentUserProfile } from '@/services/user.service'; // 실제 함수 import



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const { setUserAndProfile, clearUser, setLoading } = useUserStore();

  useEffect(() => {
    setLoading(true); // 리스너 설정 시작 시 로딩 상태

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => { // 타입 명시
        console.log('Auth state changed:', event, session); // 디버깅 로그 추가
        setLoading(true); // 상태 변경 시작 시 로딩
        if (session?.user) {
          // SIGNED_IN 또는 INITIAL_SESSION
          try {
            // getCurrentUserProfile 호출 (현재는 임시 함수 사용)
            const profile = await getCurrentUserProfile(session.user.id);
            console.log('Fetched profile (or null):', profile); // 디버깅 로그 추가
            setUserAndProfile(session.user, profile);
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUserAndProfile(session.user, null); // 유저 세션은 있지만 프로필 로드 실패
          }
        } else {
          // SIGNED_OUT
          console.log('User signed out, clearing user store.'); // 디버깅 로그 추가
          clearUser();
        }
        setLoading(false); // 상태 변경 처리 완료
      }
    );

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      console.log('Unsubscribing from auth state changes.'); // 디버깅 로그 추가
      subscription.unsubscribe();
    };
    // Removed unnecessary eslint-disable comment
  }, [supabase, setUserAndProfile, clearUser, setLoading]); // supabase 의존성 추가됨 (이전 커밋에서 이미 반영되었을 수 있음, 확인 필요)

  return <>{children}</>;
}