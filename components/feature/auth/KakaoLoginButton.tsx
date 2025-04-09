'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'; // 경로 확인
import { Button } from '../../ui/button'; // 경로 확인

// 카카오 로고 SVG (인라인 또는 별도 파일 import)
const KakaoIcon = () => (
  <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 5.79 2 10.286c0 2.905 1.868 5.51 4.681 6.914L6 22l3.181-2.273A11.991 11.991 0 0012 20c5.523 0 10-3.79 10-8.286C22 5.79 17.523 2 12 2z" fill="#FFEB00"/>
    <path d="M12 6c-3.314 0-6 2.239-6 5s2.686 5 6 5 6-2.239 6-5-2.686-5-6-5zm0 8c-1.657 0-3-1.12-3-2.5S10.343 9 12 9s3 1.12 3 2.5-1.343 2.5-3 2.5z" fill="#3C1E1E"/>
  </svg>
);

export function KakaoLoginButton() {
  const supabase = createSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null); // 이전 에러 초기화
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // 로그인 후 돌아올 앱 내 경로
      },
    });
    if (signInError) {
      console.error('Kakao login error:', signInError);
      setError('카카오 로그인 중 오류가 발생했습니다: ' + signInError.message);
      setIsLoading(false);
    }
    // 성공 시 리디렉션 발생
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FEE500]/90"
      >
        <KakaoIcon />
        {isLoading ? '로그인 중...' : '카카오로 로그인'}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}