// 약관과 처리방침은 가입 전에 읽을 수 있어야 한다.
// 문의 창구는 회원이 아닌 사람(삭제를 요청하는 기업, 글에 개인정보가 담긴
// 제3자)도 써야 하므로 로그인 없이 열어 둔다.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/contact',
  '/contact/status',
]
const AUTH_ONLY_PATHS = ['/login', '/signup']

export function decideRedirect(path: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && !PUBLIC_PATHS.includes(path)) {
    return '/login'
  }
  if (isAuthenticated && AUTH_ONLY_PATHS.includes(path)) {
    return '/home'
  }
  return null
}
