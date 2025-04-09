'use client';

import { useState } from 'react';
import { PostWithRelations } from '@/types'; // 타입 import
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // 날짜 포맷팅
// TODO: 반려 사유 입력을 위한 모달 컴포넌트 import 및 상태 관리 추가
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';

interface AdminPostTableProps {
  posts: PostWithRelations[]; // TODO: API 응답에 맞게 타입 조정 (작성자 닉네임 등 포함)
  onUpdateStatus: (postId: string, status: 'approved' | 'rejected', reason?: string) => Promise<boolean>;
}

export default function AdminPostTable({ posts, onUpdateStatus }: AdminPostTableProps) {
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  // TODO: 반려 모달 상태 관리
  // const [showRejectModal, setShowRejectModal] = useState(false);
  // const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  // const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async (postId: string) => {
    setIsSubmitting(prev => ({ ...prev, [postId]: true }));
    await onUpdateStatus(postId, 'approved');
    setIsSubmitting(prev => ({ ...prev, [postId]: false }));
  };

  const handleRejectClick = (postId: string) => {
    // TODO: 모달 열기 로직
    // setRejectingPostId(postId);
    // setShowRejectModal(true);
    // 임시: 바로 반려 처리 (사유 없이) - 실제 구현 시 모달 사용
    handleRejectConfirm(postId, '관리자에 의해 반려됨 (임시 사유)');
  };

  const handleRejectConfirm = async (postId: string, reason: string) => {
    // TODO: 모달에서 호출될 로직
    // if (!rejectingPostId) return;
    setIsSubmitting(prev => ({ ...prev, [postId]: true }));
    await onUpdateStatus(postId, 'rejected', reason);
    setIsSubmitting(prev => ({ ...prev, [postId]: false }));
    // setShowRejectModal(false);
    // setRejectingPostId(null);
    // setRejectionReason('');
  };

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default'; // shadcn 기본 variant (보통 녹색 계열)
      case 'rejected': return 'destructive'; // shadcn 파괴적 variant (보통 빨간색 계열)
      case 'pending': return 'secondary'; // shadcn 보조 variant (보통 회색 계열)
      default: return 'outline';
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">게시물이 없습니다.</TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                {/* TODO: API 응답에 users 객체가 포함되어야 함 */}
                <TableCell>{post.users?.nickname ?? '알 수 없음'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(post.status)}>{post.status ?? 'unknown'}</Badge>
                </TableCell>
                <TableCell>{post.created_at ? format(new Date(post.created_at), 'yyyy-MM-dd HH:mm') : '-'}</TableCell>
                <TableCell className="space-x-2">
                  {post.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(post.id)}
                        disabled={isSubmitting[post.id]}
                      >
                        {isSubmitting[post.id] ? '처리중...' : '승인'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(post.id)}
                        disabled={isSubmitting[post.id]}
                      >
                        {isSubmitting[post.id] ? '처리중...' : '반려'}
                      </Button>
                    </>
                  )}
                  {/* TODO: 다른 상태일 때의 작업 버튼 추가 (예: 승인 취소) */}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* TODO: 반려 사유 입력 모달 구현 */}
      {/* <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}> ... </Dialog> */}
    </>
  );
}