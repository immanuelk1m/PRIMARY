'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postCreateSchema, type PostCreateInput } from '@/lib/validators'; // 경로 수정
import { Button } from '@/components/ui/button'; // 경로 수정
import { Input } from '@/components/ui/input'; // 경로 수정
import { Label } from '@/components/ui/label'; // 경로 수정
import MarkdownEditorWrapper from '@/components/common/MarkdownEditorWrapper'; // 경로 수정
import { useState } from 'react';

interface PostFormProps {
  onSubmit: (data: PostCreateInput) => Promise<void>; // API 호출 로직 연결용
  isSubmitting?: boolean; // 상위 컴포넌트에서 제출 상태 전달 (선택적)
}

export default function PostForm({ onSubmit, isSubmitting = false }: PostFormProps) {
  const methods = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
      viewLimit: null, // 기본값 null (제한 없음)
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFormSubmit = async (data: PostCreateInput) => {
    setSubmitError(null); // 이전 제출 에러 초기화
    try {
      await onSubmit(data);
      // 성공 시 리디렉션 등은 상위 컴포넌트(페이지)에서 처리
    } catch (error: any) {
      console.error("Form submission error:", error);
      setSubmitError(error.message || '게시물 제출 중 오류가 발생했습니다.');
    }
  };

  return (
    // FormProvider를 사용하여 중첩된 컴포넌트(MarkdownEditorWrapper)에서 form context 접근 가능
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 제목 필드 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">제목</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="게시물 제목을 입력하세요"
            maxLength={100}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* 태그 필드 */}
        <div className="space-y-2">
          <Label htmlFor="tags">태그 (콤마(,)로 구분, 최대 5개)</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="예: react, typescript, nextjs"
          />
           {errors.tags && <p className="text-sm text-red-500 mt-1">{errors.tags.message}</p>}
        </div>

        {/* N명 제한 필드 */}
        <div className="space-y-2">
          <Label htmlFor="viewLimit">열람 제한 인원 (0 또는 빈칸: 제한 없음)</Label>
          <Input
            id="viewLimit"
            type="number" // 숫자 입력 필드
            min="0" // 최소값 0
            step="1" // 정수 단위
            {...register('viewLimit')}
            placeholder="0"
          />
          {errors.viewLimit && <p className="text-sm text-red-500 mt-1">{errors.viewLimit.message}</p>}
        </div>

        {/* 마크다운 에디터 */}
        <MarkdownEditorWrapper name="content" label="내용" required />

        {/* 제출 에러 메시지 */}
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        {/* 제출 버튼 */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? '제출 중...' : '게시물 제출'}
        </Button>
      </form>
    </FormProvider>
  );
}