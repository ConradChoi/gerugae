begin;

-- ─────────────────────────────────────────────────────────────
-- companies : 사용자가 직접 등록하는 원천사/에이전시
-- ─────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  biz_reg_number text check (biz_reg_number is null or char_length(biz_reg_number) between 10 and 12),
  category text not null check (category in ('원천사', '웹에이전시', '인력회사', '기타')),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 사업자등록번호가 있으면 중복 등록을 막는다 (없으면 제한하지 않는다)
create unique index if not exists companies_biz_reg_number_key
  on public.companies (biz_reg_number)
  where biz_reg_number is not null;

-- 이름 검색용
create index if not exists companies_name_idx on public.companies (name);

alter table public.companies enable row level security;

drop policy if exists "companies_select_authenticated" on public.companies;
create policy "companies_select_authenticated"
  on public.companies for select to authenticated using (true);

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own"
  on public.companies for insert to authenticated with check (auth.uid() = created_by);

-- 등록자만 수정할 수 있다. 오정보 신고 기능은 이후 단계에서 다룬다.
drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own"
  on public.companies for update to authenticated
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- ─────────────────────────────────────────────────────────────
-- tags : 고정 카테고리 (사용자가 추가하지 못한다)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0
);

alter table public.tags enable row level security;

drop policy if exists "tags_select_authenticated" on public.tags;
create policy "tags_select_authenticated"
  on public.tags for select to authenticated using (true);

insert into public.tags (label, sort_order) values
  ('대금지연', 1),
  ('갑질/부당대우', 2),
  ('계약불이행', 3),
  ('소통미흡', 4),
  ('정산정확', 5),
  ('재계약의사', 6)
on conflict (label) do nothing;

-- ─────────────────────────────────────────────────────────────
-- reviews : 기업당 한 사람이 하나만 (수정 가능)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text not null check (char_length(trim(content)) between 10 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, author_id)
);

create index if not exists reviews_company_idx on public.reviews (company_id, created_at desc);
create index if not exists reviews_author_idx on public.reviews (author_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
  on public.reviews for select to authenticated using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete to authenticated using (auth.uid() = author_id);

-- ─────────────────────────────────────────────────────────────
-- review_tags : 후기 ↔ 태그 연결
-- ─────────────────────────────────────────────────────────────
create table if not exists public.review_tags (
  review_id uuid not null references public.reviews(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (review_id, tag_id)
);

alter table public.review_tags enable row level security;

drop policy if exists "review_tags_select_authenticated" on public.review_tags;
create policy "review_tags_select_authenticated"
  on public.review_tags for select to authenticated using (true);

-- 연결 권한은 해당 후기의 작성자에게만 준다
drop policy if exists "review_tags_write_own" on public.review_tags;
create policy "review_tags_write_own"
  on public.review_tags for insert to authenticated
  with check (exists (
    select 1 from public.reviews r
    where r.id = review_id and r.author_id = auth.uid()
  ));

drop policy if exists "review_tags_delete_own" on public.review_tags;
create policy "review_tags_delete_own"
  on public.review_tags for delete to authenticated
  using (exists (
    select 1 from public.reviews r
    where r.id = review_id and r.author_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────
-- community_posts : 기업 상세의 정보공유 탭
-- ─────────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 100),
  content text not null check (char_length(trim(content)) between 10 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_company_idx
  on public.community_posts (company_id, created_at desc);

alter table public.community_posts enable row level security;

drop policy if exists "community_posts_select_authenticated" on public.community_posts;
create policy "community_posts_select_authenticated"
  on public.community_posts for select to authenticated using (true);

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
  on public.community_posts for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
  on public.community_posts for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own"
  on public.community_posts for delete to authenticated using (auth.uid() = author_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_touch_updated_at on public.reviews;
create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute procedure public.touch_updated_at();

drop trigger if exists community_posts_touch_updated_at on public.community_posts;
create trigger community_posts_touch_updated_at
  before update on public.community_posts
  for each row execute procedure public.touch_updated_at();

commit;
