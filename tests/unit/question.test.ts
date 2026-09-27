import { describe, it, expect } from 'vitest'
import { validateQuestionInput, validateAnswerInput, displayAuthor } from '@/lib/question'

const base = {
  category: '계약·대금',
  title: '검수 후 대금 지급이 두 달째 미뤄지고 있습니다',
  content: '계약서에는 검수 완료 후 30일 내 지급으로 되어 있는데 연락이 닿지 않습니다.',
}

describe('validateQuestionInput', () => {
  it('제대로 채우면 통과하고 앞뒤 공백은 정리한다', () => {
    const result = validateQuestionInput({ ...base, title: `  ${base.title}  ` })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.title).toBe(base.title)
  })

  it('없는 분류는 받지 않는다', () => {
    const result = validateQuestionInput({ ...base, category: '아무거나' })

    expect(result).toEqual({ ok: false, message: '분류를 선택해 주세요.' })
  })

  it('제목이 너무 짧으면 막는다', () => {
    const result = validateQuestionInput({ ...base, title: 'ㄱ' })

    expect(result.ok).toBe(false)
  })

  it('내용이 10자 미만이면 막는다', () => {
    const result = validateQuestionInput({ ...base, content: '짧아요' })

    expect(result).toEqual({ ok: false, message: '내용을 10자 이상 적어 주세요.' })
  })

  it('내용이 4000자를 넘으면 막는다', () => {
    const result = validateQuestionInput({ ...base, content: '가'.repeat(4001) })

    expect(result.ok).toBe(false)
  })
})

describe('validateAnswerInput', () => {
  it('5자 이상이면 통과한다', () => {
    expect(validateAnswerInput('내용증명부터 보내세요')).toEqual({
      ok: true,
      value: '내용증명부터 보내세요',
    })
  })

  it('너무 짧으면 막는다', () => {
    expect(validateAnswerInput('네')).toEqual({ ok: false, message: '답변을 5자 이상 적어 주세요.' })
  })

  it('공백만 있으면 막는다', () => {
    expect(validateAnswerInput('        ').ok).toBe(false)
  })
})

describe('displayAuthor', () => {
  it('익명 글은 닉네임을 쓰지 않는다', () => {
    // 뷰가 익명 글의 author_nickname 을 null 로 내리지만, 혹시 값이 실려 와도
    // 화면에서 다시 한 번 막는다.
    expect(displayAuthor({ is_anonymous: true, author_nickname: '거르개유저' })).toBe('익명')
  })

  it('익명이 아니면 닉네임을 보여 준다', () => {
    expect(displayAuthor({ is_anonymous: false, author_nickname: '거르개유저' })).toBe('거르개유저')
  })

  it('작성자가 탈퇴했으면 그렇게 표시한다', () => {
    expect(displayAuthor({ is_anonymous: false, author_nickname: null })).toBe('탈퇴한 회원')
  })
})
