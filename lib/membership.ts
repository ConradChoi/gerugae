import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
