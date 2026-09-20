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

// vitest.config.ts runs this suite under environment: 'jsdom', which provides a
// real `window.localStorage`. @supabase/supabase-js persists auth sessions there
// under a storage key derived only from the project ref, so every createClient(...)
// call in this file would otherwise share ONE localStorage session: whichever
// signUp() ran last leaks into every other client created afterwards, including
// the one meant to be anonymous. Do not remove this option to "simplify" the
// calls below - persistSession: false keeps each client's session in memory only
// (still enough for that client's own subsequent requests), so sessions no longer
// cross-contaminate between clients.
const ISOLATED_AUTH = { auth: { persistSession: false, autoRefreshToken: false } } as const

describe.skipIf(!hasCredentials)('profiles 테이블 트리거/RLS', () => {
  it('회원가입 시 닉네임이 담긴 profiles 행이 자동 생성된다', async () => {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, ISOLATED_AUTH)
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
    const supabaseA = createClient(SUPABASE_URL, ANON_KEY, ISOLATED_AUTH)
    const supabaseB = createClient(SUPABASE_URL, ANON_KEY, ISOLATED_AUTH)

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
    const anonSupabase = createClient(SUPABASE_URL, ANON_KEY, ISOLATED_AUTH)

    // Guard the premise of this test: if a session ever leaked in again (e.g. this
    // isolation option gets removed later), fail here with a clear message instead
    // of silently passing/failing the RLS assertion below for the wrong reason.
    const {
      data: { session },
    } = await anonSupabase.auth.getSession()
    expect(session).toBeNull()

    const { data, error } = await anonSupabase.from('profiles').select('id, nickname')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
