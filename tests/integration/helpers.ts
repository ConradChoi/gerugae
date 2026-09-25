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
// autoRefreshToken은 켜둔다 — 계정을 파일 단위로 재사용하므로 테스트가 길어지면
// 토큰이 만료되어 PGRST303(JWT expired)으로 간헐 실패한다.
const ISOLATED_AUTH = { auth: { persistSession: false, autoRefreshToken: true } } as const

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
    userPool.set(key, signUpMember(nickname))
  }
  return userPool.get(key)!
}

/** 초대 코드를 쓰지 않은 계정. 회원 자격이 없는 상태 그대로 돌려 쓴다. */
export function sharedNonMember(key: string, nickname = key) {
  const poolKey = `non-member:${key}`
  if (!userPool.has(poolKey)) {
    userPool.set(poolKey, signUpUser(nickname))
  }
  return userPool.get(poolKey)!
}

// 콘텐츠는 초대 코드를 쓴 회원만 볼 수 있다. 테스트 계정도 회원이어야 하는데,
// 회원 자격은 기존 회원의 코드로만 얻을 수 있어 스스로 시작할 수 없다.
// 그래서 고정된 시드 계정 하나에 한 번만 자격을 부여해 두고(아래 SQL),
// 이후 테스트 계정들은 그 계정의 코드를 받아 회원이 된다.
export const SEED_EMAIL = 'seed-member@example.com'
const SEED_PASSWORD = 'gerugae-test-seed-1234'

let seedPromise: Promise<SupabaseClient> | null = null

async function getSeedMember(): Promise<SupabaseClient> {
  const client = anonClient()

  async function signIn() {
    const { error } = await client.auth.signInWithPassword({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
    })
    return error
  }

  if (await signIn()) {
    // 테스트 파일은 병렬로 돌기 때문에 여러 워커가 같은 시드 계정을 동시에
    // 만들려 한다. 그때 나는 "Database error saving new user"는 이미 다른
    // 워커가 만들었다는 뜻이므로, 가입 실패는 곧바로 오류로 보지 않고
    // 로그인을 한 번 더 시도해 확인한다.
    await client.auth.signUp({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      options: { data: { nickname: '테스트시드' } },
    })

    const stillFailing = await signIn()
    if (stillFailing) {
      throw new Error(`시드 계정 준비 실패: ${stillFailing.message}`)
    }
  }

  // 갓 발급된 토큰은 Supabase 내부 시계 오차로 "JWT issued at future"를 내는 일이
  // 있다. 1초면 해소되므로 몇 번 다시 물어본다.
  let isMember: boolean | null = null
  let lastError: { message: string } | null = null
  for (let attempt = 0; attempt < 3 && !isMember; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000))
    const { data, error } = await client.rpc('is_member')
    isMember = data
    lastError = error
    if (!error) break
  }

  if (!isMember) {
    throw new Error(
      `시드 계정(${SEED_EMAIL})에 회원 자격이 없습니다. ` +
        'supabase/maintenance/grant_test_seed_member.sql 을 한 번 실행해 주세요.' +
        (lastError ? ` (is_member 호출 오류: ${lastError.message})` : '')
    )
  }

  return client
}

/**
 * 초대 코드를 받은 상태의 계정을 만든다.
 *
 * 코드 하나는 3명까지만 쓸 수 있고, 테스트 파일들이 병렬로 돌면서 같은 코드를
 * 나눠 갖는다. 그래서 이미 다 찬 코드를 받는 경우가 생기는데, 그때는 시드가
 * 코드를 새로 발급받아(issue_invite_code는 소진된 코드를 건너뛴다) 다시 시도한다.
 */
export async function signUpMember(nickname: string) {
  if (!seedPromise) seedPromise = getSeedMember()
  const seed = await seedPromise

  const user = await signUpUser(nickname)

  let lastResult: string | undefined
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: issued, error } = await seed.rpc('issue_invite_code')
    if (error) throw new Error(`초대 코드 발급 실패: ${error.message}`)

    const code = issued?.[0]?.code as string
    const { data: result } = await user.client.rpc('redeem_invite_code', { input_code: code })
    if (result === 'ok') return user

    lastResult = result as string
    if (lastResult !== '사용 가능 인원을 모두 채운 코드입니다') break
  }

  throw new Error(`초대 코드 사용 실패: ${lastResult}`)
}

/** 새 계정을 만들고 로그인된 클라이언트와 user id를 돌려준다 (초대 코드 미사용) */
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
