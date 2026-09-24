begin;

-- 누가 운영자인지 일반 사용자에게 드러나지 않게 한다.
-- RLS는 행 단위라 컬럼을 가릴 수 없으므로 권한(GRANT)으로 제한한다.
revoke select on public.profiles from authenticated;
revoke select on public.profiles from anon;
grant select (id, nickname, created_at) on public.profiles to authenticated;

-- 본인이 관리자인지는 is_admin() 함수로만 확인한다.
-- security definer라 권한 제한과 무관하게 동작하며, 호출한 사람 자신의 값만 돌려준다.
-- (0003에서 이미 생성했고 여기서는 권한만 다시 확인한다)
grant execute on function public.is_admin() to authenticated;

commit;
