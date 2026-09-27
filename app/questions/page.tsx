import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { QUESTION_CATEGORIES, displayAuthor } from '@/lib/question'
import layout from '@/components/layout/Layout.module.css'
import styles from './questions.module.css'

export const metadata: Metadata = {
  title: '묻고 답하기 · 거르개',
}

type QuestionRow = {
  id: string
  category: string
  title: string
  content: string
  is_anonymous: boolean
  author_nickname: string | null
  accepted_answer_id: string | null
  answer_count: number
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const { supabase } = await requireMember()

  const active = QUESTION_CATEGORIES.find((c) => c === searchParams.category)

  let query = supabase
    .from('questions_view')
    .select(
      'id, category, title, content, is_anonymous, author_nickname, accepted_answer_id, answer_count, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (active) {
    query = query.eq('category', active)
  }

  const { data, error } = await query

  if (error) {
    console.error('QuestionsPage: 질문 목록 조회 실패', error)
  }

  const questions = (data ?? []) as QuestionRow[]

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <div className={styles.head}>
            <div>
              <h1 className="type-h1">묻고 답하기</h1>
              <p className={`type-body-s ${styles.meta}`}>
                계약, 대금, 세무처럼 혼자 판단하기 어려운 일을 서로 묻고 답하는 곳입니다.
              </p>
            </div>
            <Link href="/questions/new">
              <Button>질문하기</Button>
            </Link>
          </div>

          <nav className={styles.filters} aria-label="분류">
            <Link href="/questions" className={styles.filter} data-active={!active}>
              전체
            </Link>
            {QUESTION_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/questions?category=${encodeURIComponent(c)}`}
                className={styles.filter}
                data-active={active === c}
              >
                {c}
              </Link>
            ))}
          </nav>

          {questions.length === 0 ? (
            <div className={styles.empty}>
              <p className={`type-body-m ${styles.meta}`}>
                {active ? '이 분류에는 아직 질문이 없습니다.' : '아직 올라온 질문이 없습니다.'}
              </p>
              <Link href="/questions/new">
                <Button variant="secondary">첫 질문 올리기</Button>
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {questions.map((q) => (
                <li key={q.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <Link href={`/questions/${q.id}`} className="type-label-l">
                      {q.title}
                    </Link>
                    <span
                      className={`${styles.badge} ${q.accepted_answer_id ? styles.badgeAccepted : ''}`}
                    >
                      {q.accepted_answer_id ? '채택 완료' : `답변 ${q.answer_count}`}
                    </span>
                  </div>
                  <p className={`type-body-s ${styles.excerpt}`}>{q.content}</p>
                  <p className={`type-body-s ${styles.meta}`}>
                    {q.category} · {displayAuthor(q)} · {formatDate(q.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
