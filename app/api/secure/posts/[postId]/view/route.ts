import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Define the expected structure of the RPC result
interface RpcResult {
  can_view: boolean;
  message: string;
}
// ConsumeTokenResult is unused, so it's removed.
// interface ConsumeTokenResult {
//   can_view: boolean;
//   message: string;
// }

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  // Use @ts-expect-error instead of @ts-ignore for the cookie type issue
  // TODO: Investigate Supabase SSR types for NextRequest cookies or alternative client creation
  // @ts-expect-error // No longer needed as we use cookies() from next/headers
  const supabaseAuth = createSupabaseServerClient(cookies()); // 인증 확인용 (next/headers의 cookies() 사용)

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const postId = params.postId;
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  try {
    // DB 함수 호출, specify the expected return type for the RPC call
    const { data: rpcDataUntyped, error: rpcError } = await supabaseAdmin
      .rpc<'consume_token_for_view', RpcResult[]>('consume_token_for_view', { // Specify function name and expected array type
        p_user_id: user.id,
        p_post_id: postId,
      });

    if (rpcError) throw rpcError; // RPC 오류 발생 시 즉시 throw

    // 결과 처리 로직 개선
    let canView = false;
    let message = '열람 권한이 없습니다.'; // 기본 메시지

    // Check if data is an array and has at least one element
    if (rpcDataUntyped && Array.isArray(rpcDataUntyped) && rpcDataUntyped.length > 0) {
      const firstResult = rpcDataUntyped[0]; // Access the first element
      if (firstResult?.can_view === true) { // Use optional chaining
        canView = true;
        message = firstResult.message || '성공적으로 열람했습니다.';
      } else {
        // can_view가 false거나 없는 경우
        message = firstResult?.message || '열람 권한이 없습니다.'; // DB 메시지가 있다면 사용
      }
    }
    // rpcData가 유효하지 않은 경우 (null, 빈 배열 등) 기본 메시지 사용됨

    if (!canView) {
      return NextResponse.json({ canView: false, message: message }, { status: 403 }); // Forbidden
    }

    // 성공 시 (열람 가능)
    return NextResponse.json({ canView: true, message: message });
} catch (error: unknown) { // Changed 'any' to 'unknown'
  console.error('Error consuming token for view:', error);
  // Extract error message safely
  const errorMessage = (error instanceof Error) ? error.message : 'Failed to process view request';

  // catch 블록에서는 canView가 false라고 가정
  return NextResponse.json({ canView: false, error: 'Failed to process view request', details: errorMessage }, { status: 500 });
}
}