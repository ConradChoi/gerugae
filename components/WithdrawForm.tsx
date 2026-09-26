'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { validateWithdrawInput } from '@/lib/withdraw'
import styles from '@/components/ui/Field.module.css'

export function WithdrawForm() {
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validation = validateWithdrawInput({ password, confirmed })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmed }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.message ?? '탈퇴를 처리하지 못했습니다.')
        return
      }

      window.location.href = '/?withdrawn=1'
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="withdraw-password">
          비밀번호
        </label>
        <input
          id="withdraw-password"
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className={styles.helper}>본인 확인을 위해 비밀번호를 다시 입력해 주세요.</p>
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
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span className="type-body-s">
          위 안내를 읽었고, 탈퇴 후에는 내가 쓴 글을 수정하거나 삭제할 수 없다는 점에 동의합니다.
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="danger" disabled={submitting}>
        {submitting ? '처리 중...' : '탈퇴하기'}
      </Button>
    </form>
  )
}
