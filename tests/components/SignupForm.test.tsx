import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signUpMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: signUpMock },
  }),
}))

import { SignupForm } from '@/components/SignupForm'

beforeEach(() => {
  signUpMock.mockReset()
  signUpMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  vi.stubGlobal('location', { href: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SignupForm', () => {
  it('닉네임을 입력하지 않으면 에러 메시지를 보여주고 signUp을 호출하지 않는다', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    expect(await screen.findByText('닉네임을 입력해 주세요.')).toBeInTheDocument()
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('올바른 입력이면 닉네임을 메타데이터로 담아 signUp을 호출한다', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('닉네임'), '거르개유저')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        options: { data: { nickname: '거르개유저' } },
      })
    })

    await waitFor(() => {
      expect(window.location.href).toBe('/home')
    })
  })

  it('이미 등록된 이메일이면 서버 에러 메시지를 보여준다', async () => {
    signUpMock.mockResolvedValue({
      data: { user: null },
      error: { message: '이미 등록된 이메일입니다.' },
    })
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('닉네임'), '거르개유저')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    expect(await screen.findByText('이미 등록된 이메일입니다.')).toBeInTheDocument()
  })

  it('네트워크 오류로 signUp이 실패하면 대체 메시지를 보여주고 버튼을 다시 활성화한다', async () => {
    signUpMock.mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('닉네임'), '거르개유저')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    expect(
      await screen.findByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '가입하기' })).not.toBeDisabled()
  })
})
