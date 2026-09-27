'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { isValidInquiryToken, normalizeInquiryToken } from '@/lib/inquiry'
import styles from '@/components/ui/Field.module.css'

type Inquiry = {
  category: string
  content: string
  target_url: string | null
  status: string
  reply: string | null
  created_at: string
  replied_at: string | null
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function InquiryLookup({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [searched, setSearched] = useState(false)

  async function lookup(value: string) {
    setError(null)
    setInquiry(null)

    if (!isValidInquiryToken(value)) {
      setError('조회 코드는 12자리입니다. 다시 확인해 주세요.')
      setSearched(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: lookupError } = await supabase.rpc('lookup_inquiry', {
        input_token: normalizeInquiryToken(value),
      })

      if (lookupError) {
        setError('조회하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setSearched(true)
      setInquiry((data as Inquiry[])?.[0] ?? null)
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void lookup(code)
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="inquiry-code">
            조회 코드
          </label>
          <input
            id="inquiry-code"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="접수할 때 받으신 12자리 코드"
            style={{ letterSpacing: '0.05em' }}
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? '조회 중...' : '조회하기'}
        </Button>
      </form>

      {searched && !inquiry && (
        <p className="type-body-m" role="status" style={{ marginTop: 'var(--spacing-lg)' }}>
          해당 코드로 접수된 문의를 찾지 못했습니다.
        </p>
      )}

      {inquiry && (
        <div role="status" style={{ marginTop: 'var(--spacing-lg)' }}>
          <p className={`type-body-s ${styles.helper}`}>
            {inquiry.category} · {formatDateTime(inquiry.created_at)} 접수
          </p>
          <p className="type-label-l" style={{ marginTop: 'var(--spacing-xs)' }}>
            처리 상태: {inquiry.status}
          </p>

          <div
            style={{
              margin: 'var(--spacing-md) 0',
              padding: 'var(--spacing-md)',
              background: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p className="type-body-m" style={{ whiteSpace: 'pre-wrap' }}>
              {inquiry.content}
            </p>
          </div>

          {inquiry.reply ? (
            <>
              <p className="type-label-l">운영자 답변</p>
              <p className={`type-body-s ${styles.helper}`}>
                {inquiry.replied_at && `${formatDateTime(inquiry.replied_at)}`}
              </p>
              <p className="type-body-m" style={{ whiteSpace: 'pre-wrap', marginTop: 'var(--spacing-xs)' }}>
                {inquiry.reply}
              </p>
            </>
          ) : (
            <p className={`type-body-s ${styles.helper}`}>
              아직 답변이 등록되지 않았습니다. 확인 후 이곳에 답변을 남기겠습니다.
            </p>
          )}
        </div>
      )}
    </>
  )
}
