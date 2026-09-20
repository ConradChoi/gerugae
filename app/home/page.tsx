import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user!.id)
    .maybeSingle()

  if (error) {
    console.error('HomePage: failed to load profile', error)
  }

  return (
    <main>
      {profile?.nickname ? (
        <h1>환영합니다, {profile.nickname}님</h1>
      ) : (
        <>
          <h1>환영합니다</h1>
          <p>프로필 정보를 불러오지 못했습니다.</p>
        </>
      )}
      <p>기업 리뷰/정보공유 기능은 다음 단계에서 이 자리에 추가됩니다.</p>
      <LogoutButton />
    </main>
  )
}
