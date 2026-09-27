begin;

-- 문의·권리침해 신고 창구.
--
-- 이메일을 두지 않기로 해서, 접수한 사람에게 답을 돌려줄 길이 따로 필요하다.
-- 접수할 때 조회 코드를 발급하고 그 코드로만 자기 문의와 운영자 답변을 볼 수
-- 있게 한다. 개인정보보호법 제35조·제36조가 요구하는 회신을 이메일 없이
-- 처리하기 위한 구조다.
--
-- 회원이 아닌 사람(삭제를 요청하는 기업, 글에 개인정보가 담긴 제3자)도 써야
-- 하므로 로그인 없이 접수할 수 있어야 한다.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  access_token text not null unique,
  category text not null check (category in ('일반 문의', '게시물 삭제 요청', '기업 정보 오류')),
  content text not null check (char_length(content) between 10 and 2000),
  -- 회신받을 연락처. 조회 코드로 확인하면 되므로 필수는 아니다.
  contact text check (contact is null or char_length(contact) <= 200),
  -- 문제되는 글의 주소
  target_url text check (target_url is null or char_length(target_url) <= 500),
  status text not null default '접수' check (status in ('접수', '처리 중', '완료')),
  reply text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

-- 표에 직접 닿는 것은 운영자만. 나머지는 아래 함수로만 오간다.
drop policy if exists "inquiries_admin_select" on public.inquiries;
create policy "inquiries_admin_select"
  on public.inquiries for select to authenticated using (public.is_admin());

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update"
  on public.inquiries for update to authenticated using (public.is_admin());

drop policy if exists "inquiries_admin_delete" on public.inquiries;
create policy "inquiries_admin_delete"
  on public.inquiries for delete to authenticated using (public.is_admin());

-- 접수. 조회 코드를 만들어 돌려준다.
create or replace function public.submit_inquiry(
  input_category text,
  input_content text,
  input_contact text default null,
  input_target_url text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
  recent_count int;
begin
  -- 로그인 없이 쓰는 창구라 쏟아져 들어올 수 있다. IP를 알 수 없으므로
  -- 전체 유입량으로만 막는다. 평상시에는 걸릴 일이 없는 수준으로 둔다.
  select count(*) into recent_count
  from public.inquiries
  where created_at > now() - interval '5 minutes';

  if recent_count >= 30 then
    raise exception '문의가 몰리고 있습니다. 잠시 후 다시 시도해 주세요.';
  end if;

  -- 헷갈리는 문자(0/O, 1/I)를 뺀 12자리
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 31)::int + 1, 1), '')
  into new_token
  from generate_series(1, 12);

  insert into public.inquiries (access_token, category, content, contact, target_url)
  values (
    new_token,
    input_category,
    input_content,
    nullif(btrim(coalesce(input_contact, '')), ''),
    nullif(btrim(coalesce(input_target_url, '')), '')
  );

  return new_token;
end;
$$;

revoke execute on function public.submit_inquiry(text, text, text, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text) to anon, authenticated;

-- 조회 코드로 자기 문의를 확인한다. 코드를 모르면 아무것도 나오지 않는다.
create or replace function public.lookup_inquiry(input_token text)
returns table (
  category text,
  content text,
  target_url text,
  status text,
  reply text,
  created_at timestamptz,
  replied_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select i.category, i.content, i.target_url, i.status, i.reply, i.created_at, i.replied_at
  from public.inquiries i
  where i.access_token = upper(btrim(input_token));
$$;

revoke execute on function public.lookup_inquiry(text) from public;
grant execute on function public.lookup_inquiry(text) to anon, authenticated;

commit;
