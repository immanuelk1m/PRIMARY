import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown 지원
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'; // XSS 방지
import 'github-markdown-css/github-markdown-light.css'; // GitHub 스타일 적용 (light 테마)
// 다크 모드 지원 시: import 'github-markdown-css/github-markdown-dark.css';

interface MarkdownRendererProps {
  content: string;
}

// rehype-sanitize 스키마 커스터마이징 (선택 사항)
// 기본 스키마 외에 추가로 허용할 태그나 속성이 있다면 여기에 정의
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // 예시: 코드 블록에 className 허용 (코드 하이라이팅 라이브러리 연동 시 필요할 수 있음)
    code: [...(defaultSchema.attributes?.code || []), 'className'],
    // 예시: 모든 태그에 id 속성 허용
    '*': [...(defaultSchema.attributes?.['*'] || []), 'id'],
  },
  // 예시: iframe 태그 허용 (YouTube 임베드 등, 보안 주의 필요)
  // tagNames: [...defaultSchema.tagNames, 'iframe'],
  // clobberPrefix: 'user-content-', // DOM Clobbering 방지 접두사
};

/**
 * 마크다운 콘텐츠를 안전하게 렌더링하는 컴포넌트.
 * GFM을 지원하고 XSS 공격을 방지합니다.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    // github-markdown-css 스타일을 적용하기 위해 className 추가
    // content가 있을 때만 렌더링
    <div className="markdown-body prose lg:prose-xl dark:prose-invert max-w-none">
      {content && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]} // GFM 플러그인 적용
          rehypePlugins={[[rehypeSanitize, schema]]} // Sanitize 플러그인 적용 (보안 필수!)
          // rehypePlugins={[rehypeHighlight, [rehypeSanitize, schema]]} // 코드 하이라이팅 추가 시 예시
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
}