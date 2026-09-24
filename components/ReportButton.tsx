'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export type ReportTarget = 'review' | 'post' | 'company'

const REASONS: Record<ReportTarget, string[]> = {
  review: ['허위사실', '명예훼손', '욕설/비방', '개인정보 노출', '광고/스팸', '기타'],
  post: ['광고/스팸', '욕설/비방', '개인정보 노출', '허위사실', '기타'],
  company: ['정보 오류', '기타'],
}

const TITLES: Record<ReportTarget, string> = {
  review: '이 후기를 신고합니다',
  post: '이 글을 신고합니다',
  company: '기업 정보 오류를 알립니다',
}

export function ReportButton({
  targetType,
  targetId,
  label = '신고',
}: {
  targetType: ReportTarget
  targetId: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!reason) {
      setError('사유를 선택해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('reports').insert({
        target_type: targetType,
        target_id: targetId,
        reason,
        detail: detail.trim() || null,
      })

      if (insertError) {
        // 23505 = unique 위반. 이미 신고한 대상이다.
        if (insertError.code === '23505') {
          setError('이미 신고하신 내용입니다. 검토 중입니다.')
          return
        }
        setError('접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setDone(true)
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function close() {
    setOpen(false)
    setDone(false)
    setReason('')
    setDetail('')
    setError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="type-body-s"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          padding: 'var(--spacing-2xs) var(--spacing-xs)',
        }}
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={TITLES[targetType]}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-lg)',
            background: 'rgba(18, 21, 26, 0.5)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              width: '100%',
              maxWidth: 460,
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-surface)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {done ? (
              <>
                <h2 className="type-h3">신고가 접수되었습니다</h2>
                <p className="type-body-m" style={{ color: 'var(--color-text-secondary)' }}>
                  운영자가 확인 후 처리합니다. 처리 전까지 글은 그대로 보입니다.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={close}>
                    닫기
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="type-h3">{TITLES[targetType]}</h2>
                <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <legend className={styles.label} style={{ marginBottom: 'var(--spacing-xs)' }}>
                    사유
                  </legend>
                  {REASONS[targetType].map((value) => (
                    <label
                      key={value}
                      className="type-body-m"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={value}
                        checked={reason === value}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      {value}
                    </label>
                  ))}
                </fieldset>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="report-detail">
                    자세한 내용 (선택)
                  </label>
                  <textarea
                    id="report-detail"
                    rows={3}
                    maxLength={1000}
                    className={styles.input}
                    placeholder="어떤 점이 문제인지 적어 주시면 검토에 도움이 됩니다."
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-xs)' }}>
                  <Button variant="ghost" onClick={close} disabled={submitting}>
                    취소
                  </Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                    신고하기
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
