const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SignupInput = { email: string; password: string; nickname: string }
export type LoginInput = { email: string; password: string }
type FieldErrors<K extends string> = Partial<Record<K, string>>

export function validateSignupInput(
  input: SignupInput
): { valid: boolean; errors: FieldErrors<'email' | 'password' | 'nickname'> } {
  const errors: FieldErrors<'email' | 'password' | 'nickname'> = {}

  if (!EMAIL_REGEX.test(input.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (input.password.length < 8 || input.password.trim().length === 0) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  const trimmedNickname = input.nickname.trim()
  if (trimmedNickname.length === 0) {
    errors.nickname = '닉네임을 입력해 주세요.'
  } else if (trimmedNickname.length > 20) {
    errors.nickname = '닉네임은 20자 이하로 입력해 주세요.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateLoginInput(
  input: LoginInput
): { valid: boolean; errors: FieldErrors<'email' | 'password'> } {
  const errors: FieldErrors<'email' | 'password'> = {}

  if (!EMAIL_REGEX.test(input.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (input.password.length === 0) {
    errors.password = '비밀번호를 입력해 주세요.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export const COMPANY_CATEGORIES = ['원천사', '웹에이전시', '인력회사', '기타'] as const
export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number]

export type CompanyInput = { name: string; bizRegNumber: string; category: string }

/** 하이픈을 지운 사업자등록번호. 빈 값이면 null(선택 입력) */
export function normalizeBizRegNumber(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '')
  return digits.length === 0 ? null : digits
}

export function validateCompanyInput(
  input: CompanyInput
): { valid: boolean; errors: FieldErrors<'name' | 'bizRegNumber' | 'category'> } {
  const errors: FieldErrors<'name' | 'bizRegNumber' | 'category'> = {}

  const name = input.name.trim()
  if (name.length === 0) {
    errors.name = '기업 이름을 입력해 주세요.'
  } else if (name.length > 100) {
    errors.name = '기업 이름은 100자 이하로 입력해 주세요.'
  }

  const digits = normalizeBizRegNumber(input.bizRegNumber)
  if (digits !== null && digits.length !== 10) {
    errors.bizRegNumber = '사업자등록번호는 숫자 10자리입니다.'
  }

  if (!COMPANY_CATEGORIES.includes(input.category as CompanyCategory)) {
    errors.category = '분류를 선택해 주세요.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
