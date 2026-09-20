import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadEnvLocal(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync('.env.local', 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('#'))
        .map((line) => {
          const idx = line.indexOf('=')
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
        })
    )
  } catch {
    return {}
  }
}

const env = loadEnvLocal()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const hasCredentials = Boolean(SUPABASE_URL && ANON_KEY)

function randomEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

describe.skipIf(!hasCredentials)('profiles 테이블 트리거/RLS', () => {
  it('회원가입 시 닉네임이 담긴 profiles 행이 자동 생성된다', async () => {
    const supabase = createClient(SUPABASE_URL, ANON_KEY)
    const email = randomEmail()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: 'password123!',
      options: { data: { nickname: '테스트유저' } },
    })
    expect(signUpError).toBeNull()
    expect(signUpData.session).not.toBeNull()
    const userId = signUpData.user!.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('id', userId)
      .single()

    expect(profileError).toBeNull()
    expect(profile?.nickname).toBe('테스트유저')
  })

  it('다른 사용자의 닉네임은 수정할 수 없다', async () => {
    const supabaseA = createClient(SUPABASE_URL, ANON_KEY)
    const supabaseB = createClient(SUPABASE_URL, ANON_KEY)

    const { data: signUpA } = await supabaseA.auth.signUp({
      email: randomEmail(),
      password: 'password123!',
      options: { data: { nickname: 'A유저' } },
    })
    const { data: signUpB } = await supabaseB.auth.signUp({
      email: randomEmail(),
      password: 'password123!',
      options: { data: { nickname: 'B유저' } },
    })

    const { error } = await supabaseB
      .from('profiles')
      .update({ nickname: '해킹시도' })
      .eq('id', signUpA.user!.id)

    const { data: unchangedProfile } = await supabaseA
      .from('profiles')
      .select('nickname')
      .eq('id', signUpA.user!.id)
      .single()

    expect(unchangedProfile?.nickname).toBe('A유저')
    void signUpB
    void error
  })

  it('인증되지 않은 클라이언트는 profiles를 조회할 수 없다', async () => {
    const anonSupabase = createClient(SUPABASE_URL, ANON_KEY)

    const { data, error } = await anonSupabase.from('profiles').select('id, nickname')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
