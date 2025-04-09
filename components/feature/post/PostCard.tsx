import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'; // 경로 수정 (@/ 사용)
import type { PostWithAuthor } from '@/services/post.service'; // 경로 수정 (@/ 사용)
import { formatDistanceToNow } from 'date-fns'; // 날짜 포맷 라이브러리
import { ko } from 'date-fns/locale'; // 한국어 로케일

interface PostCardProps {
  post: PostWithAuthor;
}

export default function PostCard({ post }: PostCardProps) {
  // 생성일을 "X분 전", "Y시간 전" 등으로 표시
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko });

  return (
    <Link href={`/posts/${post.id}`} className="block hover:shadow-md transition-shadow duration-200 rounded-lg">
      <Card className="h-full flex flex-col"> {/* 카드의 높이를 동일하게 맞추기 위해 flex 사용 */}
        <CardHeader>
          <CardTitle className="line-clamp-2">{post.title}</CardTitle> {/* 제목 두 줄 제한 */}
          <CardDescription>
            by {post.users?.nickname || '익명'} {/* 작성자 닉네임 */}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow"> {/* 내용 부분이 남은 공간 차지 */}
          <p className="text-sm text-muted-foreground line-clamp-3"> {/* 미리보기 세 줄 제한 */}
            {post.preview || '미리보기 내용이 없습니다.'}
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">{timeAgo}</p> {/* 생성 시간 */}
        </CardFooter>
      </Card>
    </Link>
  );
}