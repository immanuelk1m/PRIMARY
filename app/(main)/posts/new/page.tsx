'use client'; // 폼 상호작용 및 상태 관리를 위해 클라이언트 컴포넌트

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostForm from '@/components/feature/post/PostForm'; // 경로 수정
import type { PostCreateInput } from '@/lib/validators'; // 경로 수정
// import { useUser } from '@/hooks/useUser'; // 경로 수정 (필요시 사용자 정보 접근)

export default function NewPostPage() {
  const router = useRouter();
  // const { user, isLoading: userLoading } = useUser(); // 사용자 정보 필요 시
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 폼 제출 핸들러 (Story 4.5에서 API 호출 로직 추가)
  const handleCreatePost = async (data: PostCreateInput) => {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Form submitted data:', data); // 제출 데이터 확인용 로그

    try {
      // --- Story 4.5: API 호출 로직 ---
      const response = await fetch('/api/secure/posts', { // API 경로 확인
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시물 생성에 실패했습니다.');
      }

      const result = await response.json();
      console.log('Post created successfully:', result);

      // 성공 시 생성된 게시물 상세 페이지 또는 다른 경로로 이동
      // router.push(`/posts/${result.postId}`);
      router.push('/posts'); // 예시: 목록 페이지로 이동
      router.refresh(); // 캐시된 데이터 갱신 (선택적)
      // TODO: 성공 메시지 표시 (Toast 등)

    } catch (error: any) {
      console.error('Failed to create post:', error);
      setSubmitError(error.message || '게시물 생성 중 오류가 발생했습니다.');
      setIsSubmitting(false); // 오류 발생 시 제출 상태 해제
    }
    // 성공 시에는 리디렉션되므로 isSubmitting 해제 불필요할 수 있음
  };

  // 사용자 로딩 중 표시 (선택적)
  // if (userLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">새 게시물 작성</h1>
      <PostForm onSubmit={handleCreatePost} isSubmitting={isSubmitting} />
      {/* PostForm 내부에서도 에러 표시하지만, 페이지 레벨 에러 표시도 가능 */}
      {/* {submitError &amp;&amp; <p className="text-red-500 mt-4">{submitError}</p>} */}
    </div>
  );
}