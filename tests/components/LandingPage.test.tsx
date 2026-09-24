import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '@/app/page'

describe('LandingPage', () => {
  it('서비스 소개와 면책 문구를 보여준다', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { name: '거를 곳은 거르고 일하자' })).toBeInTheDocument()
    expect(
      screen.getByText(/게시물은 작성자 개인 의견이며.*법적 책임을 지지 않습니다/)
    ).toBeInTheDocument()
    expect(screen.getByText('가입한 회원만 리뷰를 열람할 수 있습니다.')).toBeInTheDocument()
  })

  it('가입과 로그인으로 가는 경로를 제공한다', () => {
    render(LandingPage())

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter(Boolean)

    expect(hrefs).toContain('/signup')
    expect(hrefs).toContain('/login')
  })
})
