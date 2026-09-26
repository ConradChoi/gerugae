import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateWithdrawInput } from '@/lib/withdraw'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { password?: unknown; confirmed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '요청을 이해하지 못했습니다.' }, { status: 400 })
  }

  const input = {
    password: typeof body.password === 'string' ? body.password : '',
    confirmed: body.confirmed === true,
  }

  const validation = validateWithdrawInput(input)
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 })
  }

  // 본인 확인. 세션만 믿으면 자리를 비운 사이 남이 계정을 지울 수 있다.
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.password,
  })
  if (passwordError) {
    return NextResponse.json({ message: '비밀번호가 맞지 않습니다.' }, { status: 403 })
  }

  // auth.users 삭제는 서비스 롤이어야 한다. 지우는 대상은 언제나 호출한 본인이며,
  // 요청 본문에서 받은 값이 아니라 세션에서 얻은 id를 쓴다.
  const admin = createAdminClient()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('회원 탈퇴 실패', deleteError, 'user:', user.id)
    return NextResponse.json(
      { message: '탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }

  // 계정이 사라졌으니 남은 쿠키도 정리한다.
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
