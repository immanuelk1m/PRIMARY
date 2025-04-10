import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // 래퍼 함수 import 복원
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // 직접 import 제거
// 요청 본문 유효성 검사 스키마
const signupSchema = z.object({
  name: z.string().min(1, { message: '이름을 입력해주세요.' }),
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(8, { message: '비밀번호는 8자 이상이어야 합니다.' }),
});

export async function POST(request: Request) {
  const cookieStore = await cookies(); // await 추가
  // const supabase = createSupabaseServerClient(cookieStore); // 이동됨

  let requestBody;
  let supabase; // supabase 변수 선언 위치 변경

  try {
    requestBody = await request.json();
    supabase = createSupabaseServerClient(cookieStore); // 래퍼 함수 호출 복원 (이동된 위치)
  } catch { // Removed unused variable binding
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  // 유효성 검사
  const validationResult = signupSchema.safeParse(requestBody);

  if (!validationResult.success) {
    // Zod 오류 메시지를 좀 더 사용자 친화적으로 가공할 수 있습니다.
    // 여기서는 간단하게 첫 번째 오류 메시지만 사용하거나, 모든 오류를 포함시킬 수 있습니다.
    const errorMessages = validationResult.error.flatten().fieldErrors;
    const firstErrorMessage = Object.values(errorMessages).flat()[0] || '유효하지 않은 입력입니다.';

    return NextResponse.json(
      { error: firstErrorMessage, details: errorMessages },
      { status: 400 }
    );
  }

  const { name, email, password } = validationResult.data;

  try {
    // Supabase 회원가입 시도
    // supabase 변수가 첫 번째 try 블록에서 할당되었으므로 여기서 사용 가능
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 사용자 이름을 metadata에 저장 (handle_new_user 트리거에서 사용)
        data: {
          nickname: name,
        },
        // 이메일 확인 비활성화 상태이므로, emailRedirectTo는 필요하지 않습니다.
        // 만약 이메일 확인을 사용한다면 아래 주석을 해제하고 경로를 설정해야 합니다.
        // emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      // Supabase 에러 코드나 메시지를 기반으로 더 구체적인 분기 처리가 가능합니다.
      // 예: error.code === '23505' (unique_violation)
      if (error.message.includes('User already registered') || error.code === '23505') {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 }); // Conflict
      }
      // 그 외 Supabase 관련 오류
      return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.', details: error.message }, { status: 500 });
    }

    // 성공 응답
    // data.user 객체에는 생성된 사용자 정보가 포함됩니다. 필요에 따라 반환할 수 있습니다.
    // 주의: 이메일 확인이 비활성화되어 있으므로 사용자는 즉시 활성 상태입니다.
    // data.session은 일반적으로 이메일 확인 후 생성되거나, 자동 로그인이 활성화된 경우 생성될 수 있습니다.
    // 현재 설정에서는 data.session이 null일 수 있습니다.
    return NextResponse.json({ message: '회원가입이 성공적으로 완료되었습니다.', userId: data.user?.id }, { status: 201 }); // Created

  } catch (err) {
    console.error('Signup API error:', err);
    // 예기치 못한 서버 내부 오류
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}