'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateSignupInput } from '@/lib/validation'

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
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname.trim() } },
    })
    setSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }
    window.location.href = '/home'
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="signup-email">이메일</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p role="alert">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="signup-password">비밀번호</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p role="alert">{errors.password}</p>}
      </div>
      <div>
        <label htmlFor="signup-nickname">닉네임</label>
        <input
          id="signup-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        {errors.nickname && <p role="alert">{errors.nickname}</p>}
      </div>
      {submitError && <p role="alert">{submitError}</p>}
      <button type="submit" disabled={submitting}>
        가입하기
      </button>
    </form>
  )
}
