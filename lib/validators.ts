import { z } from 'zod';

export const postCreateSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요.' }).max(100, { message: '제목은 100자 이하로 입력해주세요.' }),
  content: z.string().min(100, { message: '내용은 100자 이상 입력해주세요.' }),
  tags: z.string().optional() // 콤마 구분 문자열, API 레벨에서 파싱 및 개수 제한
         .refine(value => !value || value.split(',').length <= 5, { message: '태그는 최대 5개까지 입력할 수 있습니다.' }),
  viewLimit: z.coerce // 문자열 입력을 숫자로 강제 변환
              .number({ invalid_type_error: '숫자만 입력해주세요.' })
              .int({ message: '정수만 입력해주세요.' })
              .min(0, { message: '0 이상의 숫자를 입력해주세요.' })
              .optional() // N명 제한은 선택 사항
              .nullable(), // null 허용 (제한 없음)
});

export type PostCreateInput = z.infer<typeof postCreateSchema>;