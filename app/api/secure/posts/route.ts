import { cookies } from 'next/headers'; // 서버 컴포넌트/API 라우트에서 쿠키 접근
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'; // Admin 클라이언트 import
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Server 클라이언트 import
import { postCreateSchema } from '@/lib/validators'; // Zod 스키마 import

export async function POST(request: NextRequest) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies; // unknown을 통한 타입 단언
  const supabaseAuth = createSupabaseServerClient(cookieStore); // 인증 확인용 Server 클라이언트 생성

  // 1. 사용자 인증 확인
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    console.error('Unauthorized API access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 요청 본문 파싱 및 유효성 검사
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = postCreateSchema.safeParse(body); // Zod 스키마로 검증

  if (!validation.success) {
    console.warn('Invalid post creation input:', validation.error.errors);
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, content, viewLimit, tags } = validation.data;

  // 3. 태그 문자열 처리 (콤마 구분 -> 배열, 공백 제거, 최대 5개 제한)
  const tagList = tags ? tags.split(',')
                          .map((tag: string) => tag.trim())
                          .filter((tag: string) => tag.length > 0)
                          .slice(0, 5) // 최대 5개까지만 사용
                     : []; // tags가 undefined일 경우 빈 배열

  // 4. DB 함수 호출 (Admin 클라이언트 사용)
  const supabaseAdmin = createSupabaseAdminClient(); // Admin 클라이언트 생성
  try {
    console.log(`Calling create_post_with_tags for user: ${user.id}`);
    const { data: postId, error: rpcError } = await supabaseAdmin.rpc('create_post_with_tags', {
      p_user_id: user.id,
      p_title: title,
      p_content: content,
      p_view_limit: viewLimit ?? null, // viewLimit이 undefined이면 null 전달
      p_tags: tagList,
    });

    if (rpcError) {
      console.error('RPC error calling create_post_with_tags:', rpcError);
      throw rpcError; // 에러 발생 시 catch 블록으로 전달
    }

    console.log(`Post created successfully with ID: ${postId}`);
    // 성공 시 생성된 postId 반환 (201 Created)
    return NextResponse.json({ postId }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating post in API route:', error);
    // 데이터베이스 오류 또는 기타 서버 오류 처리
    return NextResponse.json({ error: 'Failed to create post', details: error.message || 'Unknown server error' }, { status: 500 });
  }
}