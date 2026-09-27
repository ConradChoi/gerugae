begin;

-- profiles.invite_code_id 에 외래키를 건다.
--
-- 0006에서 이 컬럼을 그냥 uuid로 두어, 초대 코드 원본이 사라진 뒤에도(발급자가
-- 탈퇴하면 코드가 함께 지워진다) 식별자 값만 남아 있었다. 되짚을 대상이 없는
-- 값이라 쓸모가 없는데도 프로필에 계속 남는다.
-- 처리방침에 적은 "발급자 탈퇴 시 즉시 삭제"와도 어긋난다.

-- 이미 끊어진 값이 있으면 먼저 비운다. 남겨 두면 외래키를 걸 수 없다.
update public.profiles p
set invite_code_id = null
where invite_code_id is not null
  and not exists (select 1 from public.invite_codes c where c.id = p.invite_code_id);

alter table public.profiles
  drop constraint if exists profiles_invite_code_id_fkey,
  add constraint profiles_invite_code_id_fkey
    foreign key (invite_code_id) references public.invite_codes(id) on delete set null;

commit;
