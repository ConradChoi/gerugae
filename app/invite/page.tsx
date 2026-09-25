import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InviteForm } from '@/components/InviteForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: '초대 코드 입력 · 거르개',
}

export default async function InvitePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isMember } = await supabase.rpc('is_member')

  if (isMember) {
    redirect('/home')
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card}>
            <h1 className="type-h1">초대 코드가 필요합니다</h1>
            <p className={`type-body-s ${styles.intro}`}>
              거르개는 초대받은 분만 이용할 수 있습니다. 후기에 담긴 내용이 민감해, 업체 관계자가
              쉽게 들어올 수 없도록 하기 위해서입니다.
            </p>
            <InviteForm />
            <div className={styles.notice}>
              <p className="type-label-m">코드가 없다면</p>
              <p className={`type-body-s ${styles.noticeBody}`}>
                이미 이용 중인 프리랜서에게 초대 코드를 요청해 주세요. 회원 한 명당 3명까지 초대할
                수 있습니다.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
