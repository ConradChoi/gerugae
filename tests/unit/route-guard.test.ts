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

  it('비로그인 사용자가 아직 정의되지 않은 임의의 경로에 접근하면 /login으로 보낸다', () => {
    expect(decideRedirect('/companies', false)).toBe('/login')
  })

  it('비로그인 사용자가 /signup에 접근하면 리다이렉트하지 않는다', () => {
    expect(decideRedirect('/signup', false)).toBeNull()
  })

  it('로그인 사용자가 임의의 경로에 접근하면 리다이렉트하지 않는다', () => {
    expect(decideRedirect('/companies', true)).toBeNull()
  })

  it.each(['/terms', '/privacy'])('약관 문서 %s 는 가입 전에도 읽을 수 있다', (path) => {
    expect(decideRedirect(path, false)).toBeNull()
  })

  it.each(['/terms', '/privacy'])('약관 문서 %s 는 로그인 후에도 그대로 보여 준다', (path) => {
    expect(decideRedirect(path, true)).toBeNull()
  })

  it('비로그인 사용자가 공개 경로와 접두어만 겹치는 경로에 접근하면 /login으로 보낸다', () => {
    expect(decideRedirect('/homework', false)).toBe('/login')
  })
})
