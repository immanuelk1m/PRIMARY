'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 추가
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // 추가 (경로 수정)
import { useUserStore } from '@/store/user.store'; // 추가 (경로 수정)
import { Button } from '@/components/ui/button'; // Button 컴포넌트 import (경로 수정)
import { useUser } from '@/hooks/useUser'; // 추가
import { TokenBalanceDisplay } from '@/components/feature/token/TokenBalanceDisplay'; // 추가
const Header = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { user, isLoggedIn } = useUser(); // useUser 훅 사용 및 isLoggedIn 상태 가져오기

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // 상태 업데이트는 onAuthStateChange 리스너(Story 3.4)가 처리.
      router.push('/'); // 로그아웃 후 홈으로 이동
      router.refresh(); // 서버 컴포넌트 데이터 갱신
    } else {
      console.error('Logout error:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* 로고 영역 */}
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {/* 로고 텍스트 또는 이미지 */}
        <span className="text-lg">PRIMARY</span> {/* 간단한 텍스트 로고 */}
      </Link>

      {/* 네비게이션 영역 (간단한 링크) */}
      <nav className="hidden gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
          Home
        </Link>
        {/* 필요에 따라 다른 네비게이션 링크 추가 */}
      </nav>

      {/* 사용자 정보 / 로그인 버튼 영역 */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? ( // user 대신 isLoggedIn 사용
          <>
            {/* 로그인 상태일 때 */}
            <span className="text-sm text-muted-foreground">
              {user?.email} {/* user가 null일 수 있으므로 optional chaining 사용 */}
            </span>
            {/* 토큰 잔액 표시 컴포넌트 추가 */}
            <div className="ml-4">
              <TokenBalanceDisplay />
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </>
        ) : (
          <>
            {/* 로그아웃 상태일 때 */}
            <Link href="/login">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </Link>
            {/* 필요시 회원가입 버튼 추가 */}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;