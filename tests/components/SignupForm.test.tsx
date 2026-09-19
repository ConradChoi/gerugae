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
})
