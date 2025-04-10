// File: app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 수정된 import 경로 (절대 경로 alias 사용)
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'; // 로그인 후 리디렉션될 경로 (기본값: 홈페이지)

  console.log('Auth Callback received. Code:', code ? 'Exists' : 'Missing', 'Next:', next); // 로그 추가

  if (code) {
    const cookieStore = cookies();
    // @ts-expect-error // createSupabaseServerClient 타입 문제 임시 해결 (필요시 제거 또는 수정)
    const supabase = createSupabaseServerClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log('Code exchanged successfully. Redirecting to:', `${origin}${next}`); // 성공 로그
      // URL을 절대 경로로 만들어 리디렉션합니다.
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Error exchanging code for session:', error.message); // 에러 로그
      // 에러 발생 시 로그인 페이지 또는 에러 페이지로 리디렉션할 수 있습니다.
      // 에러 메시지를 쿼리 파라미터로 전달하여 사용자에게 피드백을 줄 수 있습니다.
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`);
    }
  } else {
    console.warn('Auth Callback: No code found in search params.'); // 코드 없음 로그
    // 코드가 없는 경우 로그인 페이지 또는 에러 페이지로 리디렉션
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=No_code_provided`);
  }
}