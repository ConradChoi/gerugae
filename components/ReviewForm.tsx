'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export type TagOption = { id: string; label: string }

const MIN_CONTENT = 10
const MAX_CONTENT = 2000

export function ReviewForm({
  companyId,
  companyName,
  tags,
}: {
  companyId: string
  companyName: string
  tags: TagOption[]
}) {
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setAlreadyReviewed(false)

    const nextErrors: Record<string, string> = {}
    if (rating < 1) nextErrors.rating = '별점을 선택해 주세요.'
    if (content.trim().length < MIN_CONTENT) {
      nextErrors.content = `후기는 ${MIN_CONTENT}자 이상 입력해 주세요.`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reviews')
        .insert({ company_id: companyId, rating, content: content.trim() })
        .select('id')
        .single()

      if (error) {
        // 23505 = unique 위반. 이 기업에는 이미 후기를 남겼다는 뜻이다.
        if (error.code === '23505') {
          setAlreadyReviewed(true)
          return
        }
        setSubmitError('등록하지 못했습니다. 입력한 내용을 확인해 주세요.')
        return
      }

      if (selectedTags.length > 0) {
        const { error: tagError } = await supabase
          .from('review_tags')
          .insert(selectedTags.map((tagId) => ({ review_id: data.id, tag_id: tagId })))
        if (tagError) {
          console.error('ReviewForm: failed to attach tags', tagError)
        }
      }

      window.location.href = `/companies/${companyId}`
    } catch {
      setSubmitError('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}
    >
      <div className={styles.field}>
        <span className={styles.label}>전체 평가</span>
        <div
          role="radiogroup"
          aria-label="별점"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value}점`}
              onClick={() => setRating(value)}
              style={{
                width: 40,
                height: 40,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2 L15 9 L22.5 9.5 L16.8 14.3 L18.6 21.6 L12 17.6 L5.4 21.6 L7.2 14.3 L1.5 9.5 L9 9 Z"
                  fill={
                    value <= rating ? 'var(--color-rating-filled)' : 'var(--color-rating-empty)'
                  }
                />
              </svg>
            </button>
          ))}
          <span className="type-body-m" style={{ color: 'var(--color-text-secondary)' }}>
            {rating > 0 ? `${rating}점` : '별을 눌러 점수를 매겨 주세요'}
          </span>
        </div>
        {errors.rating && (
          <p className={styles.error} role="alert">
            {errors.rating}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>해당하는 항목을 골라 주세요 (여러 개 선택 가능)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {tags.map((tag) => {
            const selected = selectedTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag.id)}
                className="type-label-m"
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: selected
                    ? '2px solid var(--color-brand-primary)'
                    : '2px solid transparent',
                  background: selected
                    ? 'var(--color-tag-selected-bg)'
                    : 'var(--color-tag-neutral-bg)',
                  color: selected
                    ? 'var(--color-tag-selected-text)'
                    : 'var(--color-tag-neutral-text)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {tag.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="review-content">
          후기 내용
        </label>
        <textarea
          id="review-content"
          rows={7}
          maxLength={MAX_CONTENT}
          className={`${styles.input} ${errors.content ? styles.inputError : ''}`}
          placeholder="어떤 점이 좋았고 어떤 점이 아쉬웠는지 구체적으로 적어 주세요. 대금 지급, 소통 방식, 계약 이행 등이 도움이 됩니다."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {errors.content ? (
            <p className={styles.error} role="alert">
              {errors.content}
            </p>
          ) : (
            <p className={styles.helper}>구체적인 사실 위주로 적어 주세요</p>
          )}
          <p className={styles.helper}>
            {content.length} / {MAX_CONTENT}
          </p>
        </div>
      </div>

      {alreadyReviewed && (
        <p className={styles.error} role="alert">
          {companyName}에는 이미 후기를 남기셨습니다. 마이페이지에서 수정할 수 있습니다.
        </p>
      )}
      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        후기 등록
      </Button>
    </form>
  )
}
