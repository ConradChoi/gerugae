import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { QuestionForm } from '@/components/QuestionForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '질문하기 · 거르개',
}

export default async function NewQuestionPage() {
  await requireMember()

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">질문하기</h1>
            <p className={`type-body-s ${styles.intro}`}>
              겪고 계신 상황을 적어 주세요. 같은 일을 지나온 분들이 답을 남깁니다.
            </p>
            <QuestionForm />
            <p className={`type-body-s ${styles.altLink}`}>
              <Link href="/questions">목록으로</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
