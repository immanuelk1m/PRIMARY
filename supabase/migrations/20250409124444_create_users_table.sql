-- Enum Types
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.user_tier AS ENUM ('free', 'paid');

-- Table Definition
CREATE TABLE public.users (
  id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- auth.users 테이블과 연결
  email text UNIQUE,
  nickname text NOT NULL,
  role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
  tier public.user_tier DEFAULT 'free'::public.user_tier NOT NULL,
  token_balance integer DEFAULT 1 NOT NULL CHECK (token_balance >= 0), -- 초기값 1, 음수 방지 CHECK
  invite_code text UNIQUE NOT NULL,
  invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  successful_invites_count integer DEFAULT 0 NOT NULL CHECK (successful_invites_count >= 0),
  last_monthly_token_granted_at timestamp with time zone,
  kakao_provider_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_invite_code ON public.users(invite_code);

-- RLS 활성화 (별도 정책 정의는 Story 2.6에서)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 테이블 및 컬럼 주석 추가 (권장)
COMMENT ON TABLE public.users IS 'Stores user profile information, linked to auth.users.';
COMMENT ON COLUMN public.users.id IS 'References the unique identifier from the auth.users table.';
COMMENT ON COLUMN public.users.email IS 'User''s unique email address.';
COMMENT ON COLUMN public.users.nickname IS 'User''s display name.';
COMMENT ON COLUMN public.users.role IS 'User role (user or admin).';
COMMENT ON COLUMN public.users.tier IS 'User subscription tier (free or paid).';
COMMENT ON COLUMN public.users.token_balance IS 'Current available token count for the user.';
COMMENT ON COLUMN public.users.invite_code IS 'Unique code for inviting other users.';
COMMENT ON COLUMN public.users.invited_by_user_id IS 'ID of the user who invited this user.';
COMMENT ON COLUMN public.users.successful_invites_count IS 'Number of users successfully invited by this user.';
COMMENT ON COLUMN public.users.last_monthly_token_granted_at IS 'Timestamp of the last monthly token grant.';
COMMENT ON COLUMN public.users.kakao_provider_id IS 'Unique identifier from Kakao login provider.';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp of when the user profile was created.';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp of when the user profile was last updated.';

-- updated_at 자동 업데이트 트리거 (Supabase에서 관리해주는 경우가 많으므로 주석 처리)
-- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users
-- FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);