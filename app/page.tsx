import Link from 'next/link'

export default function LandingPage() {
  return (
    <main>
      <h1>거르개</h1>
      <p>프리랜서가 함께 일하는 원천사·에이전시를 리뷰하고 정보를 나누는 공간입니다.</p>
      <p>
        게시물은 작성자 개인 의견이며, 본 서비스는 게시물 내용에 대해 법적 책임을 지지 않습니다.
      </p>
      <nav>
        <Link href="/signup">회원가입</Link>
        <Link href="/login">로그인</Link>
      </nav>
    </main>
  )
}
