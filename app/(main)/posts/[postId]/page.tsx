import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient'; // 클라이언트 컴포넌트 임포트
import { getPostById } from '@/services/post.service'; // getPostById 함수 import 경로 확인

export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  // 서버에서 초기 데이터 로드 (content 포함)
  // getPostById는 RLS를 고려하여 구현되어야 함 (예: Supabase 클라이언트 사용)
  const post = await getPostById(params.postId);

  // RLS 통과 못한 경우 또는 게시물 없는 경우
  if (!post) {
      notFound();
  }

  // 클라이언트 컴포넌트에 데이터 전달하여 렌더링
  return <PostDetailClient post={post} postId={params.postId} />;
}