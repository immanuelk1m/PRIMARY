'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../../../../hooks/useUser';
import MarkdownRenderer from '../../../../components/common/MarkdownRenderer';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Post } from 'types'; // Post 타입 import (경로 및 타입명 확인 필요)

// 서버에서 미리 가져온 게시물 데이터 타입 (getPostById 반환 타입 기반)
// Post 타입에 content, preview, user_id, title 등이 있다고 가정
type InitialPostData = Post | null; // getPostById가 null 반환 가능성 고려

export default function PostDetailClient({ post: initialPost, postId }: { post: InitialPostData, postId: string }) {
  const { user, profile, isLoggedIn, isLoading: userLoading } = useUser();
  const [canView, setCanView] = useState(false);
  const [content, setContent] = useState<string | null>(initialPost?.content || null); // 초기 content
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 초기 데이터가 없으면 바로 종료 (서버 컴포넌트에서 notFound 처리 가정)
    if (!initialPost) {
        setIsLoading(false);
        setCanView(false); // 혹시 모를 경우 대비
        return;
    };
    // 사용자 정보 로딩 중이면 대기
    if (userLoading) return;

    const checkViewPermission = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. 비로그인
      if (!isLoggedIn || !user) {
        setCanView(false);
        // 미리보기 설정 (preview 필드가 있다면 사용, 없으면 content 일부)
        setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // 미리보기 길이 조정 가능
        setIsLoading(false);
        return;
      }

      // 2. 유료 사용자 또는 작성자
      if (profile?.tier === 'paid' || initialPost.user_id === user.id) {
        setCanView(true);
        setContent(initialPost.content); // 전체 내용 설정
        setIsLoading(false);
        return;
      }

      // 3. 무료 사용자: API 호출하여 확인 및 토큰 차감 시도
      try {
        const response = await fetch(`/api/secure/posts/${postId}/view`, { method: 'POST' });
        const result = await response.json();

        if (response.ok && result.canView) {
          setCanView(true);
          // API 호출 성공 시 content 다시 로드할 필요 없음 (initialPost에 이미 있음)
          setContent(initialPost.content);
        } else {
          setCanView(false);
          setErrorMessage(result.message || '열람 권한이 없습니다.');
          setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // 미리보기만 표시
        }
      } catch (error: any) {
        console.error('Error checking view permission:', error);
        setCanView(false);
        setErrorMessage('열람 권한 확인 중 오류가 발생했습니다.');
        setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // 미리보기만 표시
      } finally {
        setIsLoading(false);
      }
    };

    checkViewPermission();
  }, [isLoggedIn, user, profile, userLoading, initialPost, postId]); // 의존성 배열 확인

  // 초기 데이터 로드 실패 시 (서버 컴포넌트에서 처리했어야 함)
  if (!initialPost) return <div>게시물을 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      {/* 제목, 작성자 정보 등은 initialPost에서 직접 렌더링 */}
      <h1 className="text-3xl font-bold mb-2">{initialPost.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        작성자: {initialPost.author_nickname || '익명'} {/* author_nickname 필드 가정 */}
        {' | '}
        작성일: {new Date(initialPost.created_at).toLocaleDateString()} {/* created_at 필드 가정 */}
      </p>
      {/* 태그 등 추가 정보 표시 가능 */}

      <div className="mt-8 prose dark:prose-invert max-w-none"> {/* 스타일링 */}
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
          </>
        ) : errorMessage ? (
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
            <p>{errorMessage}</p>
            {/* 필요 시 유료 구독 유도 메시지 등 추가 */}
          </div>
        ) : canView && content ? (
          <MarkdownRenderer content={content} />
        ) : (
          // 미리보기 (비로그인 또는 canView false인데 에러 아닌 경우)
          // content 상태에는 이미 미리보기 내용이 설정되어 있음
          <MarkdownRenderer content={content || ''} />
        )}
      </div>
    </article>
  );
}