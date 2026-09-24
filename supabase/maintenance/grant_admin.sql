-- 관리자 지정
-- Supabase 대시보드 → SQL Editor 에서 실행한다.
--
-- 관리자는 신고 관리 화면(/admin/reports)에 들어가 글을 가리거나 유지할 수 있다.
-- is_admin은 사용자가 직접 켤 수 없도록 막혀 있으므로 여기서만 바꿀 수 있다.

-- ── 현재 계정 목록 확인 ────────────────────────────────────────────
select u.email, p.nickname, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;

-- ── 관리자로 지정 (이메일을 본인 것으로 바꿔서 실행) ────────────────
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'your-email@example.com');

-- ── 결과 확인 ──────────────────────────────────────────────────────
select u.email, p.nickname, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin = true;

-- ── 해제하려면 ─────────────────────────────────────────────────────
-- update public.profiles set is_admin = false
-- where id = (select id from auth.users where email = 'your-email@example.com');
