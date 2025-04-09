import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['users']['Row'];

// 다른 필요한 전역 타입들을 여기에 추가할 수 있습니다.

// 게시물 타입 정의
export type Post = Database['public']['Tables']['posts']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type PostTag = Database['public']['Tables']['post_tags']['Row'];

// 관계형 데이터를 포함하는 게시물 타입
export type PostWithRelations = Post & {
  users: Profile | null; // users 테이블과의 관계 (단일)
  tags: Tag[]; // tags 테이블과의 관계 (다대다)
};