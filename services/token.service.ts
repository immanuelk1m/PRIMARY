import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { Database } from '../types/database.types';

// TokenLog 타입을 명시적으로 정의하거나 Database 타입에서 가져옵니다.
type TokenLog = Database['public']['Tables']['tokens_log']['Row'];

const supabase = createSupabaseBrowserClient();

/**
 * 사용자의 토큰 내역을 페이지네이션과 함께 조회합니다.
 * 클라이언트 측에서 호출 시 RLS 정책에 의해 자동으로 현재 사용자 필터링됩니다.
 * @param page 조회할 페이지 번호 (1부터 시작)
 * @param limit 페이지당 항목 수
 * @returns 토큰 로그 목록과 전체 개수
 */
export async function getTokenHistory(page: number = 1, limit: number = 10): Promise<{ logs: TokenLog[], count: number | null }> {
  // 페이지 번호 유효성 검사 (선택 사항)
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // RLS 정책(본인 조회)이 적용되므로 클라이언트 호출 시 별도 userId 조건 불필요
  const { data, error, count } = await supabase
    .from('tokens_log')
    .select('*', { count: 'exact' }) // count: 'exact'로 전체 개수 조회
    .order('created_at', { ascending: false }) // 최신순 정렬
    .range(from, to); // 페이지네이션 범위 지정

  if (error) {
    console.error('Error fetching token history:', error);
    // 실제 프로덕션에서는 에러 로깅 서비스 사용 고려
    throw new Error('토큰 내역을 불러오는 중 오류가 발생했습니다.'); // 사용자 친화적 메시지 또는 에러 객체 그대로 throw
  }

  return { logs: data || [], count }; // data가 null일 경우 빈 배열 반환
}