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
