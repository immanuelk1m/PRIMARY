import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'; // 정확한 타입 경로로 수정
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 서버 클라이언트 import 수정
import { getUsersForAdmin } from '@/services/admin.service'; // 관리자 서비스 함수 import
import type { Enums } from '@/types/database.types'; // Enums 타입 import 추가

export async function GET(request: Request) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies; // unknown을 통한 타입 단언
  const supabase = createSupabaseServerClient(cookieStore); // 함수 이름 수정

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

  // 3. 쿼리 파라미터 파싱
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const search = url.searchParams.get('search') || undefined;
  const role = url.searchParams.get('role') as Enums<'user_role'> | undefined; // 타입 단언
  const tier = url.searchParams.get('tier') as Enums<'user_tier'> | undefined; // 타입 단언

  // 4. 관리자 권한 확인 후 서비스 함수 호출
  try {
    const { users, count } = await getUsersForAdmin({ page, limit, search, role, tier });
    // 페이지네이션 정보를 헤더에 포함 (선택적)
    const response = NextResponse.json(users);
    response.headers.set('X-Total-Count', count.toString());
    response.headers.set('X-Page', page.toString());
    response.headers.set('X-Limit', limit.toString());
    return response;
  } catch (error) {
    console.error('API Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}