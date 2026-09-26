import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUserMock = vi.fn()
const signInWithPasswordMock = vi.fn()
const signOutMock = vi.fn()
const deleteUserMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { admin: { deleteUser: deleteUserMock } } }),
}))

import { POST } from '@/app/api/account/withdraw/route'

function request(body: unknown) {
  return new Request('http://localhost/api/account/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  getUserMock.mockReset()
  signInWithPasswordMock.mockReset()
  signOutMock.mockReset()
  deleteUserMock.mockReset()

  getUserMock.mockResolvedValue({ data: { user: { id: 'u1', email: 'me@example.com' } } })
  signInWithPasswordMock.mockResolvedValue({ error: null })
  signOutMock.mockResolvedValue({ error: null })
  deleteUserMock.mockResolvedValue({ error: null })
})

describe('POST /api/account/withdraw', () => {
  it('로그인하지 않았으면 계정을 지우지 않는다', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    const response = await POST(request({ password: 'pw', confirmed: true }))

    expect(response.status).toBe(401)
    expect(deleteUserMock).not.toHaveBeenCalled()
  })

  it('비밀번호가 틀리면 계정을 지우지 않는다', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    const response = await POST(request({ password: '틀린비밀번호', confirmed: true }))

    expect(response.status).toBe(403)
    expect(deleteUserMock).not.toHaveBeenCalled()
  })

  it('확인 체크가 없으면 비밀번호도 확인하지 않고 막는다', async () => {
    const response = await POST(request({ password: 'pw', confirmed: false }))

    expect(response.status).toBe(400)
    expect(signInWithPasswordMock).not.toHaveBeenCalled()
    expect(deleteUserMock).not.toHaveBeenCalled()
  })

  it('요청에 남의 id를 넣어도 세션의 본인 계정만 지운다', async () => {
    const response = await POST(
      request({ password: 'pw', confirmed: true, userId: '남의-계정-id', id: '남의-계정-id' })
    )

    expect(response.status).toBe(200)
    expect(deleteUserMock).toHaveBeenCalledWith('u1')
  })

  it('본인 확인도 세션의 이메일로 한다', async () => {
    await POST(request({ password: 'pw', confirmed: true, email: 'other@example.com' }))

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'me@example.com',
      password: 'pw',
    })
  })

  it('삭제에 성공하면 남은 세션도 정리한다', async () => {
    const response = await POST(request({ password: 'pw', confirmed: true }))

    expect(response.status).toBe(200)
    expect(signOutMock).toHaveBeenCalled()
  })

  it('삭제에 실패하면 세션을 정리하지 않고 오류를 알린다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteUserMock.mockResolvedValue({ error: { message: 'boom' } })

    const response = await POST(request({ password: 'pw', confirmed: true }))

    expect(response.status).toBe(500)
    expect(signOutMock).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('본문이 JSON이 아니면 막는다', async () => {
    const response = await POST(
      new Request('http://localhost/api/account/withdraw', { method: 'POST', body: 'not json' })
    )

    expect(response.status).toBe(400)
    expect(deleteUserMock).not.toHaveBeenCalled()
  })
})
