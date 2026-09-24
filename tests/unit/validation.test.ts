import { describe, it, expect } from 'vitest'
import {
  validateSignupInput,
  validateLoginInput,
  validateCompanyInput,
} from '@/lib/validation'

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

describe('validateCompanyInput', () => {
  it('올바른 입력은 valid:true를 반환한다', () => {
    const result = validateCompanyInput({
      name: '주식회사 거르개',
      bizRegNumber: '123-45-67890',
      category: '웹에이전시',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('사업자등록번호는 비워둘 수 있다', () => {
    const result = validateCompanyInput({
      name: '주식회사 거르개',
      bizRegNumber: '',
      category: '원천사',
    })
    expect(result.valid).toBe(true)
  })

  it('기업 이름이 비어있으면 name 에러를 반환한다', () => {
    const result = validateCompanyInput({ name: '   ', bizRegNumber: '', category: '원천사' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('분류를 고르지 않으면 category 에러를 반환한다', () => {
    const result = validateCompanyInput({ name: '거르개', bizRegNumber: '', category: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.category).toBeDefined()
  })

  it('사업자등록번호 숫자가 10자리가 아니면 에러를 반환한다', () => {
    const result = validateCompanyInput({
      name: '거르개',
      bizRegNumber: '123-45-678',
      category: '원천사',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.bizRegNumber).toBeDefined()
  })

  it('하이픈이 없어도 숫자 10자리면 통과한다', () => {
    const result = validateCompanyInput({
      name: '거르개',
      bizRegNumber: '1234567890',
      category: '기타',
    })
    expect(result.valid).toBe(true)
  })
})
