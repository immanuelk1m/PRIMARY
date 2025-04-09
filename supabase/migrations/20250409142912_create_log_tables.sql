-- Enum Type
CREATE TYPE public.token_reason AS ENUM (
  'signup', 'monthly_free', 'monthly_paid', 'post_approved_reward',
  'invited_user_reward', 'joined_via_invite_bonus', 'view_post_cost',
  'admin_grant', 'subscription_payment'
  -- 필요시 추가
);

-- tokens_log Table
CREATE TABLE public.tokens_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change_amount integer NOT NULL,
  balance_after_change integer NOT NULL CHECK (balance_after_change >= 0), -- 음수 방지
  reason public.token_reason NOT NULL,
  related_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  related_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.tokens_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tokens_log_user_id ON public.tokens_log(user_id);
COMMENT ON TABLE public.tokens_log IS 'Audit log for user token balance changes.';
COMMENT ON COLUMN public.tokens_log.change_amount IS 'Amount of tokens added or subtracted.';
COMMENT ON COLUMN public.tokens_log.balance_after_change IS 'User token balance after this change occurred.';
COMMENT ON COLUMN public.tokens_log.reason IS 'Reason for the token balance change.';
COMMENT ON COLUMN public.tokens_log.related_post_id IS 'Optional reference to a post related to the change.';
COMMENT ON COLUMN public.tokens_log.related_user_id IS 'Optional reference to another user related to the change (e.g., inviter).';


-- post_views Table
CREATE TABLE public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, post_id) -- 사용자는 게시물당 한 번만 기록
);
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.post_views IS 'Tracks which user has viewed which post (to prevent double token cost).';
COMMENT ON COLUMN public.post_views.user_id IS 'The user who viewed the post.';
COMMENT ON COLUMN public.post_views.post_id IS 'The post that was viewed.';