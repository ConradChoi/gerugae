import type { Metadata } from 'next'
import Link from 'next/link'
import { InquiryLookup } from '@/components/InquiryLookup'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '문의 확인 · 거르개',
}

export default function InquiryStatusPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 640 }}>
            <h1 className="type-h2">문의 확인</h1>
            <p className={`type-body-s ${styles.intro}`}>
              접수하실 때 받으신 조회 코드로 처리 상태와 운영자 답변을 볼 수 있습니다.
            </p>

            <InquiryLookup initialCode={searchParams.code ?? ''} />

            <p className={`type-body-s ${styles.altLink}`}>
              <Link href="/contact">새 문의 보내기</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
