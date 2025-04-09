import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          // NextResponse 객체를 직접 수정하는 대신, 응답 헤더를 설정하는 방식을 사용합니다.
          // createServerClient는 내부적으로 이 set 함수를 호출하여 쿠키를 설정합니다.
          // 미들웨어에서는 응답 객체를 반환하여 쿠키를 설정해야 합니다.
          // 따라서 여기서는 req 쿠키만 업데이트하고, 실제 응답은 미들웨어 핸들러에서 처리합니다.
          // 참고: https://supabase.com/docs/guides/auth/server-side/nextjs#middleware
          // 주의: 아래 코드는 직접 응답을 보내는 것이 아니라, 응답 객체에 쿠키를 설정하는 예시입니다.
          // 실제 미들웨어 로직에서는 이 함수가 반환한 클라이언트를 사용한 후,
          // 최종적으로 NextResponse 객체를 반환해야 합니다.
          // res = NextResponse.next({ // 또는 다른 응답 타입
          //   request: {
          //     headers: req.headers,
          //   },
          // });
          // res.cookies.set({
          //   name,
          //   value,
          //   ...options,
          // });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          // res = NextResponse.next({ // 또는 다른 응답 타입
          //   request: {
          //     headers: req.headers,
          //   },
          // });
          // res.cookies.set({
          //   name,
          //   value: '',
          //   ...options,
          // });
        },
      },
    }
  );
}