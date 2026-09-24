-- 테스트 계정과 그 계정이 만든 데이터만 정리한다.
-- 직접 가입한 계정과 그 계정이 쓴 기업·후기·정보글은 남는다.
--
-- ⚠️ 0005_fix_company_author_delete.sql 을 먼저 적용해야 한다.
--    (companies.created_by가 NOT NULL이면 계정 삭제가 실패한다)

-- ── STEP 1. 삭제 대상 확인 (여기까지만 실행해도 안전하다) ──────────
with 대상 as (
  select id from auth.users where email like 'test-%@example.com' or email like 'check-%@example.com'
)
select '삭제할 계정' as 구분, count(*) as 건수 from 대상
union all
select '그 계정이 쓴 후기', count(*) from public.reviews where author_id in (select id from 대상)
union all
select '그 계정이 쓴 정보글', count(*) from public.community_posts where author_id in (select id from 대상)
union all
select '그 계정이 등록한 기업', count(*) from public.companies where created_by in (select id from 대상)
union all
select '그 계정이 낸 신고', count(*) from public.reports where reporter_id in (select id from 대상)
union all
select '남길 계정', count(*) from auth.users
  where email not like 'test-%@example.com' and email not like 'check-%@example.com';

-- ── STEP 2. 테스트 계정이 등록한 기업 삭제 ─────────────────────────
-- 그 기업에 달린 후기·정보글·태그연결은 cascade로 함께 지워진다.
-- (다른 사람이 그 기업에 남긴 후기도 함께 사라지는 점에 유의)
delete from public.companies
where created_by in (
  select id from auth.users
  where email like 'test-%@example.com' or email like 'check-%@example.com'
);

-- ── STEP 3. 테스트 계정 삭제 ───────────────────────────────────────
-- profiles는 cascade로 함께 지워지고, 남아 있던 후기·정보글·신고도 따라 지워진다.
delete from auth.users
where email like 'test-%@example.com' or email like 'check-%@example.com';

-- ── STEP 4. 결과 확인 ──────────────────────────────────────────────
select '남은 계정' as 구분, count(*) as 건수 from auth.users
union all
select '남은 기업', count(*) from public.companies
union all
select '남은 후기', count(*) from public.reviews
union all
select '남은 정보글', count(*) from public.community_posts
union all
select '남은 신고', count(*) from public.reports
union all
select 'tags (6이어야 정상)', count(*) from public.tags;
