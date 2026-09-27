export const QUESTION_CATEGORIES = [
  '계약·대금',
  '저작권·권리',
  '세무·4대보험',
  '분쟁·법률',
  '기타',
] as const

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]

export type QuestionInput = {
  category: string
  title: string
  content: string
}

export type QuestionValidation =
  | { ok: true; value: { category: QuestionCategory; title: string; content: string } }
  | { ok: false; message: string }

export function validateQuestionInput(input: QuestionInput): QuestionValidation {
  if (!QUESTION_CATEGORIES.includes(input.category as QuestionCategory)) {
    return { ok: false, message: '분류를 선택해 주세요.' }
  }

  const title = input.title.trim()
  if (title.length < 2) {
    return { ok: false, message: '제목을 2자 이상 적어 주세요.' }
  }
  if (title.length > 100) {
    return { ok: false, message: '제목은 100자 이하로 적어 주세요.' }
  }

  const content = input.content.trim()
  if (content.length < 10) {
    return { ok: false, message: '내용을 10자 이상 적어 주세요.' }
  }
  if (content.length > 4000) {
    return { ok: false, message: '내용은 4000자 이하로 적어 주세요.' }
  }

  return { ok: true, value: { category: input.category as QuestionCategory, title, content } }
}

export type AnswerValidation = { ok: true; value: string } | { ok: false; message: string }

export function validateAnswerInput(raw: string): AnswerValidation {
  const content = raw.trim()
  if (content.length < 5) {
    return { ok: false, message: '답변을 5자 이상 적어 주세요.' }
  }
  if (content.length > 2000) {
    return { ok: false, message: '답변은 2000자 이하로 적어 주세요.' }
  }
  return { ok: true, value: content }
}

/** 익명 글은 author_id 자체가 내려오지 않는다. 표시할 이름을 정한다. */
export function displayAuthor(row: {
  is_anonymous: boolean
  author_nickname: string | null
}): string {
  if (row.is_anonymous) return '익명'
  return row.author_nickname ?? '탈퇴한 회원'
}
