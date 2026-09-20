import { describe, it, expect } from 'vitest'
import { validateSignupInput, validateLoginInput } from '@/lib/validation'

describe('validateSignupInput', () => {
  it('올바른 입력은 valid:true를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('이메일 형식이 아니면 email 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'not-an-email',
      password: 'password123',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBeDefined()
  })

  it('비밀번호가 8자 미만이면 password 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: '1234',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })

  it('닉네임이 비어있으면 nickname 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '  ',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.nickname).toBeDefined()
  })

  it('닉네임이 20자를 초과하면 nickname 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '가'.repeat(21),
    })
    expect(result.valid).toBe(false)
    expect(result.errors.nickname).toBeDefined()
  })

  it('비밀번호가 공백으로만 이루어지면 password 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: '        ',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })
})

describe('validateLoginInput', () => {
  it('올바른 입력은 valid:true를 반환한다', () => {
    const result = validateLoginInput({ email: 'user@example.com', password: 'password123' })
    expect(result.valid).toBe(true)
  })

  it('비밀번호가 비어있으면 password 에러를 반환한다', () => {
    const result = validateLoginInput({ email: 'user@example.com', password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })
})
