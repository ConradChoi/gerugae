-- 테스트 데이터 정리 스크립트
-- Supabase 대시보드 → SQL Editor 에서 실행한다.
--
-- 지우는 것: 기업·후기·태그연결·정보글 전부, 초대 코드 전부,
--            그리고 테스트 계정(test-...@example.com, seed-member@example.com)
-- 남기는 것: 직접 가입한 계정과 그 프로필 (다시 로그인 가능), tags 6건
--
-- ⚠️ 되돌릴 수 없다. 실행 전 STEP 1로 무엇이 지워지는지 먼저 확인할 것.
--
-- ⚠️ 통합 테스트(`npm run test:integration`)는 이 DB에 붙어 있다.
--    테스트를 한 번 돌리면 아래 데이터가 다시 쌓인다. 테스트용 Supabase
--    프로젝트를 분리하기 전까지는 정리 후 테스트를 돌리지 않는다.

-- ── STEP 1. 삭제 전 현황 확인 (여기까지만 실행해도 안전하다) ──────────
select 'companies' as 테이블, count(*) as 건수 from public.companies
union all
select 'reviews', count(*) from public.reviews
union all
select 'review_tags', count(*) from public.review_tags
union all
select 'community_posts', count(*) from public.community_posts
union all
select 'invite_codes', count(*) from public.invite_codes
union all
select 'reports', count(*) from public.reports
union all
select '테스트 계정', count(*) from auth.users
  where email like 'test-%@example.com' or email = 'seed-member@example.com'
union all
select '일반 계정', count(*) from auth.users
  where email not like 'test-%@example.com' and email <> 'seed-member@example.com';

-- ── STEP 2. 콘텐츠 삭제 ────────────────────────────────────────────
-- reports는 reviews/community_posts를 참조하므로 먼저 지운다.
delete from public.reports;
delete from public.review_tags;
delete from public.reviews;
delete from public.community_posts;
delete from public.companies;

-- 초대 코드도 전부 비운다. 남은 회원은 마이페이지에서 다시 발급받으면 된다.
delete from public.invite_codes;

-- ── STEP 3. 테스트 계정 삭제 ───────────────────────────────────────
-- profiles는 auth.users를 on delete cascade로 참조하므로 함께 지워진다.
-- 테스트 계정이 초대한 사람이 있으면 그 사람의 invited_by는 null이 된다
-- (on delete set null). 회원 자격 자체는 유지된다.
delete from auth.users
where email like 'test-%@example.com' or email = 'seed-member@example.com';

-- ── STEP 4. 결과 확인 ──────────────────────────────────────────────
select 'companies' as 테이블, count(*) as 남은건수 from public.companies
union all
select 'reviews', count(*) from public.reviews
union all
select 'review_tags', count(*) from public.review_tags
union all
select 'community_posts', count(*) from public.community_posts
union all
select 'invite_codes', count(*) from public.invite_codes
union all
select 'reports', count(*) from public.reports
union all
select 'tags (유지되어야 함: 6)', count(*) from public.tags
union all
select '테스트 계정 (0이어야 함)', count(*) from auth.users
  where email like 'test-%@example.com' or email = 'seed-member@example.com'
union all
select '일반 계정', count(*) from auth.users
  where email not like 'test-%@example.com' and email <> 'seed-member@example.com'
union all
select '회원 자격 보유', count(*) from public.profiles where member_since is not null;
