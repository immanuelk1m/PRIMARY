import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // 경로 수정 (@/ 사용)
import type { Database } from '@/types/database.types'; // 경로 수정 (@/ 사용)

// 타입 정의
type Post = Database['public']['Tables']['posts']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

// 작성자 닉네임만 포함하는 타입 (users 테이블 전체 대신)
type AuthorInfo = Pick<User, 'nickname'>;
// 태그 이름만 포함하는 타입 (tags 테이블 전체 대신)
export type TagInfo = Pick<Tag, 'name'>; // export 추가

// 게시물 목록 조회 시 반환 타입 (작성자 닉네임 포함)
export type PostWithAuthor = Post & { users: AuthorInfo | null };
// 게시물 상세 조회 시 반환 타입 (작성자 닉네임, 태그 이름 목록 포함)
export type PostWithDetails = Post & { users: AuthorInfo | null; tags: TagInfo[] };

// 클라이언트 측에서 주로 사용될 것으로 가정하고 BrowserClient 사용
const supabase = createSupabaseBrowserClient();

/**
 * 승인된 게시물 목록을 페이지네이션하여 조회합니다.
 * @param page - 조회할 페이지 번호 (1부터 시작)
 * @param limit - 페이지당 게시물 수
 * @returns 게시물 목록과 전체 개수
 */
export async function getApprovedPosts(page: number = 1, limit: number = 10): Promise<{ posts: PostWithAuthor[], count: number | null }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.log(`Fetching approved posts: page=${page}, limit=${limit}, range=${from}-${to}`); // 디버깅 로그

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, users(nickname)', { count: 'exact' }) // 작성자 닉네임 join, 전체 개수 요청
    .eq('status', 'approved') // 'approved' 상태 필터링
    .order('created_at', { ascending: false }) // 최신순 정렬
    .range(from, to); // 페이지네이션 범위

  if (error) {
    console.error('Error fetching approved posts:', error);
    throw error; // 오류 발생 시 에러 throw
  }

  console.log(`Fetched ${data?.length || 0} posts, total count: ${count}`); // 디버깅 로그
  // data가 null일 경우 빈 배열 반환
  return { posts: (data as PostWithAuthor[] | null) || [], count };
}

/**
 * 게시물 ID로 상세 정보를 조회합니다. (작성자 닉네임, 태그 이름 포함)
 * RLS 정책에 따라 접근 권한이 없으면 null을 반환할 수 있습니다.
 * @param postId - 조회할 게시물의 ID
 * @returns 게시물 상세 정보 또는 null (Not Found 또는 권한 없음)
 */
export async function getPostById(postId: string): Promise<PostWithDetails | null> {
   console.log(`Fetching post details for ID: ${postId}`); // 디버깅 로그
   const { data, error } = await supabase
    .from('posts')
    .select('*, users(nickname), tags(name)') // 작성자 닉네임, 태그 이름 join
    .eq('id', postId)
    .single(); // 단일 결과 조회

    if (error) {
        // 'PGRST116' 코드는 결과가 없음을 의미 (RLS 또는 실제 데이터 없음)
        if (error.code !== 'PGRST116') {
            console.error('Error fetching post by id:', error);
        } else {
            console.log(`Post not found or RLS prevented access for ID: ${postId}`); // 디버깅 로그
        }
        return null; // 오류 또는 결과 없음 시 null 반환
    }
    console.log('Post details fetched successfully:', data); // 디버깅 로그
    // Supabase 타입 추론이 join된 테이블의 타입을 완벽히 반영하지 못할 수 있으므로 타입 단언 사용
    return data as PostWithDetails;
}

// --- 게시물 생성, 수정, 삭제는 API Route (서버 측)에서 처리 ---
// 아래 함수들은 클라이언트에서 직접 호출되지 않도록 주의하거나,
// 서버 API를 호출하는 형태로 구현해야 합니다.

/*
// 예시: 서버 API 엔드포인트를 호출하는 함수 (클라이언트용)
export async function createPost(postData: Pick<Post, 'title' | 'content' | 'view_limit'>): Promise<Post | null> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  if (!response.ok) {
    console.error('Failed to create post via API');
    return null;
  }
  return await response.json();
}
*/