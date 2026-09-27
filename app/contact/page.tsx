import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/ContactForm'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: '문의하기 · 거르개',
}

export default function ContactPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 640 }}>
            <h1 className="type-h2">문의하기</h1>
            <p className={`type-body-s ${styles.intro}`}>
              거르개 회원이 아니어도 보내실 수 있습니다. 게시물 삭제 요청, 기업 정보 오류 신고,
              그 밖의 문의를 모두 이곳에서 받습니다.
            </p>

            <ContactForm />

            <p className={`type-body-s ${styles.altLink}`}>
              이미 접수하셨다면 <Link href="/contact/status">문의 확인</Link>에서 처리 상태를 볼 수
              있습니다.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
