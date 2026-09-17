# 거르개 — Foundation & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js + Supabase 기반으로 이메일/비밀번호 회원가입·로그인·로그아웃과, 비로그인 사용자를 차단하는 라우트 가드, 면책문구가 있는 랜딩 페이지까지 갖춘 인증 기반을 구축한다.

**Architecture:** Next.js(App Router, TypeScript) 프론트엔드가 Supabase Auth(이메일/비밀번호)와 Postgres(RLS로 접근 제어)에 `@supabase/ssr` 클라이언트로 직접 접속한다. 별도 API 서버는 두지 않는다. 회원가입 시 Postgres 트리거가 `auth.users`에서 `profiles` 행을 자동 생성한다.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Auth + Postgres, Supabase CLI 로컬 개발) · `@supabase/ssr` · Vitest + Testing Library(jsdom)

**Spec:** [docs/superpowers/specs/2026-09-17-gerugae-design.md](../specs/2026-09-17-gerugae-design.md)

## Global Constraints

- 별도 API 서버 없이 Supabase 클라이언트에서 직접 CRUD, 접근 제어는 RLS로 수행한다 (스펙 3장)
- 비로그인 사용자는 서비스 소개/가입 유도 랜딩 외의 페이지를 열람할 수 없다 (스펙 3장, 5장)
- 이메일·비밀번호 외의 개인정보(실명, 연락처)는 수집하지 않는다 (스펙 2장, 4장)
- 가입 시 닉네임은 필수이며, 이후 게시물에는 닉네임만 노출한다 (스펙 4장)
- 스키마는 표준 Postgres로 설계하고 Supabase 전용 기능(Realtime, Storage 등) 사용을 최소화한다 (스펙 3장)
- 랜딩 페이지에는 "게시물은 작성자 개인 의견이며, 본 서비스는 법적 책임을 지지 않는다"는 취지의 면책 문구를 노출한다 (스펙 6장, 7장)

---

## File Structure

```
gerugae/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 랜딩(비로그인 소개+면책문구), 로그인 시 /home 리다이렉트
│   ├── globals.css             # 최소 스타일
│   ├── home/
│   │   └── page.tsx            # 로그인 후 홈(닉네임 환영 문구) — 보호된 라우트
│   ├── signup/
│   │   └── page.tsx            # 회원가입 폼
│   └── login/
│       └── page.tsx            # 로그인 폼
├── components/
│   ├── SignupForm.tsx
│   ├── LoginForm.tsx
│   └── LogoutButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # 브라우저용 Supabase 클라이언트
│   │   └── server.ts           # 서버 컴포넌트용 Supabase 클라이언트
│   ├── validation.ts           # 순수 함수: 회원가입/로그인 입력 검증
│   └── route-guard.ts          # 순수 함수: 경로별 리다이렉트 판정
├── middleware.ts                # route-guard.ts를 사용해 세션 갱신 + 리다이렉트
├── supabase/
│   └── migrations/
│       └── 0001_init.sql       # profiles 테이블 + 트리거 + RLS
├── tests/
│   ├── unit/
│   │   ├── validation.test.ts
│   │   └── route-guard.test.ts
│   ├── integration/
│   │   └── profiles.test.ts    # 로컬 Supabase against RLS/트리거 검증
│   └── components/
│       ├── SignupForm.test.tsx
│       └── LoginForm.test.tsx
├── vitest.config.ts
├── .env.local.example
└── package.json
```

---

### Task 1: 프로젝트 스캐폴딩 (Next.js + TypeScript + Vitest)

**Files:**
- Create: 전체 Next.js 프로젝트 골격 (`create-next-app`이 생성)
- Create: `vitest.config.ts`
- Create: `tests/unit/smoke.test.ts`

