import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient'; 
import { getPostById } from '@/services/post.service';
import type { PostWithDetails } from '@/services/post.service';

// 타입 정의를 완전히 생략하고 단순화된 방식 사용
export default async function PostDetailPage({ params }: any) {
  const postId = params.postId as string;
  const post: PostWithDetails | null = await getPostById(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post} postId={postId} />;
}