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
