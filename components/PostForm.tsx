'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

const MIN_TITLE = 2
const MIN_CONTENT = 10
const MAX_CONTENT = 4000

export function PostForm({
  companyId,
  postId,
  initialTitle = '',
  initialContent = '',
}: {
  companyId: string
  /** 있으면 수정 모드 */
  postId?: string
  initialTitle?: string
  initialContent?: string
}) {
  const isEdit = Boolean(postId)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const nextErrors: Record<string, string> = {}
    if (title.trim().length < MIN_TITLE) nextErrors.title = `제목은 ${MIN_TITLE}자 이상 입력해 주세요.`
    if (content.trim().length < MIN_CONTENT) {
      nextErrors.content = `내용은 ${MIN_CONTENT}자 이상 입력해 주세요.`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      if (isEdit) {
        const { error } = await supabase
          .from('community_posts')
          .update({ title: title.trim(), content: content.trim() })
          .eq('id', postId!)
        if (error) {
          setSubmitError('수정하지 못했습니다. 입력한 내용을 확인해 주세요.')
          return
        }
        window.location.href = `/posts/${postId}`
        return
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert({ company_id: companyId, title: title.trim(), content: content.trim() })
        .select('id')
        .single()

      if (error) {
        setSubmitError('등록하지 못했습니다. 입력한 내용을 확인해 주세요.')
        return
      }
      window.location.href = `/posts/${data.id}`
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
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="post-title">
          제목
        </label>
        <input
          id="post-title"
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title ? (
          <p className={styles.error} role="alert">
            {errors.title}
          </p>
        ) : (
          <p className={styles.helper}>어떤 내용인지 알 수 있게 적어 주세요</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="post-content">
          내용
        </label>
        <textarea
          id="post-content"
          rows={9}
          maxLength={MAX_CONTENT}
          className={`${styles.input} ${errors.content ? styles.inputError : ''}`}
          placeholder="계약 팁, 질문, 경험을 나눠 주세요."
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
            <p className={styles.helper}>후기가 아닌 정보 공유 공간입니다. 별점은 매기지 않습니다</p>
          )}
          <p className={styles.helper}>
            {content.length} / {MAX_CONTENT}
          </p>
        </div>
      </div>

      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        {isEdit ? '수정' : '등록'}
      </Button>
    </form>
  )
}
