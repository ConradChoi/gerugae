begin;

-- companies.created_by는 NOT NULL인데 참조가 on delete set null이라,
-- 기업을 등록한 계정을 삭제하려 하면 제약 위반으로 실패한다.
-- 등록한 사람이 탈퇴해도 기업 정보는 다른 회원이 함께 쓰는 자료이므로 남겨야 한다.
-- 따라서 컬럼을 nullable로 바꾼다.
alter table public.companies
  alter column created_by drop not null;

commit;
