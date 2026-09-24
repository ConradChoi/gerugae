-- 관리자 화면이 404로 뜰 때 원인 확인용
-- Supabase 대시보드 → SQL Editor 에서 실행한다. 읽기만 하므로 안전하다.

-- 1) 전체 계정과 관리자 여부
--    로그인에 쓰는 이메일 옆 is_admin이 true인지 확인한다.
select u.email, p.nickname, p.is_admin, p.id
from public.profiles p
join auth.users u on u.id = p.id
order by p.is_admin desc, p.created_at;

-- 2) is_admin() 함수가 존재하고 authenticated에게 실행 권한이 있는지
select
  p.proname as 함수,
  p.prosecdef as security_definer,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_실행권한
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';

-- 3) 함수 소유자가 profiles를 RLS 없이 읽을 수 있는지
--    (security definer는 소유자 권한으로 실행된다)
select
  c.relname as 테이블,
  c.relrowsecurity as rls_켜짐,
  c.relforcerowsecurity as 소유자에게도_rls_강제,
  pg_get_userbyid(c.relowner) as 테이블_소유자
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles';

-- 4) 함수 소유자
select pg_get_userbyid(p.proowner) as 함수_소유자
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';
