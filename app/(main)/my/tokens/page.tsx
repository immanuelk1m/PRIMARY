'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { getTokenHistory } from '@/services/token.service';
import { TokenHistoryTable } from '@/components/feature/token/TokenHistoryTable';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
// import { Skeleton } from '@/components/ui/skeleton'; // Skeleton 컴포넌트가 없어 주석 처리
import { Database } from '@/types/database.types';

type TokenLog = Database['public']['Tables']['tokens_log']['Row'];

const ITEMS_PER_PAGE = 10; // 페이지당 항목 수

function TokenHistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading: userLoading } = useUser();

  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Number(searchParams.get('page') || '1');

  useEffect(() => {
    // 사용자 로딩 중이면 아무것도 안 함
    if (userLoading) return;

    // 로딩 완료 후 비로그인 상태면 로그인 페이지로
    if (!isLoggedIn) {
      router.replace('/login?redirect=/my/tokens'); // 로그인 후 돌아올 경로 지정
      return;
    }

    // 로그인 상태면 데이터 로드
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // user?.id가 필요할 수 있으나, getTokenHistory 구현에 따라 다름.
        // 현재 getTokenHistory는 서버에서 사용자 ID를 자동으로 가져온다고 가정.
        const { logs: fetchedLogs, count: fetchedCount } = await getTokenHistory(currentPage, ITEMS_PER_PAGE);
        setLogs(fetchedLogs);
        setCount(fetchedCount);
      } catch (err: any) {
        setError(err.message || '토큰 내역을 불러오는 중 오류가 발생했습니다.');
        setLogs([]); // 에러 시 데이터 초기화
        setCount(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, isLoggedIn, userLoading, router]); // currentPage, isLoggedIn, userLoading 변경 시 재실행

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/my/tokens?page=${newPage}`);
    }
  };

  // 사용자 로딩 중 또는 데이터 로딩 중 표시
  if (userLoading || isLoading) {
    // return <TokenHistorySkeleton />;
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>; // Skeleton 대신 간단한 로딩 메시지
  }

  // 데이터 로딩 중 표시 (사용자 로딩 완료 후) -> 위에서 통합 처리
  /* if (isLoading) {
     // return <TokenHistorySkeleton />;
     return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>; // Skeleton 대신 간단한 로딩 메시지
  } */

  // 에러 표시
  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  // 메인 컨텐츠 렌더링
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">토큰 내역</h1>
      {logs.length > 0 ? (
        <TokenHistoryTable logs={logs} />
      ) : (
        <p>토큰 사용 내역이 없습니다.</p> // 데이터 없을 때 메시지 추가
      )}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {/* 페이지 번호 로직 (개선 필요 시 추후 작업) */}
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); handlePageChange(i + 1); }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {/* 페이지 번호 로직에 Ellipsis 등 추가 가능 */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

// 로딩 스켈레톤 컴포넌트 (Skeleton 컴포넌트 부재로 제거)
/*
function TokenHistorySkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            Loading...
        </div>
    );
}
*/

// Suspense를 사용하여 searchParams 읽기 보장
export default function MyTokensPage() {
  return (
    // <Suspense fallback={<TokenHistorySkeleton />}>
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}> {/* Skeleton 대신 간단한 로딩 메시지 */}
      <TokenHistoryPageContent />
    </Suspense>
  );
}