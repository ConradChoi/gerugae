/** 운영자가 아직 채우지 않은 자리. 하나라도 남아 있으면 공개하지 않는다. */
const PLACEHOLDER = /\{\{[^}]+\}\}|\[운영자 확인 필요\]/

/** 문서 앞머리의 내부 메모(인용문)와 운영자 체크리스트는 화면에서 뺀다. */
function stripInternalNotes(source: string): string {
  return source
    .replace(/^>[^\n]*\n(?:>[^\n]*\n)*\n?/gm, '')
    .replace(/^##[ \t]*0\.[\s\S]*?(?=^##[ \t])/m, '')
    .replace(/^---[ \t]*\n/gm, '')
    .trimStart()
}

export type LegalDocumentState =
  | { ready: true; body: string }
  | { ready: false; body: null }

/**
 * 약관·처리방침 원문을 화면에 올릴 수 있는 형태로 바꾼다.
 *
 * 채우지 못한 항목이 남은 문서를 그대로 띄우면 미완성 법률 문서를 공개하는 셈이
 * 된다. 아무것도 없는 것보다 나쁘므로, 그때는 본문을 내보내지 않는다.
 */
export function prepareLegalDocument(source: string): LegalDocumentState {
  const body = stripInternalNotes(source)

  if (PLACEHOLDER.test(body)) {
    return { ready: false, body: null }
  }

  return { ready: true, body }
}
