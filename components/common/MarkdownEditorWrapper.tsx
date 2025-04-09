'use client';

import dynamic from 'next/dynamic'; // 클라이언트 측에서만 로드
import { Controller, useFormContext } from 'react-hook-form';
import '@uiw/react-md-editor/markdown-editor.css';
import { Label } from '@/components/ui/label'; // 경로 수정

// react-md-editor는 클라이언트 측에서만 렌더링되어야 함
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorWrapperProps {
  name: string; // react-hook-form 필드 이름
  label: string;
  required?: boolean;
}

export default function MarkdownEditorWrapper({ name, label, required }: MarkdownEditorWrapperProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div data-color-mode="light"> {/* 또는 다크 모드 설정 */}
            <MDEditor
              value={field.value || ''}
              onChange={(value) => field.onChange(value)}
              preview="live" // 실시간 미리보기
              height={400} // 에디터 높이 설정
              // 필요한 다른 옵션 추가 가능
            />
          </div>
        )}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}