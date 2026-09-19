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
