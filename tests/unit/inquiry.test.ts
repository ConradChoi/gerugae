import { describe, it, expect } from 'vitest'
import { validateInquiryInput, isValidInquiryToken, normalizeInquiryToken } from '@/lib/inquiry'

const base = {
  category: '일반 문의',
  content: '후기 내용에 제 이름이 그대로 적혀 있어 삭제를 요청합니다.',
  contact: '',
  targetUrl: '',
  honeypot: '',
}

describe('validateInquiryInput', () => {
  it('제대로 채우면 통과하고 빈 값은 null로 정리한다', () => {
    const result = validateInquiryInput(base)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.contact).toBeNull()
      expect(result.value.targetUrl).toBeNull()
    }
  })

  it('사람에게 보이지 않는 칸이 차 있으면 막는다', () => {
    // 캡챠를 두지 않기로 한 대신 자동 입력을 이걸로 거른다.
    const result = validateInquiryInput({ ...base, honeypot: 'http://spam.example' })

    expect(result.ok).toBe(false)
  })

  it('없는 유형은 받지 않는다', () => {
    const result = validateInquiryInput({ ...base, category: '아무거나' })

    expect(result).toEqual({ ok: false, message: '문의 유형을 선택해 주세요.' })
  })

  it('내용이 너무 짧으면 막는다', () => {
    const result = validateInquiryInput({ ...base, content: '짧음' })

    expect(result).toEqual({ ok: false, message: '내용을 10자 이상 적어 주세요.' })
  })

  it('내용이 2000자를 넘으면 막는다', () => {
    const result = validateInquiryInput({ ...base, content: '가'.repeat(2001) })

    expect(result.ok).toBe(false)
  })

  it('앞뒤 공백은 정리한다', () => {
    const result = validateInquiryInput({
      ...base,
      content: `  ${base.content}  `,
      contact: '  test@example.com  ',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.content).toBe(base.content)
      expect(result.value.contact).toBe('test@example.com')
    }
  })
})

describe('조회 코드', () => {
  it('대소문자와 공백을 가리지 않는다', () => {
    expect(normalizeInquiryToken('  abcdefghjk23  ')).toBe('ABCDEFGHJK23')
    expect(isValidInquiryToken('abcdefghjk23')).toBe(true)
  })

  it('12자리가 아니면 받지 않는다', () => {
    expect(isValidInquiryToken('ABCDEFGHJK2')).toBe(false)
    expect(isValidInquiryToken('ABCDEFGHJK234')).toBe(false)
  })

  it('헷갈리는 문자(0, 1, I, O)는 코드에 쓰지 않는다', () => {
    expect(isValidInquiryToken('ABCDEFGHJK01')).toBe(false)
    expect(isValidInquiryToken('ABCDEFGHJKIO')).toBe(false)
  })
})
