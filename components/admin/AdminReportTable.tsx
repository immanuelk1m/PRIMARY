'use client';

import { ReportWithRelations } from '@/services/admin.service'; // 타입 import
import type { Enums } from '@/types/database.types'; // Enums 타입 import 추가
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Button import 추가
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // DropdownMenu import 추가
import { format } from 'date-fns'; // 날짜 포맷팅
import { toast } from 'sonner'; // toast import 추가
import { useState } from 'react'; // useState import 추가
import Link from 'next/link'; // 게시물 링크용

interface AdminReportTableProps {
  reports: ReportWithRelations[];
  onUpdateStatus?: (reportId: string, status: Enums<'report_status'>) => Promise<boolean>; // 상태 업데이트 콜백 추가 (선택적)
}

export default function AdminReportTable({ reports, onUpdateStatus }: AdminReportTableProps) {
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({}); // 처리 중 상태 관리

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'resolved': return 'default';
      case 'dismissed': return 'outline';
      case 'processing': return 'secondary';
      case 'received':
      default:
        return 'destructive'; // 'received' 상태를 강조하기 위해 destructive 사용 (또는 다른 색상)
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>신고 ID</TableHead>
          <TableHead>게시물 제목</TableHead>
          <TableHead>신고자</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>신고 시간</TableHead>
          <TableHead className="text-right">작업</TableHead> {/* 작업 컬럼 추가 */}
          {/* <TableHead>작업</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">신고 내역이 없습니다.</TableCell> {/* colSpan 수정 */}
          </TableRow>
        ) : (
          reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-mono text-xs">{report.id}</TableCell>
              <TableCell>
                {report.posts ? (
                  <Link href={`/posts/${report.post_id}`} className="hover:underline" target="_blank">
                    {report.posts.title}
                  </Link>
                ) : (
                  '삭제된 게시물'
                )}
              </TableCell>
              <TableCell>{report.users?.nickname ?? '알 수 없음'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(report.status)}>{report.status ?? 'unknown'}</Badge>
              </TableCell>
              <TableCell>{report.created_at ? format(new Date(report.created_at), 'yyyy-MM-dd HH:mm') : '-'}</TableCell>
              <TableCell className="text-right">
                {/* 처리 가능한 상태일 때만 버튼 표시 (예: received, processing) */}
                {(report.status === 'received' || report.status === 'processing') && onUpdateStatus && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isSubmitting[report.id]}>
                        {isSubmitting[report.id] ? '처리중...' : '상태 변경'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={async () => {
                          setIsSubmitting(prev => ({ ...prev, [report.id]: true }));
                          const success = await onUpdateStatus(report.id, 'processing');
                          if (success) toast.success(`신고 ${report.id} 상태를 '처리중'으로 변경했습니다.`);
                          setIsSubmitting(prev => ({ ...prev, [report.id]: false }));
                        }}
                        disabled={report.status === 'processing'}
                      >
                        처리중으로 변경
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          setIsSubmitting(prev => ({ ...prev, [report.id]: true }));
                          const success = await onUpdateStatus(report.id, 'resolved');
                          if (success) toast.success(`신고 ${report.id} 상태를 '처리 완료'로 변경했습니다.`);
                          setIsSubmitting(prev => ({ ...prev, [report.id]: false }));
                        }}
                      >
                        처리 완료로 변경
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          setIsSubmitting(prev => ({ ...prev, [report.id]: true }));
                          const success = await onUpdateStatus(report.id, 'dismissed');
                          if (success) toast.success(`신고 ${report.id} 상태를 '기각됨'으로 변경했습니다.`);
                          setIsSubmitting(prev => ({ ...prev, [report.id]: false }));
                        }}
                      >
                        기각됨으로 변경
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
              {/* <TableCell> <Button size="sm">처리</Button> </TableCell> */}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}