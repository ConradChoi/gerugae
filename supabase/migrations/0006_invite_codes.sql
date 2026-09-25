begin;

-- ─────────────────────────────────────────────────────────────
-- 회원 자격: 초대 코드를 쓴 계정만 콘텐츠를 볼 수 있다
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists member_since timestamptz,
  add column if not exists invited_by uuid references public.profiles(id) on delete set null,
  add column if not exists invite_code_id uuid;

-- 열람 권한 판단용. 관리자는 코드 없이도 통과한다.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select member_since is not null or is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke execute on function public.is_member() from public;
grant execute on function public.is_member() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- invite_codes : 회원이 발급하는 초대 코드
-- ─────────────────────────────────────────────────────────────
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  issuer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  max_uses int not null default 3 check (max_uses between 1 and 3),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists invite_codes_issuer_idx on public.invite_codes (issuer_id, created_at desc);

alter table public.invite_codes enable row level security;

-- 자기 코드와 관리자만 조회할 수 있다. 코드 값 자체가 노출되면 안 되기 때문이다.
drop policy if exists "invite_codes_select_own_or_admin" on public.invite_codes;
create policy "invite_codes_select_own_or_admin"
  on public.invite_codes for select to authenticated
  using (issuer_id = auth.uid() or public.is_admin());

-- 발급은 아래 함수로만 한다 (활성 코드 1개 제한을 강제하기 위해)
-- 직접 insert는 허용하지 않는다.

-- 아직 쓸 수 있는 코드가 있으면 그대로 돌려주고, 없으면 새로 만든다.
create or replace function public.issue_invite_code()
returns table (code text, max_uses int, used_count int, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.invite_codes%rowtype;
  new_code text;
begin
  if not public.is_member() then
    raise exception '초대 코드를 발급할 권한이 없습니다';
  end if;

  select * into existing
  from public.invite_codes c
  where c.issuer_id = auth.uid()
    and c.expires_at > now()
    and c.used_count < c.max_uses
  order by c.created_at desc
  limit 1;

  if found then
    return query select existing.code, existing.max_uses, existing.used_count, existing.expires_at;
    return;
  end if;

  -- 헷갈리는 문자(0/O, 1/I)를 뺀 8자리
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 31)::int + 1, 1), '')
  into new_code
  from generate_series(1, 8);

  insert into public.invite_codes (code) values (new_code);

  return query
  select c.code, c.max_uses, c.used_count, c.expires_at
  from public.invite_codes c
  where c.code = new_code;
end;
$$;

revoke execute on function public.issue_invite_code() from public;
grant execute on function public.issue_invite_code() to authenticated;

-- 코드 사용. 성공하면 회원 자격을 주고 초대 경로를 기록한다.
create or replace function public.redeem_invite_code(input_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.invite_codes%rowtype;
begin
  if auth.uid() is null then
    return '로그인이 필요합니다';
  end if;

  if (select member_since is not null from public.profiles where id = auth.uid()) then
    return '이미 가입이 완료된 계정입니다';
  end if;

  select * into target
  from public.invite_codes c
  where upper(c.code) = upper(trim(input_code))
  for update;

  if not found then
    return '존재하지 않는 코드입니다';
  end if;

  if target.expires_at <= now() then
    return '기한이 지난 코드입니다';
  end if;

  if target.used_count >= target.max_uses then
    return '사용 가능 인원을 모두 채운 코드입니다';
  end if;

  if target.issuer_id = auth.uid() then
    return '본인이 발급한 코드는 쓸 수 없습니다';
  end if;

  update public.invite_codes
  set used_count = used_count + 1
  where id = target.id;

  update public.profiles
  set member_since = now(),
      invited_by = target.issuer_id,
      invite_code_id = target.id
  where id = auth.uid();

  return 'ok';
end;
$$;

revoke execute on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 콘텐츠 열람은 회원에게만
-- ─────────────────────────────────────────────────────────────
drop policy if exists "companies_select_authenticated" on public.companies;
create policy "companies_select_member"
  on public.companies for select to authenticated using (public.is_member());

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_member"
  on public.companies for insert to authenticated
  with check (auth.uid() = created_by and public.is_member());

drop policy if exists "reviews_select_visible" on public.reviews;
create policy "reviews_select_visible"
  on public.reviews for select to authenticated
  using (public.is_member() and (hidden_at is null or author_id = auth.uid() or public.is_admin()));

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_member"
  on public.reviews for insert to authenticated
  with check (auth.uid() = author_id and public.is_member());

drop policy if exists "community_posts_select_visible" on public.community_posts;
create policy "community_posts_select_visible"
  on public.community_posts for select to authenticated
  using (public.is_member() and (hidden_at is null or author_id = auth.uid() or public.is_admin()));

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_member"
  on public.community_posts for insert to authenticated
  with check (auth.uid() = author_id and public.is_member());

drop policy if exists "review_tags_select_authenticated" on public.review_tags;
create policy "review_tags_select_member"
  on public.review_tags for select to authenticated using (public.is_member());

-- 기존 회원(코드 제도 도입 전 가입자)은 그대로 이용할 수 있게 한다
update public.profiles set member_since = created_at where member_since is null;

commit;
