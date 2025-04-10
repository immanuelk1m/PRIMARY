'use client'; // 클라이언트 컴포넌트

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminReportTable from '@/components/admin/AdminReportTable'; // 테이블 컴포넌트 import
import { ReportWithRelations } from '@/services/admin.service'; // 타입 import
import { getReportsForAdmin } from '@/services/admin.service'; // 데이터 가져오기 함수 import
import { toast } from 'sonner';
import type { Enums } from '@/types/database.types'; // Enums 타입 import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Select 컴포넌트 import
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'; // Pagination 컴포넌트 import

// 실제 페이지 로직을 담는 내부 컴포넌트
function AdminReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 상태 관리: 필터, 페이지, 로딩, 에러, 데이터, 총 개수
  const [statusFilter, setStatusFilter] = useState<Enums<'report_status'> | 'all'>(
    (searchParams.get('status') as Enums<'report_status'>) || 'all'
  );
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState(10); // 페이지당 항목 수
  const [reports, setReports] = useState<ReportWithRelations[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / limit);

  // API 호출 함수
  const fetchReports = useCallback(async (page: number, status: Enums<'report_status'> | 'all') => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (status !== 'all') params.set('status', status);

    // URL 업데이트 (API 호출 전에 수행하여 상태와 URL 동기화)
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('page', page.toString());
    if (status !== 'all') currentParams.set('status', status); else currentParams.delete('status');
    // router.push()는 useEffect 내에서 상태 변경 감지 후 호출하는 것이 더 일반적일 수 있으나,
    // 여기서는 fetch 직전에 URL을 동기화하는 방식으로 구현
    router.push(`?${currentParams.toString()}`, { scroll: false });

    try {
      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch reports: ${response.statusText}`);
      }
      const data = await response.json();
      const countHeader = response.headers.get('X-Total-Count');
      setReports(data as ReportWithRelations[]);
      setTotalCount(countHeader ? parseInt(countHeader, 10) : 0);
    } catch (err) {
      console.error("Error fetching reports:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast.error(`신고 목록 로딩 실패: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, searchParams]); // searchParams를 의존성에 추가

  // 상태 변경 시 API 호출
  useEffect(() => {
    // 컴포넌트 마운트 시 및 상태 변경 시 fetchReports 호출
    fetchReports(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchReports]); // fetchReports를 의존성에 포함

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 필터 변경 핸들러
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as Enums<'report_status'> | 'all');
    setCurrentPage(1); // 필터 변경 시 1페이지로 초기화
  };

  // 상태 업데이트 핸들러 (return 문 앞으로 이동)
  const handleUpdateStatus = useCallback(async (reportId: string, status: Enums<'report_status'>) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.statusText}`);
      }

      // 상태 업데이트 성공 시 목록 새로고침
      // fetchReports를 직접 호출하는 대신, 상태 변경을 유발하여 useEffect가 다시 실행되도록 할 수 있음
      // 하지만 여기서는 명시적으로 fetchReports를 호출하여 즉시 새로고침
      fetchReports(currentPage, statusFilter); // 현재 필터 유지하며 새로고침
      return true; // 성공 여부 반환
    } catch (err) {
      console.error("Error updating report status:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(`상태 업데이트 실패: ${message}`);
      return false; // 성공 여부 반환
    }
  }, [fetchReports, currentPage, statusFilter]);

  // 신고 상태 옵션 (DB Enum 기반)
  const reportStatusOptions: { value: Enums<'report_status'> | 'all'; label: string }[] = [
    { value: 'all', label: '모든 상태' },
    { value: 'received', label: '접수됨' },
    { value: 'processing', label: '처리중' },
    { value: 'resolved', label: '처리 완료' },
    { value: 'dismissed', label: '기각됨' },
  ];

  // Main return statement (하나만 존재)
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">신고 관리</h1>

      {/* 필터 UI */}
      <div className="flex gap-4 mb-4">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            {reportStatusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 로딩 및 에러 상태 표시 */}
      {isLoading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}

      {/* 신고 테이블 */}
      {!isLoading && !error && (
        <>
          <AdminReportTable reports={reports} onUpdateStatus={handleUpdateStatus} />
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 페이지 컴포넌트: Suspense로 내부 컴포넌트를 감싸서 내보냄
export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading reports...</div>}> {/* fallback UI 제공 */}
      <AdminReportsPageContent />
    </Suspense>
  );
}