**Interfaces:**
- Consumes: 없음 (최초 태스크)
- Produces: `npm run dev`, `npm test` 커맨드가 동작하는 프로젝트 골격. 이후 모든 태스크는 이 골격 위에서 파일을 추가한다.

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@14 gerugae-app --typescript --eslint --app --no-tailwind --src-dir=false --import-alias "@/*"
```

프롬프트가 뜨면 기본값(App Router 사용, `@/*` alias)으로 진행한다. 생성된 `gerugae-app/` 디렉토리 내용을 프로젝트 루트(`/Users/ylia/Documents/service/gerugae`)로 옮기고 `gerugae-app` 디렉토리는 제거한다.

```bash
mv gerugae-app/* gerugae-app/.[!.]* . 2>/dev/null
rmdir gerugae-app
```

- [ ] **Step 2: Vitest 및 테스트 도구 설치**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

`vitest.config.ts` 생성:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

`tests/setup.ts` 생성:

```ts
import '@testing-library/jest-dom/vitest'
```

`package.json`의 `scripts`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: 스모크 테스트 작성**

`tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('project scaffolding', () => {
  it('테스트 러너가 정상 동작한다', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: 테스트 및 개발 서버 확인**

```bash
npm test
```
Expected: `tests/unit/smoke.test.ts` PASS

```bash
npm run dev
```
Expected: `http://localhost:3000`에서 Next.js 기본 페이지가 뜬다. 확인 후 서버 종료(Ctrl+C).

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "chore: Next.js + Vitest 프로젝트 스캐폴딩"
```

---

### Task 2: Supabase 프로젝트 연결 및 클라이언트 헬퍼

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local.example`
- Test: `tests/unit/supabase-clients.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `createClient()` (from `lib/supabase/client.ts`) — 브라우저 컴포넌트에서 사용할 `SupabaseClient` 반환
  - `createClient()` (from `lib/supabase/server.ts`, **async** 함수) — 서버 컴포넌트/서버 액션에서 사용할 `SupabaseClient`를 `Promise`로 반환

- [ ] **Step 1: 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 실패하는 테스트 작성**

`tests/unit/supabase-clients.test.ts`:

```ts
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
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/unit/supabase-clients.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/supabase/client'`

- [ ] **Step 4: 브라우저 클라이언트 구현**

`lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: 서버 클라이언트 구현**

`lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출되면 무시한다 — 세션 갱신은 middleware.ts가 담당한다
          }
        },
      },
    }
  )
}
```

- [ ] **Step 6: 환경변수 예시 파일 작성**

`.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.gitignore`에 `.env.local`이 이미 포함되어 있는지 확인한다 (Task 1에서 `create-next-app`이 기본 포함시킴).

- [ ] **Step 7: 테스트 통과 확인**

```bash
npm test -- tests/unit/supabase-clients.test.ts
```
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add lib/supabase tests/unit/supabase-clients.test.ts .env.local.example package.json package-lock.json
git commit -m "feat: Supabase 브라우저/서버 클라이언트 헬퍼 추가"
```

---

### Task 3: Supabase 로컬 개발 환경 + profiles 스키마/트리거/RLS

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/0001_init.sql` (Supabase CLI가 생성)
- Test: `tests/integration/profiles.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `public.profiles(id uuid, nickname text, created_at timestamptz)` 테이블. 이후 모든 태스크(리뷰, 정보글 등)는 `author_id`/`created_by`로 이 테이블을 참조한다.

- [ ] **Step 1: Supabase CLI 설치 및 로컬 프로젝트 초기화**

Docker Desktop이 실행 중이어야 한다.

```bash
npm install -D supabase
npx supabase init
npx supabase start
```

`npx supabase start` 출력에서 `API URL`, `anon key`, `service_role key`를 기록해 둔다 (다음 스텝에서 사용).

- [ ] **Step 2: 로컬 환경변수 파일 작성**

`.env.local` (git에 커밋되지 않음, `.env.local.example`을 참고해 실제 값 입력):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start 출력의 anon key>
```

- [ ] **Step 3: 마이그레이션 파일 생성 및 실패하는 통합 테스트 작성**

```bash
npx supabase migration new init
```

방금 생성된 `supabase/migrations/<timestamp>_init.sql` 파일명을 `0001_init.sql`로 변경한다.

`tests/integration/profiles.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = process.env.SUPABASE_LOCAL_ANON_KEY!

function randomEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

describe('profiles 테이블 트리거/RLS', () => {
  it('회원가입 시 닉네임이 담긴 profiles 행이 자동 생성된다', async () => {
    const supabase = createClient(SUPABASE_URL, ANON_KEY)
    const email = randomEmail()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: 'password123!',
      options: { data: { nickname: '테스트유저' } },
    })
    expect(signUpError).toBeNull()
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
})
```

`SUPABASE_LOCAL_ANON_KEY` 환경변수는 실행 시 셸에서 주입한다 (다음 스텝 참고).

- [ ] **Step 4: 테스트 실행하여 실패 확인**

```bash
SUPABASE_LOCAL_ANON_KEY=<anon key> npm test -- tests/integration/profiles.test.ts
```
Expected: FAIL — `relation "public.profiles" does not exist`

- [ ] **Step 5: 마이그레이션 SQL 작성**

`supabase/migrations/0001_init.sql`:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 6: 마이그레이션 적용**

```bash
npx supabase db reset
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
SUPABASE_LOCAL_ANON_KEY=<anon key> npm test -- tests/integration/profiles.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 8: 커밋**

```bash
git add supabase tests/integration/profiles.test.ts
git commit -m "feat: profiles 테이블, 가입 트리거, RLS 정책 추가"
```

---

### Task 4: 회원가입/로그인 입력 검증 함수

**Files:**
- Create: `lib/validation.ts`
- Test: `tests/unit/validation.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `validateSignupInput(input: { email: string; password: string; nickname: string }): { valid: boolean; errors: Partial<Record<'email' | 'password' | 'nickname', string>> }`
  - `validateLoginInput(input: { email: string; password: string }): { valid: boolean; errors: Partial<Record<'email' | 'password', string>> }`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateSignupInput, validateLoginInput } from '@/lib/validation'

describe('validateSignupInput', () => {
  it('올바른 입력은 valid:true를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('이메일 형식이 아니면 email 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'not-an-email',
      password: 'password123',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBeDefined()
  })

  it('비밀번호가 8자 미만이면 password 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: '1234',
      nickname: '거르개유저',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })

  it('닉네임이 비어있으면 nickname 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '  ',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.nickname).toBeDefined()
  })

  it('닉네임이 20자를 초과하면 nickname 에러를 반환한다', () => {
    const result = validateSignupInput({
      email: 'user@example.com',
      password: 'password123',
      nickname: '가'.repeat(21),
    })
    expect(result.valid).toBe(false)
    expect(result.errors.nickname).toBeDefined()
  })
})

describe('validateLoginInput', () => {
  it('올바른 입력은 valid:true를 반환한다', () => {
    const result = validateLoginInput({ email: 'user@example.com', password: 'password123' })
    expect(result.valid).toBe(true)
  })

  it('비밀번호가 비어있으면 password 에러를 반환한다', () => {
    const result = validateLoginInput({ email: 'user@example.com', password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/unit/validation.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/validation'`

- [ ] **Step 3: 구현**

`lib/validation.ts`:

```ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SignupInput = { email: string; password: string; nickname: string }
export type LoginInput = { email: string; password: string }
type FieldErrors<K extends string> = Partial<Record<K, string>>

export function validateSignupInput(
  input: SignupInput
): { valid: boolean; errors: FieldErrors<'email' | 'password' | 'nickname'> } {
  const errors: FieldErrors<'email' | 'password' | 'nickname'> = {}

  if (!EMAIL_REGEX.test(input.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (input.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }
  const trimmedNickname = input.nickname.trim()
  if (trimmedNickname.length === 0) {
    errors.nickname = '닉네임을 입력해 주세요.'
  } else if (trimmedNickname.length > 20) {
    errors.nickname = '닉네임은 20자 이하로 입력해 주세요.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateLoginInput(
  input: LoginInput
): { valid: boolean; errors: FieldErrors<'email' | 'password'> } {
  const errors: FieldErrors<'email' | 'password'> = {}

  if (!EMAIL_REGEX.test(input.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }
  if (input.password.length === 0) {
    errors.password = '비밀번호를 입력해 주세요.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- tests/unit/validation.test.ts
```
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/validation.ts tests/unit/validation.test.ts
git commit -m "feat: 회원가입/로그인 입력 검증 함수 추가"
```

---

### Task 5: 회원가입 페이지/폼

**Files:**
- Create: `components/SignupForm.tsx`
- Create: `app/signup/page.tsx`
- Test: `tests/components/SignupForm.test.tsx`

**Interfaces:**
- Consumes:
  - `validateSignupInput` (from `lib/validation.ts`, Task 4)
  - `createClient` (from `lib/supabase/client.ts`, Task 2)
- Produces: `<SignupForm />` — 제출 성공 시 `window.location.href = '/home'`로 이동하는 클라이언트 컴포넌트

- [ ] **Step 1: 실패하는 컴포넌트 테스트 작성**

`tests/components/SignupForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signUpMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: signUpMock },
  }),
}))

import { SignupForm } from '@/components/SignupForm'

beforeEach(() => {
  signUpMock.mockReset()
  signUpMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('SignupForm', () => {
  it('닉네임을 입력하지 않으면 에러 메시지를 보여주고 signUp을 호출하지 않는다', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    expect(await screen.findByText('닉네임을 입력해 주세요.')).toBeInTheDocument()
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('올바른 입력이면 닉네임을 메타데이터로 담아 signUp을 호출한다', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('닉네임'), '거르개유저')
    await user.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        options: { data: { nickname: '거르개유저' } },
      })
    })
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/components/SignupForm.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/SignupForm'`

- [ ] **Step 3: 구현**

`components/SignupForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateSignupInput } from '@/lib/validation'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const result = validateSignupInput({ email, password, nickname })
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname.trim() } },
    })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }
    window.location.href = '/home'
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="signup-email">이메일</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p role="alert">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="signup-password">비밀번호</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p role="alert">{errors.password}</p>}
      </div>
      <div>
        <label htmlFor="signup-nickname">닉네임</label>
        <input
          id="signup-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        {errors.nickname && <p role="alert">{errors.nickname}</p>}
      </div>
      {submitError && <p role="alert">{submitError}</p>}
      <button type="submit" disabled={submitting}>
        가입하기
      </button>
    </form>
  )
}
```

라벨-인풋 연결을 위해 `id`/`htmlFor`을 사용했고, `getByLabelText`가 정상 동작하려면 각 `<label>`이 대응하는 `id`를 가진 input을 가리켜야 한다. 위 코드는 이를 만족한다.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- tests/components/SignupForm.test.tsx
```
Expected: PASS (2 tests)

- [ ] **Step 5: 페이지 라우트 작성**

`app/signup/page.tsx`:

```tsx
import { SignupForm } from '@/components/SignupForm'

export default function SignupPage() {
  return (
    <main>
      <h1>회원가입</h1>
      <SignupForm />
    </main>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add components/SignupForm.tsx app/signup/page.tsx tests/components/SignupForm.test.tsx
git commit -m "feat: 회원가입 페이지/폼 추가"
```

---

### Task 6: 로그인 페이지/폼 + 로그아웃

**Files:**
- Create: `components/LoginForm.tsx`
- Create: `components/LogoutButton.tsx`
- Create: `app/login/page.tsx`
- Test: `tests/components/LoginForm.test.tsx`

**Interfaces:**
- Consumes:
  - `validateLoginInput` (from `lib/validation.ts`, Task 4)
  - `createClient` (from `lib/supabase/client.ts`, Task 2)
- Produces: `<LoginForm />`, `<LogoutButton />` — 각각 로그인 성공 시 `/home`으로, 로그아웃 성공 시 `/`로 이동

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/components/LoginForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signInMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInMock },
  }),
}))

import { LoginForm } from '@/components/LoginForm'

beforeEach(() => {
  signInMock.mockReset()
  signInMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('LoginForm', () => {
  it('비밀번호가 비어있으면 에러를 보여주고 signInWithPassword를 호출하지 않는다', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('비밀번호를 입력해 주세요.')).toBeInTheDocument()
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('올바른 입력이면 signInWithPassword를 호출한다', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
    })
  })

  it('인증 실패 시 서버 에러 메시지를 보여준다', async () => {
    signInMock.mockResolvedValue({ data: { user: null }, error: { message: '잘못된 로그인 정보입니다.' } })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('이메일'), 'user@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('잘못된 로그인 정보입니다.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/components/LoginForm.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/LoginForm'`

- [ ] **Step 3: LoginForm 구현**

`components/LoginForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateLoginInput } from '@/lib/validation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const result = validateLoginInput({ email, password })
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }
    window.location.href = '/home'
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="login-email">이메일</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p role="alert">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="login-password">비밀번호</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p role="alert">{errors.password}</p>}
      </div>
      {submitError && <p role="alert">{submitError}</p>}
      <button type="submit" disabled={submitting}>
        로그인
      </button>
    </form>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- tests/components/LoginForm.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 5: LogoutButton 및 로그인 페이지 작성**

`components/LogoutButton.tsx`:

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return <button onClick={handleLogout}>로그아웃</button>
}
```

`app/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main>
      <h1>로그인</h1>
      <LoginForm />
    </main>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add components/LoginForm.tsx components/LogoutButton.tsx app/login/page.tsx tests/components/LoginForm.test.tsx
git commit -m "feat: 로그인 페이지/폼, 로그아웃 버튼 추가"
```

---

### Task 7: 라우트 가드 (미들웨어)

**Files:**
- Create: `lib/route-guard.ts`
- Create: `middleware.ts`
- Test: `tests/unit/route-guard.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces: `decideRedirect(path: string, isAuthenticated: boolean): string | null` — `null`이면 리다이렉트 없음, 문자열이면 해당 경로로 리다이렉트

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/route-guard.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/unit/route-guard.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/route-guard'`

- [ ] **Step 3: 구현**

`lib/route-guard.ts`:

```ts
const PROTECTED_PATHS = ['/home']
const AUTH_ONLY_PATHS = ['/login', '/signup']

export function decideRedirect(path: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    return '/login'
  }
  if (isAuthenticated && AUTH_ONLY_PATHS.includes(path)) {
    return '/home'
  }
  return null
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- tests/unit/route-guard.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 5: 미들웨어 연결**

`middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { decideRedirect } from '@/lib/route-guard'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redirectPath = decideRedirect(request.nextUrl.pathname, !!user)
  if (redirectPath) {
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 6: 커밋**

```bash
git add lib/route-guard.ts middleware.ts tests/unit/route-guard.test.ts
git commit -m "feat: 로그인 여부에 따른 라우트 가드 미들웨어 추가"
```

---

### Task 8: 랜딩 페이지 + 홈 페이지

**Files:**
- Modify: `app/page.tsx`
- Create: `app/home/page.tsx`
- Test: `tests/components/LandingPage.test.tsx`

**Interfaces:**
- Consumes:
  - `createClient` (from `lib/supabase/server.ts`, Task 2) — 홈 페이지에서 로그인한 사용자의 닉네임 조회
  - `LogoutButton` (from `components/LogoutButton.tsx`, Task 6)
- Produces: 없음 (최종 사용자 화면)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/components/LandingPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPage from '@/app/page'

describe('LandingPage', () => {
  it('서비스 소개와 면책 문구, 가입/로그인 링크를 보여준다', () => {
    render(<LandingPage />)

    expect(screen.getByText(/거르개/)).toBeInTheDocument()
    expect(
      screen.getByText(/게시물은 작성자 개인 의견이며.*법적 책임을 지지 않습니다/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npm test -- tests/components/LandingPage.test.tsx
```
Expected: FAIL — 현재 `app/page.tsx`는 `create-next-app`이 만든 기본 페이지라 위 텍스트/링크가 없음

- [ ] **Step 3: 랜딩 페이지 구현**

`app/page.tsx`:

```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main>
      <h1>거르개</h1>
      <p>프리랜서가 함께 일하는 원천사·에이전시를 리뷰하고 정보를 나누는 공간입니다.</p>
      <p>
        게시물은 작성자 개인 의견이며, 본 서비스는 게시물 내용에 대해 법적 책임을 지지 않습니다.
      </p>
      <nav>
        <Link href="/signup">회원가입</Link>
        <Link href="/login">로그인</Link>
      </nav>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- tests/components/LandingPage.test.tsx
```
Expected: PASS

- [ ] **Step 5: 홈 페이지 구현 (보호된 라우트)**

`app/home/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user!.id)
    .single()

  return (
    <main>
      <h1>환영합니다, {profile?.nickname}님</h1>
      <p>기업 리뷰/정보공유 기능은 다음 단계에서 이 자리에 추가됩니다.</p>
      <LogoutButton />
    </main>
  )
}
```

`middleware.ts`(Task 7)가 비로그인 사용자를 이미 `/login`으로 리다이렉트하므로, 이 페이지에 도달했다면 `user`는 항상 존재한다.

- [ ] **Step 6: 전체 테스트 스위트 실행**

```bash
npm test
```
Expected: 모든 유닛/컴포넌트 테스트 PASS (통합 테스트는 로컬 Supabase가 켜져 있을 때만 실행: `SUPABASE_LOCAL_ANON_KEY=<anon key> npm test`)

- [ ] **Step 7: 수동 확인**

```bash
npx supabase status   # 로컬 Supabase가 켜져 있는지 확인, 꺼져 있으면 npx supabase start
npm run dev
```

브라우저에서 다음을 순서대로 확인한다:
1. `http://localhost:3000` 접속 → 랜딩 페이지(면책문구 포함) 노출
2. `/home` 직접 접속 시도 → `/login`으로 리다이렉트됨
3. 회원가입(이메일/비밀번호/닉네임 입력) → 자동으로 `/home` 이동, 닉네임이 표시됨
4. 로그아웃 → `/`로 이동
5. 로그인 → 다시 `/home`, 같은 닉네임 표시
6. 로그인한 상태에서 `/login` 접속 시도 → `/home`으로 리다이렉트됨

- [ ] **Step 8: 커밋**

```bash
git add app/page.tsx app/home/page.tsx tests/components/LandingPage.test.tsx
git commit -m "feat: 랜딩 페이지와 로그인 후 홈 페이지 추가"
```

---

## Self-Review Notes

- **스펙 커버리지**: 3장(아키텍처) → Task 1,2,7 / 4장 profiles 스키마 → Task 3 / 5장 RLS(profiles) → Task 3 / 6장 가입·로그인·랜딩 플로우 → Task 5,6,8. companies/reviews/community_posts와 마이페이지 닉네임 수정은 이후 별도 계획(기업 등록, 리뷰, 정보공유+마이페이지)에서 다룬다.
- **타입 일관성**: `validateSignupInput`/`validateLoginInput`의 반환 타입을 Task 4에서 정의한 대로 Task 5·6의 폼 컴포넌트가 그대로 사용한다. `createClient`는 `lib/supabase/client.ts`(동기, 컴포넌트용)와 `lib/supabase/server.ts`(비동기, 서버 전용)로 이름은 같지만 각기 다른 모듈에서 import하므로 충돌하지 않는다.
- **플레이스홀더 스캔**: 없음 — 모든 스텝에 실행 가능한 코드/커맨드를 포함시켰다.
