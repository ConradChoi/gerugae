import { describe, it, expect } from 'vitest'
import { validateWithdrawInput } from '@/lib/withdraw'

describe('validateWithdrawInput', () => {
  it('확인 체크를 하지 않으면 막는다', () => {
    const result = validateWithdrawInput({ password: 'password123!', confirmed: false })

    expect(result).toEqual({ ok: false, message: '안내를 읽고 동의해 주세요.' })
  })

  it('비밀번호가 비어 있으면 막는다', () => {
    const result = validateWithdrawInput({ password: '', confirmed: true })

    expect(result).toEqual({ ok: false, message: '비밀번호를 입력해 주세요.' })
  })

  it('둘 다 갖추면 통과한다', () => {
    const result = validateWithdrawInput({ password: 'password123!', confirmed: true })

    expect(result).toEqual({ ok: true })
  })
})
