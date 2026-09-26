import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const getUserMock = vi.fn()
const redirectMock = vi.fn()
const rpcMock = vi.fn()
const countMock = vi.fn()

const supabaseStub = {
  auth: { getUser: getUserMock },
  rpc: rpcMock,
  from: () => ({
    select: () => ({
      eq: () => countMock(),
    }),
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => supabaseStub,
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    redirectMock(path)
    throw new Error('NEXT_REDIRECT')
  },
}))

vi.mock('@/components/WithdrawForm', () => ({
  WithdrawForm: () => <button>탈퇴하기</button>,
}))

vi.mock('@/components/layout/Header', () => ({
  MemberHeader: () => <header />,
}))

import WithdrawPage from '@/app/mypage/withdraw/page'

beforeEach(() => {
  getUserMock.mockReset()
  redirectMock.mockReset()
  rpcMock.mockReset()
  countMock.mockReset()

  getUserMock.mockResolvedValue({ data: { user: { id: 'u1', email: 'me@example.com' } } })
  rpcMock.mockResolvedValue({ data: true, error: null })
  countMock.mockResolvedValue({ count: 0 })
})

describe('WithdrawPage', () => {
  it('초대 코드를 쓰지 않은 계정도 탈퇴할 수 있다', async () => {
    // 코드를 못 받았다고 계정을 못 지우면 이메일과 비밀번호가 본인 의사와
    // 무관하게 남는다. is_member()가 false여도 /invite로 튕기면 안 된다.
    rpcMock.mockResolvedValue({ data: false, error: null })

    render(await WithdrawPage())

    expect(redirectMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeInTheDocument()
  })

  it('로그인하지 않았으면 /login으로 보낸다', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    await expect(WithdrawPage()).rejects.toThrow('NEXT_REDIRECT')

    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('남게 될 글의 개수를 보여 준다', async () => {
    countMock.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 2 })

    render(await WithdrawPage())

    expect(screen.getByText(/후기 3개/)).toBeInTheDocument()
    expect(screen.getByText(/정보글 2개/)).toBeInTheDocument()
  })

  it('쓴 글이 없으면 남는 글이 없다고 알린다', async () => {
    render(await WithdrawPage())

    expect(screen.getByText('작성하신 후기와 정보글이 없습니다.')).toBeInTheDocument()
  })
})
