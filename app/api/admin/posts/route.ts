import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'; // 정확한 타입 경로
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 서버 클라이언트 import
import { getPostsForAdmin } from '@/services/admin.service'; // 관리자 서비스 함수 import

export async function GET(request: Request) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies; // unknown을 통한 타입 단언
  const supabase = createSupabaseServerClient(cookieStore);

  // 1. 사용자 인증 확인
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('API Auth Error:', sessionError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 관리자 권한 확인 (is_admin 함수 호출)
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { p_user_id: session.user.id });

  if (rpcError || !isAdmin) {
    console.warn(`API Admin Access Denied: User ${session.user.id}. IsAdmin: ${isAdmin}, Error: ${rpcError?.message}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. 관리자 권한 확인 후 서비스 함수 호출
  try {
    const posts = await getPostsForAdmin(); // 실제 데이터 가져오기 (현재는 빈 배열 반환)
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}