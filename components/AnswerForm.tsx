'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { validateAnswerInput } from '@/lib/question'
import styles from '@/components/ui/Field.module.css'

export function AnswerForm({ questionId }: { questionId: string }) {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validation = validateAnswerInput(content)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('answers').insert({
        question_id: questionId,
        content: validation.value,
        is_anonymous: isAnonymous,
      })

      if (insertError) {
        setError('등록하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      window.location.reload()
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="answer-content">
          답변 남기기
        </label>
        <textarea
          id="answer-content"
          className={styles.input}
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="겪어보신 일이나 알고 계신 것을 나눠 주세요."
          style={{ resize: 'vertical' }}
        />
      </div>

      <label
        style={{
          display: 'flex',
          gap: 'var(--spacing-2xs)',
          alignItems: 'flex-start',
          margin: 'var(--spacing-sm) 0',
        }}
      >
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span className="type-body-s">익명으로 답하기</span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? '등록 중...' : '답변 등록'}
      </Button>
    </form>
  )
}
