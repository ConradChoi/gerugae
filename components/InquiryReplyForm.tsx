'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

const STATUSES = ['접수', '처리 중', '완료'] as const

export function InquiryReplyForm({
  id,
  initialStatus,
  initialReply,
}: {
  id: string
  initialStatus: string
  initialReply: string | null
}) {
  const [status, setStatus] = useState(initialStatus)
  const [reply, setReply] = useState(initialReply ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const supabase = createClient()
      const trimmed = reply.trim()
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({
          status,
          reply: trimmed || null,
          replied_at: trimmed ? new Date().toISOString() : null,
        })
        .eq('id', id)

      if (updateError) {
        setError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      window.location.reload()
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ marginTop: 'var(--spacing-sm)' }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`reply-${id}`}>
          답변
        </label>
        <textarea
          id={`reply-${id}`}
          className={styles.input}
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <p className={styles.helper}>
          접수하신 분이 조회 코드로 이 답변을 봅니다. 이메일로는 나가지 않습니다.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div className={styles.field} style={{ minWidth: 160 }}>
          <label className={styles.label} htmlFor={`status-${id}`}>
            처리 상태
          </label>
          <select
            id={`status-${id}`}
            className={styles.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
