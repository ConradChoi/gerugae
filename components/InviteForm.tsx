'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export function InviteForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const trimmed = code.trim()
    if (trimmed.length === 0) {
      setError('초대 코드를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('redeem_invite_code', {
        input_code: trimmed,
      })

      if (rpcError) {
        setError('확인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      if (data !== 'ok') {
        // 함수가 사유를 문자열로 돌려준다
        setError(String(data))
        return
      }
      window.location.href = '/home'
    } catch {
      setError('일시적인 오류가 발생했습니다.')
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
        <label className={styles.label} htmlFor="invite-code">
          초대 코드
        </label>
        <input
          id="invite-code"
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="ABCD2345"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ letterSpacing: '0.1em', fontSize: 18 }}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.helper}>초대한 분에게 받은 8자리 코드를 입력해 주세요</p>
        )}
      </div>
      <Button type="submit" fullWidth disabled={submitting}>
        확인
      </Button>
    </form>
  )
}
