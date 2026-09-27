begin;

-- 묻고 답하기.
--
-- 정보글(community_posts)은 company_id 가 필수라 특정 기업에 매여 있다.
-- "계약서 이 조항 괜찮나요", "대금을 못 받았는데 어떻게 하죠" 같은 질문은
-- 기업을 특정하지 않거나 특정하고 싶지 않은 경우가 많아 올릴 데가 없었다.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  -- 탈퇴해도 질문은 남긴다. 후기·정보글과 같은 방침이다(0008).
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  category text not null check (
    category in ('계약·대금', '저작권·권리', '세무·4대보험', '분쟁·법률', '기타')
  ),
  title text not null check (char_length(trim(title)) between 2 and 100),
  content text not null check (char_length(trim(content)) between 10 and 4000),
  -- 미수금이나 분쟁 이야기는 후기보다 민감해, 글마다 고를 수 있게 한다.
  is_anonymous boolean not null default false,
  accepted_answer_id uuid,
  hidden_at timestamptz,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_created_idx on public.questions (created_at desc);
create index if not exists questions_category_idx on public.questions (category, created_at desc);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  content text not null check (char_length(trim(content)) between 5 and 2000),
  is_anonymous boolean not null default false,
  hidden_at timestamptz,
  hidden_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists answers_question_idx on public.answers (question_id, created_at);

-- 채택된 답변. 두 표가 서로를 참조하므로 뒤에 건다.
alter table public.questions
  drop constraint if exists questions_accepted_answer_id_fkey,
  add constraint questions_accepted_answer_id_fkey
    foreign key (accepted_answer_id) references public.answers(id) on delete set null;

drop trigger if exists questions_touch_updated_at on public.questions;
create trigger questions_touch_updated_at
  before update on public.questions
  for each row execute function public.touch_updated_at();

drop trigger if exists answers_touch_updated_at on public.answers;
create trigger answers_touch_updated_at
  before update on public.answers
  for each row execute function public.touch_updated_at();

alter table public.questions enable row level security;
alter table public.answers enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 읽기는 아래 뷰로만 한다.
--
-- 익명 글의 author_id 를 그대로 내려보내면 profiles 에서 닉네임을 조회할 수
-- 있어 익명이 깨진다. 그래서 원본 표의 조회 권한을 걷고 뷰만 남긴다.
--
-- 뷰는 소유자 권한으로 도는 기본형(security definer)이다. security_invoker 로
-- 두면 호출자 권한으로 원본을 읽으러 가서, 조회 권한을 걷는 순간 뷰까지
-- 깨진다. 대신 소유자 권한이라 원본의 RLS가 적용되지 않으므로, 아래 RLS와
-- 같은 조건을 뷰의 where 에 직접 적는다. 둘은 항상 같이 고쳐야 한다.
--
-- auth.uid() 는 역할이 아니라 요청에 실린 JWT를 읽으므로, 소유자 권한으로
-- 돌아도 호출한 사람을 가리킨다.
-- ─────────────────────────────────────────────────────────────
drop view if exists public.questions_view;
create view public.questions_view as
select
  q.id,
  q.category,
  q.title,
  q.content,
  q.is_anonymous,
  q.accepted_answer_id,
  q.hidden_at,
  q.created_at,
  q.updated_at,
  case when q.is_anonymous then null else q.author_id end as author_id,
  case when q.is_anonymous then null else p.nickname end as author_nickname,
  q.author_id is not distinct from auth.uid() as is_mine,
  (select count(*) from public.answers a where a.question_id = q.id and a.hidden_at is null)
    as answer_count
from public.questions q
left join public.profiles p on p.id = q.author_id
where public.is_member()
  and (q.hidden_at is null or q.author_id = auth.uid() or public.is_admin());

drop view if exists public.answers_view;
create view public.answers_view as
select
  a.id,
  a.question_id,
  a.content,
  a.is_anonymous,
  a.hidden_at,
  a.created_at,
  a.updated_at,
  case when a.is_anonymous then null else a.author_id end as author_id,
  case when a.is_anonymous then null else p.nickname end as author_nickname,
  a.author_id is not distinct from auth.uid() as is_mine
from public.answers a
left join public.profiles p on p.id = a.author_id
where public.is_member()
  and (a.hidden_at is null or a.author_id = auth.uid() or public.is_admin());

-- 원본 표는 읽지 못하게 한다. 다만 수정·삭제가 `where id = ...` 를 쓰므로
-- id 하나만 남겨 둔다. 작성자는 여전히 드러나지 않는다.
revoke select on public.questions from authenticated, anon;
revoke select on public.answers from authenticated, anon;
grant select (id) on public.questions to authenticated;
grant select (id) on public.answers to authenticated;
grant select on public.questions_view to authenticated;
grant select on public.answers_view to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
drop policy if exists "questions_select_member" on public.questions;
create policy "questions_select_member"
  on public.questions for select to authenticated
  using (public.is_member() and (hidden_at is null or author_id = auth.uid() or public.is_admin()));

drop policy if exists "questions_insert_member" on public.questions;
create policy "questions_insert_member"
  on public.questions for insert to authenticated
  with check (auth.uid() = author_id and public.is_member());

drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own"
  on public.questions for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "questions_delete_own" on public.questions;
create policy "questions_delete_own"
  on public.questions for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "questions_delete_admin" on public.questions;
create policy "questions_delete_admin"
  on public.questions for delete to authenticated using (public.is_admin());

drop policy if exists "questions_update_admin" on public.questions;
create policy "questions_update_admin"
  on public.questions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "answers_select_member" on public.answers;
create policy "answers_select_member"
  on public.answers for select to authenticated
  using (public.is_member() and (hidden_at is null or author_id = auth.uid() or public.is_admin()));

drop policy if exists "answers_insert_member" on public.answers;
create policy "answers_insert_member"
  on public.answers for insert to authenticated
  with check (auth.uid() = author_id and public.is_member());

drop policy if exists "answers_update_own" on public.answers;
create policy "answers_update_own"
  on public.answers for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "answers_delete_own" on public.answers;
create policy "answers_delete_own"
  on public.answers for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "answers_delete_admin" on public.answers;
create policy "answers_delete_admin"
  on public.answers for delete to authenticated using (public.is_admin());

drop policy if exists "answers_update_admin" on public.answers;
create policy "answers_update_admin"
  on public.answers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 채택은 질문자만 할 수 있다. 위 update 정책이 이미 작성자로 제한하지만,
-- 남의 질문에 달린 답변을 제 질문의 채택으로 끌어오지 못하게 함께 막는다.
create or replace function public.accept_answer(input_question_id uuid, input_answer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.questions q
    where q.id = input_question_id and q.author_id = auth.uid()
  ) then
    raise exception '본인이 올린 질문만 채택할 수 있습니다';
  end if;

  if input_answer_id is not null and not exists (
    select 1 from public.answers a
    where a.id = input_answer_id and a.question_id = input_question_id
  ) then
    raise exception '이 질문에 달린 답변이 아닙니다';
  end if;

  update public.questions
  set accepted_answer_id = input_answer_id
  where id = input_question_id;
end;
$$;

revoke execute on function public.accept_answer(uuid, uuid) from public;
grant execute on function public.accept_answer(uuid, uuid) to authenticated;

-- 신고 대상에 질문과 답변을 더한다.
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
  check (target_type in ('review', 'post', 'company', 'question', 'answer'));

commit;
