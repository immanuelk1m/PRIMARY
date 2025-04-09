import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient'; 
import { getPostById } from '@/services/post.service';
import type { PostWithDetails } from '@/services/post.service';

// ESLint 경고 비활성화
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function PostDetailPage({ params }: any) {
  const postId = params.postId as string;
  const post: PostWithDetails | null = await getPostById(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post} postId={postId} />;
}