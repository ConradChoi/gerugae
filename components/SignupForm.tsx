'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateSignupInput } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const result = validateSignupInput({ email, password, nickname })
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname: nickname.trim() } },
      })

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
        <label className={styles.label} htmlFor="signup-email">
          이메일
        </label>
        <input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email ? (
          <p className={styles.error} role="alert">
            {errors.email}
          </p>
        ) : (
          <p className={styles.helper}>로그인할 때 사용합니다</p>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-password">
          비밀번호
        </label>
        <input
          id="signup-password"
          type="password"
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password ? (
          <p className={styles.error} role="alert">
            {errors.password}
          </p>
        ) : (
          <p className={styles.helper}>8자 이상 입력해 주세요</p>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-nickname">
          닉네임
        </label>
        <input
          id="signup-nickname"
          type="text"
          placeholder="거르개유저"
          className={`${styles.input} ${errors.nickname ? styles.inputError : ''}`}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        {errors.nickname ? (
          <p className={styles.error} role="alert">
            {errors.nickname}
          </p>
        ) : (
          <p className={styles.helper}>후기에 이 이름으로 표시됩니다. 나중에 바꿀 수 있습니다</p>
        )}
      </div>
      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}
      <Button type="submit" fullWidth disabled={submitting}>
        가입하기
      </Button>
    </form>
  )
}
