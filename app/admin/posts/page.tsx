'use client'; // 클라이언트 컴포넌트

import { useState, useEffect, useCallback } from 'react';
import AdminPostTable from '@/components/admin/AdminPostTable'; // 테이블 컴포넌트 import
import { PostWithRelations } from '@/types'; // 타입 import
import { toast } from 'sonner'; // 토스트 메시지 import

// TODO: 실제 API 응답 타입에 맞게 Post 타입 조정 필요 (예: 작성자 정보 포함)

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]); // PostWithRelations 사용 또는 새 타입 정의
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: 상태 필터링 UI 및 상태 변수 추가 ('pending', 'approved', 'rejected')

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: 상태 필터링 파라미터 추가
      const response = await fetch('/api/admin/posts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch posts: ${response.statusText}`);
      }
      const data = await response.json();
      // TODO: API 응답 데이터 구조 확인 및 타입 캐스팅/변환
      setPosts(data as PostWithRelations[]);
    } catch (err) {
      console.error("Error fetching posts:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast.error(`게시물 로딩 실패: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []); // TODO: 필터 상태 변경 시 fetchPosts 다시 호출하도록 의존성 배열 수정

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleStatusUpdate = useCallback(async (postId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.statusText}`);
      }

      const result = await response.json();
      toast.success(result.message || '게시물 상태가 업데이트되었습니다.');
      fetchPosts(); // 목록 새로고침
      return true; // 성공 여부 반환
    } catch (err) {
      console.error("Error updating post status:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(`상태 업데이트 실패: ${message}`);
      return false; // 성공 여부 반환
    }
  }, [fetchPosts]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">콘텐츠 관리</h1>
      {/* TODO: 상태 필터링 UI (Select, Button 등) */}
      {isLoading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}
      {!isLoading && !error && (
        <AdminPostTable
          posts={posts}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
}