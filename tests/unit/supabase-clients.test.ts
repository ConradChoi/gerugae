import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

describe('lib/supabase/client', () => {
  it('auth 인터페이스를 가진 브라우저 클라이언트를 생성한다', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.auth.signUp).toBe('function')
  })
})

describe('lib/supabase/env', () => {
  it('환경변수가 모두 있으면 값을 반환한다', async () => {
    const { getSupabaseEnv } = await import('@/lib/supabase/env')
    expect(getSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    })
  })

  it('NEXT_PUBLIC_SUPABASE_URL이 없으면 변수명을 명시한 에러를 던진다', async () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const { getSupabaseEnv } = await import('@/lib/supabase/env')
    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL')

    process.env.NEXT_PUBLIC_SUPABASE_URL = original
  })

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY가 없으면 변수명을 명시한 에러를 던진다', async () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { getSupabaseEnv } = await import('@/lib/supabase/env')
    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = original
  })
})
