// import { cookies } from 'next/headers'; // Removed unused import
// import Link from 'next/link'; // Removed unused import
// import { createSupabaseServerClient } from '@/lib/supabase/server'; // Removed unused import
import { getApprovedPosts } from '@/services/post.service'; // 경로 확인
import type { PostWithAuthor } from '@/services/post.service'; // 게시물 타입 import
import PostCard from '@/components/feature/post/PostCard'; // 경로 확인
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'; // 경로 확인

// 페이지 컴포넌트는 기본적으로 서버 컴포넌트
export default async function PostsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  // Server client creation removed as it's not used directly here
  // const cookieStore = cookies();
  // const supabase = createSupabaseServerClient(cookieStore);

  const currentPage = Number(searchParams?.page || '1');
  const postsPerPage = 10; // 페이지당 게시물 수 (환경 변수 등으로 관리 가능)

  // 서비스 함수 호출하여 데이터 가져오기
  // Assuming getApprovedPosts is designed to work in server components
  // (e.g., uses server client internally or accepts one)
  let postsData: Awaited<ReturnType<typeof getApprovedPosts>> | null = null;
  let fetchError: string | null = null;

  try {
    // Use the service function directly
    postsData = await getApprovedPosts(currentPage, postsPerPage);
    // The temporary direct DB access block is removed as we rely on the service function

  } catch (error) {
    console.error('Error fetching posts:', error);
    fetchError = '게시물을 불러오는 중 오류가 발생했습니다.';
  }

  const posts = postsData?.posts || [];
  const count = postsData?.count || 0;
  const totalPages = Math.ceil(count / postsPerPage);

  // 페이지네이션 아이템 생성 로직
  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5; // 한 번에 보여줄 최대 페이지 수
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, currentPage + halfMaxPages);

    if (currentPage <= halfMaxPages) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }
    if (currentPage + halfMaxPages >= totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    // Previous 버튼
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          href={currentPage > 1 ? `/posts?page=${currentPage - 1}` : '#'}
          aria-disabled={currentPage <= 1}
          tabIndex={currentPage <= 1 ? -1 : undefined}
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
        />
      </PaginationItem>
    );

    // 첫 페이지 및 ...
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink href="/posts?page=1">1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
    }

    // 중간 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href={`/posts?page=${i}`} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // 마지막 페이지 및 ...
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href={`/posts?page=${totalPages}`}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    // Next 버튼
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          href={currentPage < totalPages ? `/posts?page=${currentPage + 1}` : '#'}
          aria-disabled={currentPage >= totalPages}
          tabIndex={currentPage >= totalPages ? -1 : undefined}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
        />
      </PaginationItem>
    );

    return items;
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">게시물 목록</h1>

      {fetchError && <p className="text-red-500 text-center mb-4">{fetchError}</p>}

      {posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post: PostWithAuthor) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        !fetchError && <p className="text-center text-muted-foreground mt-8">게시물이 없습니다.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination>
            <PaginationContent>
              {renderPaginationItems()}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}