-- Enum Type
CREATE TYPE public.post_status AS ENUM ('pending', 'approved', 'rejected', 'needs_revision');

-- posts Table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0),
  content text NOT NULL CHECK (char_length(content) >= 100), -- PRD FR-CONTENT-CREATE-03
  preview text,
  status public.post_status DEFAULT 'pending'::public.post_status NOT NULL,
  view_limit integer CHECK (view_limit IS NULL OR view_limit >= 0), -- N명 제한
  view_count integer DEFAULT 0 NOT NULL CHECK (view_count >= 0),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_status ON public.posts(status);
COMMENT ON TABLE public.posts IS 'Stores user-generated content entries.';
COMMENT ON COLUMN public.posts.content IS 'Main content of the post, minimum 100 characters.';
COMMENT ON COLUMN public.posts.view_limit IS 'Optional limit on the number of views allowed.';

-- tags Table
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (char_length(name) > 0)
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tags_name ON public.tags(name); -- UNIQUE 제약조건으로 자동 생성될 수 있으나 명시 권장
COMMENT ON TABLE public.tags IS 'Stores unique tags for categorizing posts.';
COMMENT ON COLUMN public.tags.name IS 'Unique name of the tag.';

-- post_tags Table (Many-to-Many)
CREATE TABLE public.post_tags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.post_tags IS 'Associates posts with tags.';