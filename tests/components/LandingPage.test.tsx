import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '@/app/page'

describe('LandingPage', () => {
  it('서비스 소개와 면책 문구, 가입/로그인 링크를 보여준다', () => {
    render(<LandingPage />)

    expect(screen.getByText(/거르개/)).toBeInTheDocument()
    expect(
      screen.getByText(/게시물은 작성자 개인 의견이며.*법적 책임을 지지 않습니다/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
  })
})
