'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../../../../hooks/useUser';
import MarkdownRenderer from '../../../../components/common/MarkdownRenderer';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { PostWithDetails } from '@/services/post.service'; // Adjusted import path and type name

// Server-fetched post data type (based on getPostById return type)
// Assuming PostWithDetails includes content, preview, user_id, title, etc.
type InitialPostData = PostWithDetails | null; // Consider getPostById might return null

// Define a more specific type for the API response
interface ViewApiResponse {
  canView: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export default function PostDetailClient({ post: initialPost, postId }: { post: InitialPostData, postId: string }) {
  const { user, profile, isLoggedIn, isLoading: userLoading } = useUser();
  const [canView, setCanView] = useState(false);
  const [content, setContent] = useState<string | null>(initialPost?.content || null); // Initial content
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Exit early if initial data is missing (assuming server component handled notFound)
    if (!initialPost) {
      setIsLoading(false);
      setCanView(false); // Just in case
      return;
    };
    // Wait if user info is loading
    if (userLoading) return;

    const checkViewPermission = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Not logged in
      if (!isLoggedIn || !user) {
        setCanView(false);
        // Set preview (use preview field if available, otherwise part of content)
        setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // Adjust preview length if needed
        setIsLoading(false);
        return;
      }

      // 2. Paid user or author
      // Use profile?.tier and initialPost.user_id directly
      if (profile?.tier === 'paid' || initialPost.user_id === user.id) {
        setCanView(true);
        setContent(initialPost.content); // Set full content
        setIsLoading(false);
        return;
      }

      // 3. Free user: Call API to check and attempt token deduction
      try {
        const response = await fetch(`/api/secure/posts/${postId}/view`, { method: 'POST' });
        // Use the specific type for the response JSON
        const result: ViewApiResponse = await response.json();

        if (response.ok && result.canView) {
          setCanView(true);
          // No need to reload content on API success (already in initialPost)
          setContent(initialPost.content);
        } else {
          setCanView(false);
          setErrorMessage(result.message || result.error || '열람 권한이 없습니다.');
          setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // Show only preview
        }
      } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error('Error checking view permission:', error);
        setCanView(false);
        // More robust error message extraction
        const message = error instanceof Error ? error.message : '열람 권한 확인 중 오류가 발생했습니다.';
        setErrorMessage(message);
        setContent(initialPost.preview || initialPost.content?.substring(0, 200) || ''); // Show only preview
      } finally {
        setIsLoading(false);
      }
    };

    checkViewPermission();
    // Ensure initialPost and profile are stable references or handle changes appropriately
    // If initialPost can change, it might need deeper comparison or be excluded if it only loads once.
  }, [isLoggedIn, user, profile, userLoading, initialPost, postId]); // Dependencies checked

  // Initial data load failed (should have been handled by server component)
  if (!initialPost) return <div>게시물을 불러오는 중 오류가 발생했습니다.</div>;

  // Determine author nickname safely
  const authorNickname = initialPost.users?.nickname || '익명';

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Render title, author info, etc., directly from initialPost */}
      <h1 className="text-3xl font-bold mb-2">{initialPost.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        작성자: {authorNickname} {/* Use the safely determined nickname */}
        {' | '}
        작성일: {new Date(initialPost.created_at).toLocaleDateString()} {/* created_at field assumed */}
      </p>
      {/* Display tags if available */}
      {initialPost.tags && initialPost.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {initialPost.tags.map(tag => (
            <span key={tag.name} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {tag.name}
            </span>
          ))}
        </div>
      )}


      <div className="mt-8 prose dark:prose-invert max-w-none"> {/* Styling */}
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
          </>
        ) : errorMessage ? (
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
            <p>{errorMessage}</p>
            {/* Optionally add message to encourage paid subscription */}
          </div>
        ) : canView && content ? (
          <MarkdownRenderer content={content} />
        ) : (
          // Preview (for non-logged-in or canView=false without error)
          // content state already holds the preview content
          <MarkdownRenderer content={content || ''} />
        )}
      </div>
    </article>
  );
}
