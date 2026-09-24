import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanyForm } from '@/components/CompanyForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '기업 등록 · 거르개',
}

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: { name?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card}>
            <h1 className="type-h2">기업 등록</h1>
            <p className={`type-body-s ${styles.intro}`}>
              목록에 없는 기업을 직접 등록합니다. 등록한 기업은 다른 회원도 함께 사용하게 되니,
              상호를 정확히 입력해 주세요.
            </p>
            <CompanyForm initialName={searchParams.name ?? ''} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
