-- 마이그레이션이 실제로 반영됐는지 확인한다. 읽기만 하므로 언제 돌려도 안전하다.
-- Supabase 대시보드 → SQL Editor 에서 실행한다.
--
-- 모든 행의 결과가 'OK' 여야 한다.

select '0007 admin_list_members 함수' as 항목,
       case when exists (
         select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'admin_list_members'
       ) then 'OK' else '없음 — 0007 미적용' end as 상태

union all
select '0008 reviews.author_id 를 비울 수 있는가',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'reviews'
           and column_name = 'author_id' and is_nullable = 'YES'
       ) then 'OK' else 'not null — 0008 미적용 (탈퇴 시 글이 삭제됨)' end

union all
select '0008 community_posts.author_id 를 비울 수 있는가',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'community_posts'
           and column_name = 'author_id' and is_nullable = 'YES'
       ) then 'OK' else 'not null — 0008 미적용 (탈퇴 시 글이 삭제됨)' end

union all
select '0008 reviews.author_id 삭제 동작',
       case (
         select confdeltype from pg_constraint
         where conname = 'reviews_author_id_fkey'
       ) when 'n' then 'OK (set null)'
         when 'c' then 'cascade — 탈퇴하면 글이 함께 삭제된다'
         else '확인 필요' end

union all
select '0008 community_posts.author_id 삭제 동작',
       case (
         select confdeltype from pg_constraint
         where conname = 'community_posts_author_id_fkey'
       ) when 'n' then 'OK (set null)'
         when 'c' then 'cascade — 탈퇴하면 글이 함께 삭제된다'
         else '확인 필요' end

union all
select '0008 운영자 삭제 정책 (' || t.tablename || ')',
       case when exists (
         select 1 from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.tablename
           and p.cmd = 'DELETE' and p.qual like '%is_admin%'
       ) then 'OK' else '없음 — 탈퇴한 회원의 글을 아무도 지울 수 없다' end
from (values ('reviews'), ('community_posts'), ('companies')) as t(tablename);
