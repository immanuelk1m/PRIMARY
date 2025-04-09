'use client'; // 클라이언트 컴포넌트

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminUserTable from '@/components/admin/AdminUserTable'; // 테이블 컴포넌트 import
import { Profile } from '@/types'; // 타입 import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'; // shadcn/ui Pagination 컴포넌트 상세 import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Select 컴포넌트 import
import { toast } from 'sonner';
import { debounce } from 'lodash-es'; // 디바운스 import

// TODO: 페이지네이션 컴포넌트 실제 경로 및 props 확인 필요

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 상태 관리: 검색어, 필터, 페이지, 로딩, 에러, 데이터, 총 개수
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState(10); // 페이지당 항목 수
  const [users, setUsers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / limit);

  // API 호출 함수
  const fetchUsers = useCallback(async (page: number, search: string, role: string, tier: string) => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (search) params.set('search', search);
    if (role !== 'all') params.set('role', role);
    if (tier !== 'all') params.set('tier', tier);

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      const countHeader = response.headers.get('X-Total-Count');
      setUsers(data as Profile[]);
      setTotalCount(countHeader ? parseInt(countHeader, 10) : 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast.error(`사용자 로딩 실패: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // 검색어 디바운스 처리
  const debouncedFetchUsers = useMemo(() => {
    return debounce((page: number, search: string, role: string, tier: string) => {
      fetchUsers(page, search, role, tier);
      // URL 업데이트
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      if (search) params.set('search', search); else params.delete('search');
      if (role !== 'all') params.set('role', role); else params.delete('role');
      if (tier !== 'all') params.set('tier', tier); else params.delete('tier');
      router.push(`?${params.toString()}`, { scroll: false }); // 페이지 이동 없이 URL만 변경
    }, 500); // 500ms 디바운스
  }, [fetchUsers, router, searchParams]);

  // 상태 변경 시 API 호출 (디바운스 적용)
  useEffect(() => {
    debouncedFetchUsers(currentPage, searchTerm, roleFilter, tierFilter);
    // 컴포넌트 언마운트 시 디바운스 취소
    return () => debouncedFetchUsers.cancel();
  }, [currentPage, searchTerm, roleFilter, tierFilter, debouncedFetchUsers]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">사용자 관리</h1>

      {/* 검색 및 필터 UI */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          type="text"
          placeholder="닉네임 또는 이메일 검색..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // 검색 시 1페이지로 초기화
          }}
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={(value: string) => { setRoleFilter(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 역할</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={(value: string) => { setTierFilter(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="티어 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 티어</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 로딩 및 에러 상태 표시 */}
      {isLoading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}

      {/* 사용자 테이블 */}
      {!isLoading && !error && (
        <>
          <AdminUserTable users={users} />
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#" // 실제 링크 대신 onClick 사용
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {/* 페이지 번호 로직 (간단 버전) */}
                  {/* TODO: 더 복잡한 페이지 번호 표시 로직 구현 (예: ..., 1, 2, 3, ..., 10) */}
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        href="#" // 실제 링크 대신 onClick 사용
                        onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {/* <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem> */}
                  <PaginationItem>
                    <PaginationNext
                      href="#" // 실제 링크 대신 onClick 사용
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              {/* 이전 임시 버튼 제거 완료 */}
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>다음</Button> */}
            </div>
          )}
        </>
      )}
    </div>
  );
}