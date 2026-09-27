'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { QUESTION_CATEGORIES, validateQuestionInput } from '@/lib/question'
import styles from '@/components/ui/Field.module.css'

export function QuestionForm({
  questionId,
  initialCategory = QUESTION_CATEGORIES[0],
  initialTitle = '',
  initialContent = '',
  initialAnonymous = false,
}: {
  /** 있으면 수정 모드 */
  questionId?: string
  initialCategory?: string
  initialTitle?: string
  initialContent?: string
  initialAnonymous?: boolean
}) {
  const isEdit = Boolean(questionId)
  const [category, setCategory] = useState(initialCategory)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isAnonymous, setIsAnonymous] = useState(initialAnonymous)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validation = validateQuestionInput({ category, title, content })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const values = {
        category: validation.value.category,
        title: validation.value.title,
        content: validation.value.content,
        is_anonymous: isAnonymous,
      }

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(values)
          .eq('id', questionId!)
        if (updateError) {
          setError('수정하지 못했습니다. 잠시 후 다시 시도해 주세요.')
          return
        }
        window.location.href = `/questions/${questionId}`
        return
      }

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert(values)
        .select('id')
        .single()

      if (insertError || !data) {
        setError('등록하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      window.location.href = `/questions/${data.id}`
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="question-category">
          분류
        </label>
        <select
          id="question-category"
          className={styles.input}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {QUESTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="question-title">
          제목
        </label>
        <input
          id="question-title"
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="어떤 점이 궁금하신가요?"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="question-content">
          내용
        </label>
        <textarea
          id="question-content"
          className={styles.input}
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <p className={styles.helper}>
          기업명이나 사람 이름을 그대로 적지 않아도 답을 받을 수 있습니다. 상황과 시기, 금액처럼
          판단에 필요한 것만 적어 주세요.
        </p>
      </div>

      <label
        style={{
          display: 'flex',
          gap: 'var(--spacing-2xs)',
          alignItems: 'flex-start',
          margin: 'var(--spacing-md) 0',
        }}
      >
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span className="type-body-s">
          익명으로 올리기 — 다른 회원에게 닉네임이 보이지 않습니다. 다만 신고가 들어오면 운영자는
          작성자를 확인할 수 있습니다.
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? '저장 중...' : isEdit ? '수정하기' : '올리기'}
      </Button>
    </form>
  )
}
