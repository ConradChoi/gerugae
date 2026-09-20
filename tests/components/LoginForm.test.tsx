import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signInMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInMock },
  }),
}))

import { LoginForm } from '@/components/LoginForm'

beforeEach(() => {
  signInMock.mockReset()
  signInMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  vi.stubGlobal('location', { href: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginForm', () => {
  it('비밀번호가 비어있으면 에러를 보여주고 signInWithPassword를 호출하지 않는다', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('비밀번호를 입력해 주세요.')).toBeInTheDocument()
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('올바른 입력이면 signInWithPassword를 호출한다', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(window.location.href).toBe('/home')
    })
  })

  it('인증 실패 시 서버 에러 메시지를 보여준다', async () => {
    signInMock.mockResolvedValue({ data: { user: null }, error: { message: '잘못된 로그인 정보입니다.' } })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('잘못된 로그인 정보입니다.')).toBeInTheDocument()
  })

  it('네트워크 오류로 signInWithPassword가 실패하면 대체 메시지를 보여주고 버튼을 다시 활성화한다', async () => {
    signInMock.mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).not.toBeDisabled()
  })
})
