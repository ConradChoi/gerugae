export type WithdrawInput = {
  password: string
  confirmed: boolean
}

export type WithdrawValidation = { ok: true } | { ok: false; message: string }

/**
 * 탈퇴 요청이 갖춰야 할 조건.
 *
 * 되돌릴 수 없는 처리이므로 두 가지를 같이 요구한다.
 * - 비밀번호: 자리를 비운 사이 남이 계정을 지우는 걸 막는다. 이메일 인증을
 *   쓰지 않기로 해서 비밀번호가 유일한 본인확인 수단이다.
 * - 확인 체크: 무슨 일이 생기는지 읽었다는 표시.
 */
export function validateWithdrawInput(input: WithdrawInput): WithdrawValidation {
  if (!input.confirmed) {
    return { ok: false, message: '안내를 읽고 동의해 주세요.' }
  }
  if (input.password.length === 0) {
    return { ok: false, message: '비밀번호를 입력해 주세요.' }
  }
  return { ok: true }
}
