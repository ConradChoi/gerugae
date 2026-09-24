-- 테스트 데이터 정리 스크립트
-- Supabase 대시보드 → SQL Editor 에서 실행한다.
--
-- 지우는 것: 기업·후기·태그연결·정보글 전부, 그리고 test-...@example.com 계정
-- 남기는 것: 직접 가입한 계정과 그 프로필 (다시 로그인 가능)
--
-- ⚠️ 되돌릴 수 없다. 실행 전 STEP 1로 무엇이 지워지는지 먼저 확인할 것.

-- ── STEP 1. 삭제 전 현황 확인 (여기까지만 실행해도 안전하다) ──────────
select 'companies' as 테이블, count(*) as 건수 from public.companies
union all
select 'reviews', count(*) from public.reviews
union all
select 'review_tags', count(*) from public.review_tags
union all
select 'community_posts', count(*) from public.community_posts
union all
select '테스트 계정', count(*) from auth.users where email like 'test-%@example.com'
union all
select '일반 계정', count(*) from auth.users where email not like 'test-%@example.com';

-- ── STEP 2. 콘텐츠 삭제 ────────────────────────────────────────────
-- review_tags와 reviews는 companies를 참조하므로 cascade로 함께 지워진다.
-- 명시적으로 지워 실행 결과를 확인할 수 있게 한다.
delete from public.review_tags;
delete from public.reviews;
delete from public.community_posts;
delete from public.companies;

-- ── STEP 3. 테스트 계정 삭제 ───────────────────────────────────────
-- profiles는 auth.users를 on delete cascade로 참조하므로 함께 지워진다.
delete from auth.users where email like 'test-%@example.com';

-- ── STEP 4. 결과 확인 ──────────────────────────────────────────────
select 'companies' as 테이블, count(*) as 남은건수 from public.companies
union all
select 'reviews', count(*) from public.reviews
union all
select 'review_tags', count(*) from public.review_tags
union all
select 'community_posts', count(*) from public.community_posts
union all
select 'tags (유지되어야 함: 6)', count(*) from public.tags
union all
select '테스트 계정', count(*) from auth.users where email like 'test-%@example.com'
union all
select '일반 계정', count(*) from auth.users where email not like 'test-%@example.com'
union all
select 'profiles', count(*) from public.profiles;
