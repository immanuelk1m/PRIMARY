import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateReportStatusForAdmin } from '@/services/admin.service';
import type { Enums } from '@/types/database.types';
import { z } from 'zod';

// 요청 본문 유효성 검사 스키마
const updateStatusSchema = z.object({
  status: z.enum(['processing', 'resolved', 'dismissed']), // 변경 가능한 상태
});

export async function PUT(
  request: Request,
  { params }: { params: { reportId: string } } // 경로 매개변수 reportId 추출
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies;
  const supabase = createSupabaseServerClient(cookieStore);
  const { reportId } = params;

  // 1. 사용자 인증 확인
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('API Auth Error:', sessionError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 관리자 권한 확인
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { p_user_id: session.user.id });
  if (rpcError || !isAdmin) {
    console.warn(`API Admin Access Denied: User ${session.user.id}. IsAdmin: ${isAdmin}, Error: ${rpcError?.message}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. 요청 본문 파싱 및 유효성 검사
  let newStatus: Enums<'report_status'>;
  try {
    const body = await request.json();
    const parsedBody = updateStatusSchema.parse(body);
    newStatus = parsedBody.status;
  } catch (error) {
    console.error('API Error parsing request body:', error);
    const errorMessage = error instanceof z.ZodError ? error.errors : 'Invalid request body';
    return NextResponse.json({ error: 'Bad Request', details: errorMessage }, { status: 400 });
  }

  // 4. 서비스 함수 호출
  try {
    const result = await updateReportStatusForAdmin(reportId, newStatus, session.user.id);
    if (result.success) {
      return NextResponse.json({ message: `Report ${reportId} status updated to ${newStatus}` });
    } else {
      // 서비스 함수에서 구체적인 실패 이유를 반환하도록 개선 가능
      return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
    }
  } catch (error) {
    console.error(`API Error updating report ${reportId} status:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}