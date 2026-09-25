import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const maybeSingleMock = vi.fn()
const getUserMock = vi.fn()
const redirectMock = vi.fn()

// 홈은 requireMember()로 로그인+초대 코드 사용 여부를 함께 확인한다.
const supabaseStub = {
  auth: { getUser: getUserMock },
  rpc: async () => ({ data: true, error: null }),
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: maybeSingleMock,
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }),
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => supabaseStub,
}))

vi.mock('@/lib/membership', () => ({
  requireMember: async () => {
    const {
      data: { user },
    } = await getUserMock()
    if (!user) {
      redirectMock('/login')
      throw new Error('NEXT_REDIRECT')
    }
    return { supabase: supabaseStub, user }
  },
}))

vi.mock('@/components/LogoutButton', () => ({
  LogoutButton: () => <button>로그아웃</button>,
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}))

import HomePage from '@/app/home/page'

beforeEach(() => {
  getUserMock.mockReset()
  maybeSingleMock.mockReset()
  redirectMock.mockReset()
  getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HomePage', () => {
  it('프로필이 있으면 닉네임을 표시한다', async () => {
    maybeSingleMock.mockResolvedValue({ data: { nickname: '거르개유저' }, error: null })

    render(await HomePage())

    expect(
      screen.getByRole('heading', { name: '거르개유저님, 어떤 기업과 일하시나요?' })
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('기업 이름으로 검색')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('프로필 조회에 실패하면 undefined 없이 대체 문구를 표시하고 에러를 로깅한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'not found' } })

    render(await HomePage())

    expect(document.body.textContent).not.toContain('undefined')
    expect(screen.getByRole('heading', { name: '어떤 기업과 일하시나요?' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('기업 이름으로 검색')).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  it('user가 없으면 /login으로 리다이렉트하고 프로필을 조회하지 않는다', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    redirectMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT')

    expect(redirectMock).toHaveBeenCalledWith('/login')
    expect(maybeSingleMock).not.toHaveBeenCalled()
  })
})
