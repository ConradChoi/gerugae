-- 통합 테스트용 시드 계정에 회원 자격을 부여한다 (최초 1회만).
--
-- 콘텐츠는 초대 코드를 쓴 회원만 볼 수 있는데, 회원 자격은 기존 회원의 코드로만
-- 얻을 수 있어 테스트가 스스로 시작할 수 없다. 시드 계정 하나에만 자격을 주면
-- 이후 테스트 계정들은 그 계정의 초대 코드를 받아 회원이 된다.
--
-- 실행 전에 `npm run test:integration` 을 한 번 돌려 시드 계정이 만들어지게 한다.
-- (가입은 성공하고, 회원 자격이 없다는 오류로 멈춘다)

update public.profiles
set member_since = now()
where id = (select id from auth.users where email = 'seed-member@example.com');

-- 결과 확인
select u.email, p.nickname, p.member_since is not null as 회원자격
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'seed-member@example.com';
