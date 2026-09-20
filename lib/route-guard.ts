const PUBLIC_PATHS = ['/', '/login', '/signup']
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
