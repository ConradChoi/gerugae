import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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

export const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const ANON_KEY =
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const hasCredentials = Boolean(SUPABASE_URL && ANON_KEY)

// jsdom 환경에서는 localStorage가 프로젝트별로 하나뿐이라 클라이언트끼리
// 세션이 섞인다. persistSession: false로 각 클라이언트가 자기 세션만 갖게 한다.
const ISOLATED_AUTH = { auth: { persistSession: false, autoRefreshToken: false } } as const

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, ISOLATED_AUTH)
}

export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

export function randomName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Supabase는 가입 요청 수를 제한하므로(초과 시 "Request rate limit reached"),
 * 테스트마다 새 계정을 만들지 않고 파일 단위로 몇 개만 만들어 돌려 쓴다.
 */
const userPool = new Map<string, Promise<{ client: SupabaseClient; userId: string }>>()

export function sharedUser(key: string, nickname = key) {
  if (!userPool.has(key)) {
    userPool.set(key, signUpUser(nickname))
  }
  return userPool.get(key)!
}

/** 새 계정을 만들고 로그인된 클라이언트와 user id를 돌려준다 */
export async function signUpUser(nickname: string) {
  const client = anonClient()
  const { data, error } = await client.auth.signUp({
    email: randomEmail(),
    password: 'password123!',
    options: { data: { nickname } },
  })
  if (error) throw new Error(`signUp 실패: ${error.message}`)
  if (!data.session) throw new Error('세션이 발급되지 않았습니다 (Confirm email이 켜져 있는지 확인)')
  return { client, userId: data.user!.id }
}
