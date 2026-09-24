-- 관리자 화면이 404로 뜰 때 원인 확인용
-- Supabase 대시보드 → SQL Editor 에서 실행한다. 읽기만 하므로 안전하다.
-- SQL Editor는 마지막 결과만 보여주므로 하나의 결과표로 합쳐 두었다.

select '계정' as 구분,
       u.email as 값1,
       coalesce(p.nickname, '(프로필 없음)') as 값2,
       case when p.is_admin then '관리자' else '일반' end as 값3
from auth.users u
left join public.profiles p on p.id = u.id

union all

select '함수',
       p.proname,
       case when p.prosecdef then 'security definer' else 'security invoker' end,
       case when has_function_privilege('authenticated', p.oid, 'EXECUTE')
            then 'authenticated 실행 가능' else 'authenticated 실행 불가' end
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin'

union all

select '테이블',
       c.relname,
       pg_get_userbyid(c.relowner),
       case when c.relforcerowsecurity then '소유자에게도 RLS 강제 (문제 가능)' else '소유자는 RLS 예외 (정상)' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles'

union all

select '컬럼권한',
       'profiles.is_admin',
       case when has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'SELECT')
            then 'authenticated 조회 가능 (0004 미적용)' else 'authenticated 조회 불가 (정상)' end,
       case when has_column_privilege('authenticated', 'public.profiles', 'nickname', 'SELECT')
            then 'nickname 조회 가능 (정상)' else 'nickname 조회 불가 (문제)' end

order by 1, 2;
