'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { KakaoLoginButton } from '@/components/feature/auth/KakaoLoginButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 폼 기본 제출 방지

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('로그인 오류:', error.message);
      // 사용자 친화적인 오류 메시지 표시 (예: alert 또는 토스트 메시지)
      alert(`로그인에 실패했습니다: ${error.message}`);
    } else {
      // 로그인 성공 시 홈으로 리디렉션하고 페이지 새로고침
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12"> {/* 패딩 추가 */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1"> {/* 간격 조정 */}
          <CardTitle className="text-2xl font-bold">로그인</CardTitle> {/* 텍스트 크기 및 굵기 조정 */}
          <CardDescription>이메일과 비밀번호 또는 카카오 계정으로 로그인하세요.</CardDescription> {/* 설명 수정 */}
        </CardHeader>
        <CardContent className="grid gap-4"> {/* grid gap 추가 */}
          <form onSubmit={handleEmailLogin} className="grid gap-4"> {/* form에도 grid gap 추가 */}
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md" // 모서리 둥글게
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md" // 모서리 둥글게
              />
            </div>
            <Button type="submit" className="w-full rounded-md"> {/* 모서리 둥글게 */}
              이메일로 로그인
            </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="underline">
              로그인
            </Link>
          </p>
          </form>
          {/* 구분선 */}
          <div className="relative my-2"> {/* 마진 조정 */}
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>
          {/* 카카오 로그인 버튼 */}
          <KakaoLoginButton />
        </CardContent>
        {/* CardFooter는 지침에 따라 제거 */}
      </Card>
    </div>
  );
}