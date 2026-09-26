import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { prepareLegalDocument } from '@/lib/legal-document'

describe('prepareLegalDocument', () => {
  it('채우지 못한 자리가 남으면 본문을 내보내지 않는다', () => {
    const doc = prepareLegalDocument('# 이용약관\n\n서비스는 {{운영자 표기}}가 운영합니다.\n')

    expect(doc.ready).toBe(false)
    expect(doc.body).toBeNull()
  })

  it('[운영자 확인 필요] 표시도 미완성으로 본다', () => {
    const doc = prepareLegalDocument('# 처리방침\n\n보관 기간: [운영자 확인 필요]\n')

    expect(doc.ready).toBe(false)
  })

  it('다 채운 문서는 본문을 그대로 돌려준다', () => {
    const doc = prepareLegalDocument('# 이용약관\n\n## 제1조 (목적)\n\n이 약관은 ...\n')

    expect(doc.ready).toBe(true)
    expect(doc.body).toContain('제1조 (목적)')
  })

  it('내부 메모와 운영자 체크리스트는 걷어낸다', () => {
    const doc = prepareLegalDocument(
      [
        '# 처리방침',
        '',
        '> 이 문서는 초안입니다. 아직 공개하지 마세요.',
        '> 변호사 검토 필요.',
        '',
        '---',
        '',
        '## 0. 출시 전 반드시 채워야 하는 항목',
        '',
        '- [ ] 상호',
        '',
        '## 1. 수집하는 항목',
        '',
        '이메일과 닉네임을 받습니다.',
        '',
      ].join('\n')
    )

    expect(doc.ready).toBe(true)
    expect(doc.body).not.toContain('아직 공개하지 마세요')
    expect(doc.body).not.toContain('출시 전 반드시 채워야')
    expect(doc.body).toContain('## 1. 수집하는 항목')
  })

  it('지금 저장된 약관·처리방침은 아직 공개할 수 없는 상태다', () => {
    // 상호·문의처·국외이전 리전 등이 정해지면 이 테스트는 실패한다.
    // 그때 기대값을 뒤집고 실제 문서가 화면에 뜨는지 확인한다.
    for (const file of ['terms.md', 'privacy-policy.md']) {
      const source = readFileSync(`docs/legal/${file}`, 'utf8')
      expect(prepareLegalDocument(source).ready, `${file} 가 공개 가능해짐`).toBe(false)
    }
  })
})
