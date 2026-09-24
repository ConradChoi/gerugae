import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/LoginForm'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: '로그인 · 거르개',
}

export default function LoginPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card}>
            <h1 className="type-h1">로그인</h1>
            <LoginForm />
            <p className={`type-body-s ${styles.altLink}`}>
              아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
