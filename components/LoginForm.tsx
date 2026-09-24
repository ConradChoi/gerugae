'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateLoginInput } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const result = validateLoginInput({ email, password })
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setSubmitError(error.message)
        return
      }
      window.location.href = '/home'
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
        <label className={styles.label} htmlFor="login-email">
          이메일
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && (
          <p className={styles.error} role="alert">
            {errors.email}
          </p>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">
          비밀번호
        </label>
        <input
          id="login-password"
          type="password"
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && (
          <p className={styles.error} role="alert">
            {errors.password}
          </p>
        )}
      </div>
      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}
      <Button type="submit" fullWidth disabled={submitting}>
        로그인
      </Button>
    </form>
  )
}
