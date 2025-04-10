import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'; // 정확한 타입 경로
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 서버 클라이언트 import
// import { updatePostStatusForAdmin } from '@/services/admin.service'; // 서비스 함수 직접 호출 대신 DB 함수 또는 Admin Client 사용
import { PostStatus } from '@/types'; // PostStatus 타입 import
import { createSupabaseAdminClient } from '@/lib/supabase/admin'; // Admin Client import 추가
import { z } from 'zod'; // zod import for validation

// 요청 본문 유효성 검사 스키마 (반려 사유 추가)
const updateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']), // 관리자가 변경할 수 있는 상태
  reason: z.string().optional(), // 반려 시 사유 (선택적)
});

export async function PUT(
  request: Request,
  { params }: { params: { postId: string } } // 경로 매개변수 postId 추출
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies; // unknown을 통한 타입 단언
  const supabase = createSupabaseServerClient(cookieStore);
  const { postId } = params;

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

  // 3. 요청 본문 파싱 및 유효성 검사
  let newStatus: PostStatus;
  let rejectionReason: string | undefined; // 변수 선언 위치 변경
  try {
    const body = await request.json();
    // status가 'rejected'일 때만 reason이 필요하도록 refine 추가 가능
    const parsedBody = updateStatusSchema.parse(body);
    newStatus = parsedBody.status;
    rejectionReason = parsedBody.reason; // 변수 할당

    if (newStatus === 'rejected' && !rejectionReason) {
      return NextResponse.json({ error: 'Bad Request', details: 'Rejection reason is required when status is rejected.' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error parsing request body:', error);
    const errorMessage = error instanceof z.ZodError ? error.errors : 'Invalid request body';
    return NextResponse.json({ error: 'Bad Request', details: errorMessage }, { status: 400 });
  }

  // 4. 관리자 권한 확인 후 상태에 따라 처리 분기
  try {
    if (newStatus === 'approved') {
      // DB 함수 호출 (트랜잭션)
      const { data: approved, error: approveError } = await supabase.rpc('approve_post_and_grant_token', {
        p_post_id: postId,
        p_admin_id: session.user.id // 실행 관리자 ID 전달
      });

      if (approveError || !approved) {
        console.error(`API Error approving post ${postId}:`, approveError?.message);
        // approved가 false인 경우는 함수 내부 로직에 의해 처리된 것 (예: 이미 승인됨)
        const errorMessage = approveError ? 'Database error during approval' : 'Post not found or already approved';
        return NextResponse.json({ error: errorMessage }, { status: approveError ? 500 : 404 });
      }
      return NextResponse.json({ message: `Post ${postId} approved and token granted.` });
    } if (newStatus === 'rejected') {
      // Admin Client 사용하여 직접 업데이트 (반려 로직)
      const supabaseAdmin = createSupabaseAdminClient();
      const { error: rejectError } = await supabaseAdmin
        .from('posts')
        .update({ status: 'rejected', rejection_reason: rejectionReason, approved_at: null }) // approved_at 초기화
        .eq('id', postId);

      if (rejectError) {
        console.error(`API Error rejecting post ${postId}:`, rejectError.message);
        return NextResponse.json({ error: 'Database error during rejection' }, { status: 500 });
      }
      return NextResponse.json({ message: `Post ${postId} rejected.` });
    }
  } catch (error) {
    console.error(`API Error updating post ${postId} status:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}