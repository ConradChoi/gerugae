begin;

-- 관리자 회원 목록.
--
-- 0004에서 누가 운영자인지 감추려고 profiles의 조회 권한을
-- (id, nickname, created_at)으로 좁혔는데, 0006이 더한 member_since/invited_by에는
-- 권한을 주지 않아 /admin/members가 아무것도 읽지 못하고 있었다.
-- 권한(GRANT)은 역할 단위라 "관리자에게만 이 컬럼을 연다"를 표현할 수 없으므로,
-- is_admin()/is_member()와 같은 방식으로 함수를 통해서만 열어 준다.
create or replace function public.admin_list_members(limit_count int default 200)
returns table (
  id uuid,
  nickname text,
  created_at timestamptz,
  member_since timestamptz,
  inviter_nickname text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nickname, p.created_at, p.member_since, inviter.nickname
  from public.profiles p
  left join public.profiles inviter on inviter.id = p.invited_by
  where public.is_admin()
  order by p.created_at desc
  limit greatest(1, least(limit_count, 500));
$$;

revoke execute on function public.admin_list_members(int) from public;
grant execute on function public.admin_list_members(int) to authenticated;

commit;
