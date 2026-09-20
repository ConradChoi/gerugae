import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const maybeSingleMock = vi.fn()
const getUserMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}))

vi.mock('@/components/LogoutButton', () => ({
  LogoutButton: () => <button>로그아웃</button>,
}))

import HomePage from '@/app/home/page'

beforeEach(() => {
  getUserMock.mockReset()
  maybeSingleMock.mockReset()
  getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HomePage', () => {
  it('프로필이 있으면 닉네임을 표시한다', async () => {
    maybeSingleMock.mockResolvedValue({ data: { nickname: '거르개유저' }, error: null })

    render(await HomePage())

    expect(screen.getByText('환영합니다, 거르개유저님')).toBeInTheDocument()
    expect(
      screen.getByText('기업 리뷰/정보공유 기능은 다음 단계에서 이 자리에 추가됩니다.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('프로필 조회에 실패하면 undefined 없이 대체 문구를 표시하고 에러를 로깅한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'not found' } })

    render(await HomePage())

    expect(document.body.textContent).not.toContain('undefined')
    expect(screen.getByText('환영합니다')).toBeInTheDocument()
    expect(screen.getByText('프로필 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(
      screen.getByText('기업 리뷰/정보공유 기능은 다음 단계에서 이 자리에 추가됩니다.')
    ).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })
})
