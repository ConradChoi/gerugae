export const INQUIRY_CATEGORIES = ['일반 문의', '게시물 삭제 요청', '기업 정보 오류'] as const

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number]

export type InquiryInput = {
  category: string
  content: string
  contact: string
  targetUrl: string
  /** 사람 눈에 보이지 않는 칸. 값이 차 있으면 자동 입력으로 본다. */
  honeypot: string
}

export type InquiryValidation =
  | { ok: true; value: { category: InquiryCategory; content: string; contact: string | null; targetUrl: string | null } }
  | { ok: false; message: string }

export function validateInquiryInput(input: InquiryInput): InquiryValidation {
  // 로그인 없이 쓰는 창구라 자동 입력이 들어온다. 사람에게는 보이지 않는 칸이
  // 채워져 있으면 그대로 막는다. 캡챠를 두지 않기로 한 대신이다.
  if (input.honeypot.trim().length > 0) {
    return { ok: false, message: '전송하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  if (!INQUIRY_CATEGORIES.includes(input.category as InquiryCategory)) {
    return { ok: false, message: '문의 유형을 선택해 주세요.' }
  }

  const content = input.content.trim()
  if (content.length < 10) {
    return { ok: false, message: '내용을 10자 이상 적어 주세요.' }
  }
  if (content.length > 2000) {
    return { ok: false, message: '내용은 2000자 이하로 적어 주세요.' }
  }

  const contact = input.contact.trim()
  if (contact.length > 200) {
    return { ok: false, message: '연락처는 200자 이하로 적어 주세요.' }
  }

  const targetUrl = input.targetUrl.trim()
  if (targetUrl.length > 500) {
    return { ok: false, message: '글 주소는 500자 이하로 적어 주세요.' }
  }

  return {
    ok: true,
    value: {
      category: input.category as InquiryCategory,
      content,
      contact: contact || null,
      targetUrl: targetUrl || null,
    },
  }
}

/** 조회 코드는 대소문자와 앞뒤 공백을 가리지 않는다 */
export function normalizeInquiryToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function isValidInquiryToken(raw: string): boolean {
  // 코드를 만들 때 쓰는 글자와 똑같이 맞춘다(0/O, 1/I 제외).
  // 더 넓게 받으면 O를 0으로 잘못 옮겨 적어도 그냥 통과해, 조회에 실패한
  // 뒤에야 알게 된다.
  return /^[A-HJ-NP-Z2-9]{12}$/.test(normalizeInquiryToken(raw))
}
