import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This client uses the SERVICE_ROLE_KEY and should only be used on the server-side
// (e.g., API Routes, server components with server-only logic).
// Never expose the SERVICE_ROLE_KEY to the client-side!
export function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase URL or Service Role Key for admin client');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // 자동 갱신 비활성화 (서비스 키는 만료되지 않음)
        autoRefreshToken: false,
        // 로컬 스토리지 사용 안 함 (서버 환경)
        persistSession: false,
      },
    }
  );
}