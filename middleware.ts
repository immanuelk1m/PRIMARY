import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'; // 함수 이름 확인 및 경로 확인
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // NextResponse.next()를 먼저 호출하여 응답 객체를 생성합니다.
  // 이 응답 객체는 Supabase 클라이언트가 쿠키를 설정하는 데 사용됩니다.
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res); // req, res 전달

  // 미들웨어 클라이언트를 사용하여 세션 정보를 가져옵니다.
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');

  // 보호할 경로 목록 (시작 경로 기준)
  // '/invite' 경로 추가
  const protectedPaths = ['/my', '/posts/new', '/admin', '/invite'];

  // 현재 경로가 보호 대상인지 확인
  const needsAuth = protectedPaths.some(path => pathname.startsWith(path));

  // 보호 경로인데 세션이 없으면 로그인 페이지로 리디렉션
  if (needsAuth && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname); // 로그인 후 돌아올 경로 전달
    console.log(`Redirecting unauthenticated user from ${pathname} to ${redirectUrl.toString()}`); // 디버깅 로그
    return NextResponse.redirect(redirectUrl);
  }

  // 2. 관리자 경로 접근 시, 로그인 + 관리자 역할 확인
  if (isAdminPath && session) {
    // 방법 A: is_admin 함수 호출 (권장)
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { p_user_id: session.user.id });

    if (rpcError || !isAdmin) {
      console.warn(`Admin access denied for user ${session.user.id} to path ${pathname}. IsAdmin: ${isAdmin}, Error: ${rpcError?.message}`);
      return NextResponse.redirect(new URL('/', req.url)); // 접근 거부 시 홈으로
    }
    // 방법 B: users 테이블 직접 조회 (비추천: 미들웨어 성능 영향)
    /*
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profileError || profile?.role !== 'admin') {
       return NextResponse.redirect(new URL('/', req.url));
    }
    */
  }


  // 로그인 페이지인데 세션이 있으면 홈페이지로 리디렉션 (선택적)
  if (pathname === '/login' && session) {
    console.log(`Redirecting authenticated user from /login to /`); // 디버깅 로그
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 모든 검사 통과 시 생성된 응답 객체(res)를 반환합니다.
  // 이 응답 객체에는 Supabase 클라이언트에 의해 설정된 쿠키가 포함될 수 있습니다.
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes) -> 웹훅 경로는 제외하지 않도록 주의 (/api/webhooks)
     * - auth/callback (OAuth 콜백 경로는 미들웨어 적용 제외)
     * Matcher에 포함되지 않는 경로는 미들웨어가 실행되지 않습니다.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api/(?!webhooks)).*)',
    // 명시적으로 미들웨어를 실행할 경로 (보호 경로 및 로그인 페이지)
    '/my/:path*',
    '/posts/new',
    '/admin/:path*',
    '/invite',
    '/login',
  ],
}