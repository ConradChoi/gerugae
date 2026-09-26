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
  //
  // 실패 원인을 reason으로 구분해 돌려준다. 배포 환경의 서버 로그를 바로 볼 수
  // 없어서, 설정 문제인지 삭제 실패인지 화면에서 가려낼 수 있어야 한다.
  // 값 자체는 흘리지 않는다.
  let admin
  try {
    admin = createAdminClient()
  } catch (error) {
    console.error('회원 탈퇴 실패 — 서비스 롤 키 설정', error)
    return NextResponse.json(
      {
        message:
          '서버 설정이 끝나지 않아 탈퇴를 처리할 수 없습니다. 운영자에게 알려 주세요.',
        reason: 'missing_service_role_key',
      },
      { status: 500 }
    )
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('회원 탈퇴 실패', deleteError, 'user:', user.id)
    return NextResponse.json(
      {
        message: '탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        reason: 'delete_failed',
      },
      { status: 500 }
    )
  }

  // 계정이 사라졌으니 남은 쿠키도 정리한다.
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
