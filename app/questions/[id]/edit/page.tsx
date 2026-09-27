import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireMember } from '@/lib/membership'
import { QuestionForm } from '@/components/QuestionForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../../auth.module.css'

export const metadata: Metadata = {
  title: '질문 수정 · 거르개',
}

type QuestionRow = {
  id: string
  category: string
  title: string
  content: string
  is_anonymous: boolean
  is_mine: boolean
}

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireMember()

  const { data } = await supabase
    .from('questions_view')
    .select('id, category, title, content, is_anonymous, is_mine')
    .eq('id', params.id)
    .maybeSingle()

  const question = data as QuestionRow | null

  if (!question) {
    notFound()
  }

  // RLS가 남의 질문 수정을 막지만, 화면에서도 미리 막아 혼선을 줄인다
  if (!question.is_mine) {
    redirect(`/questions/${question.id}`)
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">질문 수정</h1>
            <QuestionForm
              questionId={question.id}
              initialCategory={question.category}
              initialTitle={question.title}
              initialContent={question.content}
              initialAnonymous={question.is_anonymous}
            />
            <p className={`type-body-s ${styles.altLink}`}>
              <Link href={`/questions/${question.id}`}>돌아가기</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
