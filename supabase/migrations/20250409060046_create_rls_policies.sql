-- === users Table Policies ===
-- 사용자는 자신의 프로필 정보만 읽을 수 있다.
CREATE POLICY "Allow individual user read access" ON public.users FOR SELECT USING (auth.uid() = id);
-- 사용자는 자신의 프로필 정보(닉네임 등)만 수정할 수 있다. (수정 가능한 필드는 UPDATE문에서 제한)
CREATE POLICY "Allow individual user update access" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- (INSERT는 DB 트리거(Story 3.9)에서 처리, DELETE는 일반적으로 허용 안 함)

-- === posts Table Policies ===
-- 누구나 승인된('approved') 게시물은 읽을 수 있다.
CREATE POLICY "Allow public read access for approved posts" ON public.posts FOR SELECT USING (status = 'approved'::public.post_status);
-- 작성자는 자신의 게시물을 상태와 관계없이 읽을 수 있다.
CREATE POLICY "Allow author read access to own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
-- 로그인한 사용자는 새 게시물을 작성('pending' 상태로)할 수 있다.
CREATE POLICY "Allow authenticated users to insert posts" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- 작성자는 자신의 게시물(승인 전)을 수정할 수 있다. (UPDATE 가능한 필드 및 조건 구체화 필요)
CREATE POLICY "Allow author update access to own pending posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id AND status = 'pending'::public.post_status) WITH CHECK (auth.uid() = user_id);
-- 작성자는 자신의 게시물을 삭제할 수 있다. (삭제 정책은 신중히 결정)
CREATE POLICY "Allow author delete access to own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- === tags Table Policies ===
-- 모든 사용자가 태그 목록을 읽을 수 있다. (게시물 필터링 등에 사용)
CREATE POLICY "Allow public read access to tags" ON public.tags FOR SELECT USING (true);
-- (INSERT/UPDATE/DELETE는 서버 측 로직(태그 생성 시 upsert)에서 처리하므로, 해당 로직 실행 역할(예: authenticated)에 맞는 정책 필요)
CREATE POLICY "Allow authenticated users to insert tags" ON public.tags FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- 서버 로직이 사용자 권한으로 실행될 경우

-- === post_tags Table Policies ===
-- 관련된 게시물을 읽을 수 있으면 태그 연결 정보도 읽을 수 있다. (JOIN 사용 시 posts 테이블 정책 따름)
-- 여기서는 명시적으로 로그인 사용자만 읽도록 제한 (더 안전)
CREATE POLICY "Allow authenticated read access" ON public.post_tags FOR SELECT USING (auth.role() = 'authenticated');
-- (INSERT/UPDATE/DELETE는 서버 측 로직에서 처리, posts/tags 정책과 연계)
CREATE POLICY "Allow authenticated users to insert post_tags" ON public.post_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- 서버 로직이 사용자 권한으로 실행될 경우

-- === tokens_log Table Policies ===
-- 사용자는 자신의 토큰 변동 내역만 읽을 수 있다.
CREATE POLICY "Allow individual user read access" ON public.tokens_log FOR SELECT USING (auth.uid() = user_id);
-- (INSERT는 서버 측(DB 함수, 서버리스 함수)에서 처리, UPDATE/DELETE 불가)

-- === post_views Table Policies ===
-- 사용자는 자신의 조회 기록만 읽을 수 있다. (서버 로직에서 중복 체크용)
CREATE POLICY "Allow individual user read access" ON public.post_views FOR SELECT USING (auth.uid() = user_id);
-- (INSERT는 서버 측(토큰 차감 로직)에서 처리, UPDATE/DELETE 불가)
CREATE POLICY "Allow authenticated users to insert view record" ON public.post_views FOR INSERT WITH CHECK (auth.uid() = user_id); -- 서버 로직이 사용자 권한으로 실행될 경우

-- === reports Table Policies ===
-- 사용자는 자신이 신고한 내역만 읽을 수 있다. (MVP에서는 불필요할 수 있음)
CREATE POLICY "Allow reporter read access to own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_user_id);
-- 로그인한 사용자는 신고를 생성할 수 있다.
CREATE POLICY "Allow authenticated users to insert reports" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- (관리자 읽기/수정 정책은 Story 6.9에서 추가)

-- === subscriptions Table Policies ===
-- 사용자는 자신의 구독 정보만 읽을 수 있다.
CREATE POLICY "Allow individual user read access" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
-- (INSERT/UPDATE는 서버 측(웹훅 핸들러 등)에서 처리, DELETE는 일반적으로 허용 안 함)