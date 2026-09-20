import { describe, it, expect } from 'vitest'
import { decideRedirect } from '@/lib/route-guard'

describe('decideRedirect', () => {
  it('비로그인 사용자가 보호된 경로에 접근하면 /login으로 보낸다', () => {
    expect(decideRedirect('/home', false)).toBe('/login')
  })

  it('비로그인 사용자가 랜딩 페이지에 접근하면 리다이렉트하지 않는다', () => {
    expect(decideRedirect('/', false)).toBeNull()
  })

  it('로그인 사용자가 /login에 접근하면 /home으로 보낸다', () => {
    expect(decideRedirect('/login', true)).toBe('/home')
  })

  it('로그인 사용자가 /signup에 접근하면 /home으로 보낸다', () => {
    expect(decideRedirect('/signup', true)).toBe('/home')
  })

  it('로그인 사용자가 보호된 경로에 접근하면 리다이렉트하지 않는다', () => {
    expect(decideRedirect('/home', true)).toBeNull()
  })
})
