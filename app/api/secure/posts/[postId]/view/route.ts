import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'; // 경로 수정됨, 이름 수정됨
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 경로 수정됨, 이름 수정됨, 사용자 인증용
// import { cookies } from 'next/headers'; // 사용 안 함

// RPC 함수 반환 타입 정의 (참고용)
interface ConsumeTokenResult {
  can_view: boolean;
  message: string;
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  // 쿠키 타입 오류 임시 해결 (@ts-ignore 사용)
  // @ts-ignore
  const supabaseAuth = createSupabaseServerClient(request.cookies); // 인증 확인용 (request.cookies 사용)

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const postId = params.postId;
  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient(); // 이름 수정됨
  try {
    // DB 함수 호출 (제네릭 제거)
    const { data: rpcDataUntyped, error: rpcError } = await supabaseAdmin
      .rpc('consume_token_for_view', { // 제네릭 제거
        p_user_id: user.id,
        p_post_id: postId,
      });

    if (rpcError) throw rpcError; // RPC 오류 발생 시 즉시 throw

    // 타입 오류 임시 해결 (any 사용)
    const rpcData = rpcDataUntyped as any;

    // 결과 처리 로직 개선
    let canView = false;
    let message = '열람 권한이 없습니다.'; // 기본 메시지

    if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      const firstResult = rpcData[0]; // any 타입이므로 속성 접근 가능해야 함
      if (firstResult && firstResult.can_view === true) {
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

  } catch (error: any) {
    console.error('Error consuming token for view:', error);
    // DB 함수 내 오류 메시지 또는 일반 오류 메시지 전달
    const errorMessage = error.details || error.message || 'Failed to process view request';
    // catch 블록에서는 canView가 false라고 가정
    return NextResponse.json({ canView: false, error: 'Failed to process view request', details: errorMessage }, { status: 500 });
  }
}