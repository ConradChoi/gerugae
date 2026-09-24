begin;

-- ─────────────────────────────────────────────────────────────
-- 관리자 구분
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- RLS는 컬럼 단위 제한을 못 하므로, 권한(GRANT)으로 막는다.
-- 이 처리가 없으면 사용자가 자기 프로필을 수정하면서 is_admin을 켤 수 있다.
revoke update on public.profiles from authenticated;
grant update (nickname) on public.profiles to authenticated;

-- auth.uid()의 관리자 여부. profiles를 RLS 없이 읽어야 하므로 security definer.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 가림(임시조치) 상태
-- ─────────────────────────────────────────────────────────────
alter table public.reviews
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text;

alter table public.community_posts
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text;

-- 가려진 글은 작성자와 관리자에게만 보인다
drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_visible"
  on public.reviews for select to authenticated
  using (hidden_at is null or author_id = auth.uid() or public.is_admin());

drop policy if exists "community_posts_select_authenticated" on public.community_posts;
create policy "community_posts_select_visible"
  on public.community_posts for select to authenticated
  using (hidden_at is null or author_id = auth.uid() or public.is_admin());

-- 관리자는 가림/해제를 할 수 있다
drop policy if exists "reviews_update_admin" on public.reviews;
create policy "reviews_update_admin"
  on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "community_posts_update_admin" on public.community_posts;
create policy "community_posts_update_admin"
  on public.community_posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- reports : 신고 접수
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('review', 'post', 'company')),
  target_id uuid not null,
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('허위사실', '명예훼손', '욕설/비방', '개인정보 노출', '광고/스팸', '정보 오류', '기타')),
  detail text check (detail is null or char_length(detail) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'hidden', 'kept')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  -- 같은 사람이 같은 대상을 여러 번 신고하지 못하게 한다
  unique (target_type, target_id, reporter_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- 신고자는 자기 신고만, 관리자는 전체를 본다
drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- 처리(가림/유지 결정)는 관리자만
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

commit;
