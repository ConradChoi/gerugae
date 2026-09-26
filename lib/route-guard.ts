// 약관과 처리방침은 가입 전에 읽을 수 있어야 한다.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/terms', '/privacy']
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
