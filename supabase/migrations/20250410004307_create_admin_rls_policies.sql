-- Story 6.9: 관리자 기능 관련 RLS 정책 추가

-- === users Table Policies ===
-- 관리자는 모든 사용자의 정보를 읽을 수 있다.
CREATE POLICY "Allow admin read access to all users" ON public.users FOR SELECT USING (public.is_admin(auth.uid()));
-- 관리자는 사용자의 역할(role), 티어(tier) 등을 수정할 수 있다. (수정 가능한 필드는 서비스 로직에서 제한)
-- 주의: 민감 정보(예: kakao_provider_id) 수정은 신중해야 함.
CREATE POLICY "Allow admin update access to users" ON public.users FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- === posts Table Policies ===
-- 관리자는 모든 게시물 정보를 읽을 수 있다. (기존 사용자 정책과 함께 적용됨)
CREATE POLICY "Allow admin read access to all posts" ON public.posts FOR SELECT USING (public.is_admin(auth.uid()));
-- 관리자는 게시물의 상태(status), 반려 사유(rejection_reason) 등을 수정할 수 있다.
CREATE POLICY "Allow admin update access to posts" ON public.posts FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
-- 관리자는 게시물을 삭제할 수 있다. (필요한 경우 활성화)
-- CREATE POLICY "Allow admin delete access to posts" ON public.posts FOR DELETE USING (public.is_admin(auth.uid()));

-- === reports Table Policies ===
-- 관리자는 모든 신고 정보를 읽을 수 있다.
CREATE POLICY "Allow admin read access to all reports" ON public.reports FOR SELECT USING (public.is_admin(auth.uid()));
-- 관리자는 신고 상태(status), 처리자(resolver_admin_id), 처리 시간(resolved_at) 등을 수정할 수 있다.
CREATE POLICY "Allow admin update access to reports" ON public.reports FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- === subscriptions Table Policies ===
-- 관리자는 모든 구독 정보를 읽을 수 있다. (수정은 웹훅 처리)
CREATE POLICY "Allow admin read access to all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin(auth.uid()));

-- === tokens_log Table Policies ===
-- 관리자는 모든 토큰 로그를 읽을 수 있다. (감사 목적)
CREATE POLICY "Allow admin read access to all token logs" ON public.tokens_log FOR SELECT USING (public.is_admin(auth.uid()));

-- === tags, post_tags, post_views Table Policies ===
-- 관리자는 태그 관련 정보를 읽을 수 있다. (기존 authenticated 정책으로 충분할 수 있으나 명시적 추가 가능)
CREATE POLICY "Allow admin read access to tags" ON public.tags FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin read access to post_tags" ON public.post_tags FOR SELECT USING (public.is_admin(auth.uid()));
-- 관리자는 조회 기록을 읽을 수 있다. (필요시)
-- CREATE POLICY "Allow admin read access to post_views" ON public.post_views FOR SELECT USING (public.is_admin(auth.uid()));

-- 참고: 기존 정책과 충돌하지 않도록 USING 조건이 OR 관계로 평가될 수 있습니다.
-- 예를 들어, posts 테이블 SELECT는 (status = 'approved') OR (auth.uid() = user_id) OR (public.is_admin(auth.uid())) 와 같이 동작합니다.