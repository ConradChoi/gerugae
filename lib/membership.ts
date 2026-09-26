import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 로그인만 요구한다.
 *
 * 초대 코드를 쓰지 않은 계정도 통과한다. 탈퇴처럼 회원 자격과 무관하게
 * 본인이 할 수 있어야 하는 일에 쓴다. 코드를 못 받은 사람이 계정을 지울 수
 * 없으면 이메일과 비밀번호가 본인 의사와 무관하게 남는다.
 */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}

/**
 * 로그인 + 초대 코드 사용을 모두 요구한다.
 * 코드를 쓰지 않은 계정은 로그인은 되지만 콘텐츠를 볼 수 없으므로 /invite로 보낸다.
 */
export async function requireMember() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isMember, error } = await supabase.rpc('is_member')

  if (error) {
    console.error('requireMember: is_member() 호출 실패', error, 'user:', user.id)
  }

  if (!isMember) {
    redirect('/invite')
  }

  return { supabase, user }
}
