import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // 경로 수정
import type { Profile } from '@/types'; // 경로 수정

// 클라이언트 측에서 주로 사용될 것으로 가정하고 BrowserClient 사용
// 서버 측 호출이 필요하면 별도 함수 또는 클라이언트 주입 방식 고려
const supabase = createSupabaseBrowserClient();

/**
 * 현재 로그인된 사용자의 ID를 기반으로 프로필 정보를 조회합니다.
 * @param userId - 조회할 사용자의 ID (Supabase Auth User ID)
 * @returns 프로필 정보 또는 null (오류 발생 또는 프로필 없음)
 */
export async function getCurrentUserProfile(userId: string): Promise<Profile | null> {
  console.log(`Fetching profile for user ID: ${userId}`); // 디버깅 로그
  const { data, error } = await supabase
    .from('users') // 테이블 이름 확인 ('users'가 맞는지 확인)
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    // RLS 정책 위반 또는 네트워크 오류 등 다양한 원인 가능
    // 필요에 따라 에러를 throw 하거나 특정 에러 처리를 추가할 수 있음
    return null;
  }
  console.log('Profile fetched successfully:', data); // 디버깅 로그
  return data;
}

/**
 * 사용자 프로필 정보를 업데이트합니다. (MVP 범위 확인 필요)
 * @param userId - 업데이트할 사용자의 ID
 * @param updates - 업데이트할 프로필 정보 (Partial<Profile>)
 * @returns 업데이트된 프로필 정보 또는 null (오류 발생)
 */
export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
   // 주의: 클라이언트에서 직접 호출 시 RLS 정책(본인 수정 허용) 필수
   // 업데이트 가능한 필드를 명확히 제한하는 것이 보안상 중요합니다.
   // 예시: nickname만 업데이트 허용
   const allowedUpdates: Partial<Profile> = {};
   if (updates.nickname !== undefined) {
     allowedUpdates.nickname = updates.nickname;
   }
   // 다른 허용 필드 추가...

   if (Object.keys(allowedUpdates).length === 0) {
     console.warn('No allowed fields to update.');
     return null; // 업데이트할 내용 없음
   }

   console.log(`Updating profile for user ID: ${userId} with data:`, allowedUpdates); // 디버깅 로그
   const { data, error } = await supabase
    .from('users')
    .update(allowedUpdates)
    .eq('id', userId)
    .select() // 업데이트된 데이터 반환
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  console.log('Profile updated successfully:', data); // 디버깅 로그
  return data;
}