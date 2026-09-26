begin;

-- 탈퇴해도 후기와 정보글은 남긴다.
--
-- 후기가 쌓이는 것이 이 서비스의 가치인데, 지금은 author_id가
-- not null + on delete cascade라 탈퇴 한 번에 그 사람 글이 전부 사라진다.
-- 작성자 연결만 끊어(set null) 글은 남기되 누가 썼는지는 알 수 없게 한다.
--
-- 연결이 끊긴 글은 author_id가 null이 되므로 RLS의 `author_id = auth.uid()`가
-- 참이 되지 않는다. 즉 아무도 수정·삭제할 수 없고, 운영자가 신고 처리로
-- 숨기는 것만 가능하다. 의도한 동작이다.

alter table public.reviews
  alter column author_id drop not null,
  drop constraint reviews_author_id_fkey,
  add constraint reviews_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete set null;

alter table public.community_posts
  alter column author_id drop not null,
  drop constraint community_posts_author_id_fkey,
  add constraint community_posts_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete set null;

-- 위 변경만 하면 연결이 끊긴 글을 아무도 지울 수 없게 된다. 후기 본문에 제3자의
-- 개인정보가 담긴 채로 작성자가 탈퇴해 버리면 삭제 요구에 응할 수단이 없다
-- (개인정보보호법 제36조). 운영자에게 삭제 경로를 연다.
--
-- companies는 지금까지 delete 정책이 하나도 없어 등록 후 누구도 지울 수 없었다.
-- 잘못 등록된 기업을 정리하려면 이것도 필요하다.
drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin"
  on public.reviews for delete to authenticated using (public.is_admin());

drop policy if exists "community_posts_delete_admin" on public.community_posts;
create policy "community_posts_delete_admin"
  on public.community_posts for delete to authenticated using (public.is_admin());

drop policy if exists "companies_delete_admin" on public.companies;
create policy "companies_delete_admin"
  on public.companies for delete to authenticated using (public.is_admin());

commit;
