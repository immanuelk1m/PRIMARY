-- Enum Types
CREATE TYPE public.report_status AS ENUM ('received', 'processing', 'resolved', 'dismissed');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due'); -- PortOne 상태와 매핑 고려

-- reports Table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text, -- MVP에서는 nullable
  status public.report_status DEFAULT 'received'::public.report_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone,
  resolver_admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL -- 처리 관리자
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reports_post_id ON public.reports(post_id);
CREATE INDEX idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
COMMENT ON TABLE public.reports IS 'Stores user reports against posts.';
COMMENT ON COLUMN public.reports.post_id IS 'The post being reported.';
COMMENT ON COLUMN public.reports.reporter_user_id IS 'The user who submitted the report.';
COMMENT ON COLUMN public.reports.reason IS 'Optional reason provided by the reporter.';
COMMENT ON COLUMN public.reports.status IS 'Current status of the report.';
COMMENT ON COLUMN public.reports.resolved_at IS 'Timestamp when the report was resolved or dismissed.';
COMMENT ON COLUMN public.reports.resolver_admin_id IS 'Admin user who handled the report.';


-- subscriptions Table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- 사용자는 하나의 구독만 가짐
  status public.subscription_status DEFAULT 'inactive'::public.subscription_status NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone, -- 다음 결제 예정일
  portone_subscription_id text UNIQUE, -- PortOne 구독 ID (관리 및 웹훅 매핑용)
  portone_customer_uid text, -- PortOne 고객 고유번호 (user_id 와 매핑)
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_portone_id ON public.subscriptions(portone_subscription_id); -- UNIQUE지만 검색 위해 명시
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information linked to PortOne.';
COMMENT ON COLUMN public.subscriptions.user_id IS 'The user associated with this subscription.';
COMMENT ON COLUMN public.subscriptions.status IS 'Current status of the subscription (e.g., active, inactive).';
COMMENT ON COLUMN public.subscriptions.current_period_start IS 'Start date of the current billing cycle.';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'End date of the current billing cycle (next payment date).';
COMMENT ON COLUMN public.subscriptions.portone_subscription_id IS 'Unique subscription identifier from PortOne payment gateway.';
COMMENT ON COLUMN public.subscriptions.portone_customer_uid IS 'Unique customer identifier from PortOne, mapped to user_id.';