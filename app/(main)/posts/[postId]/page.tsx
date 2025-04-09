import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient'; // 클라이언트 컴포넌트 임포트
import { getPostById } from '@/services/post.service'; // getPostById 함수 import 경로 확인
import type { PostWithDetails } from '@/services/post.service'; // Import the type for the post

// Define an explicit interface for the page props
interface PostDetailPageProps {
  params: { postId: string };
  // You can also include searchParams if needed, even if unused:
  // searchParams: { [key: string]: string | string[] | undefined };
}

// Use the defined interface for the component props
export default async function PostDetailPage({ params }: PostDetailPageProps) {
  // 서버에서 초기 데이터 로드 (content 포함)
  // getPostById는 RLS를 고려하여 구현되어야 함 (예: Supabase 클라이언트 사용)
  const post: PostWithDetails | null = await getPostById(params.postId);

  // RLS 통과 못한 경우 또는 게시물 없는 경우
  if (!post) {
    notFound();
  }

  // 클라이언트 컴포넌트에 데이터 전달하여 렌더링
  // Pass the fetched post data to the client component
  return <PostDetailClient post={post} postId={params.postId} />;
}