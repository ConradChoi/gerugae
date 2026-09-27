import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireMember } from '@/lib/membership'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { ReportButton } from '@/components/ReportButton'
import { AnswerForm } from '@/components/AnswerForm'
import { AcceptAnswerButton } from '@/components/AcceptAnswerButton'
import { HiddenNotice } from '@/components/ui/HiddenNotice'
import { displayAuthor } from '@/lib/question'
import layout from '@/components/layout/Layout.module.css'
import styles from '../questions.module.css'

export const metadata: Metadata = {
  title: '질문 · 거르개',
}

type QuestionRow = {
  id: string
  category: string
  title: string
  content: string
  is_anonymous: boolean
  author_nickname: string | null
  accepted_answer_id: string | null
  hidden_at: string | null
  is_mine: boolean
  created_at: string
}

type AnswerRow = {
  id: string
  content: string
  is_anonymous: boolean
  author_nickname: string | null
  hidden_at: string | null
  is_mine: boolean
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function QuestionDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireMember()

  const { data: questionData } = await supabase
    .from('questions_view')
    .select(
      'id, category, title, content, is_anonymous, author_nickname, accepted_answer_id, hidden_at, is_mine, created_at'
    )
    .eq('id', params.id)
    .maybeSingle()

  const question = questionData as QuestionRow | null

  if (!question) {
    notFound()
  }

  const { data: answerData } = await supabase
    .from('answers_view')
    .select('id, content, is_anonymous, author_nickname, hidden_at, is_mine, created_at')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  const answers = (answerData ?? []) as AnswerRow[]

  // 채택된 답변을 맨 위로 올린다
  const sorted = [...answers].sort((a, b) => {
    if (a.id === question.accepted_answer_id) return -1
    if (b.id === question.accepted_answer_id) return 1
    return 0
  })

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <p className={`type-body-s ${styles.meta}`}>
            <Link href={`/questions?category=${encodeURIComponent(question.category)}`}>
              {question.category}
            </Link>
          </p>

          {question.hidden_at && <HiddenNotice />}

          <h1 className="type-h1">{question.title}</h1>
          <p className={`type-body-s ${styles.meta}`}>
            {displayAuthor(question)} · {formatDate(question.created_at)}
          </p>
          <p className={`type-body-l ${styles.content}`} style={{ marginTop: 'var(--spacing-lg)' }}>
            {question.content}
          </p>

          <div className={styles.actions}>
            {question.is_mine ? (
              <>
                <Link href={`/questions/${question.id}/edit`}>
                  <Button variant="secondary">수정</Button>
                </Link>
                <DeleteButton
                  table="questions"
                  id={question.id}
                  title="이 질문을 삭제할까요?"
                  description="달린 답변도 함께 사라집니다. 되돌릴 수 없습니다."
                  redirectTo="/questions"
                />
              </>
            ) : (
              <ReportButton targetType="question" targetId={question.id} />
            )}
          </div>

          <section className={styles.section}>
            <h2 className="type-h2">답변 {answers.length}</h2>

            {answers.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>
                아직 답변이 없습니다. 아는 만큼만 답해 주셔도 도움이 됩니다.
              </p>
            ) : (
              <ul className={styles.list} style={{ marginTop: 'var(--spacing-md)' }}>
                {sorted.map((answer) => {
                  const accepted = answer.id === question.accepted_answer_id
                  return (
                    <li
                      key={answer.id}
                      className={`${styles.answer} ${accepted ? styles.answerAccepted : ''}`}
                    >
                      <div className={styles.cardHead}>
                        <span className="type-label-l">{displayAuthor(answer)}</span>
                        <span className={`type-body-s ${styles.meta}`}>
                          {accepted && (
                            <span className={`${styles.badge} ${styles.badgeAccepted}`}>채택됨</span>
                          )}{' '}
                          {formatDate(answer.created_at)}
                        </span>
                      </div>

                      {answer.hidden_at && <HiddenNotice />}

                      <p className={`type-body-m ${styles.content}`}>{answer.content}</p>

                      <div className={styles.actions}>
                        {question.is_mine && (
                          <AcceptAnswerButton
                            questionId={question.id}
                            answerId={answer.id}
                            accepted={accepted}
                          />
                        )}
                        {answer.is_mine ? (
                          <DeleteButton
                            table="answers"
                            id={answer.id}
                            title="이 답변을 삭제할까요?"
                            description="삭제하면 되돌릴 수 없습니다."
                            redirectTo={`/questions/${question.id}`}
                          />
                        ) : (
                          <ReportButton targetType="answer" targetId={answer.id} />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <AnswerForm questionId={question.id} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
