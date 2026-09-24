'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

export function NicknameForm({ userId, initialNickname }: { userId: string; initialNickname: string }) {
  const [nickname, setNickname] = useState(initialNickname)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const trimmed = nickname.trim()
    if (trimmed.length === 0) {
      setError('닉네임을 입력해 주세요.')
      return
    }
    if (trimmed.length > 20) {
      setError('닉네임은 20자 이하로 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: trimmed })
        .eq('id', userId)

      if (updateError) {
        setError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setSaved(true)
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <div className={styles.field} style={{ flex: 1, minWidth: 220 }}>
        <label className={styles.label} htmlFor="nickname">
          닉네임
        </label>
        <input
          id="nickname"
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value)
            setSaved(false)
          }}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : saved ? (
          <p className={styles.helper} role="status">
            저장되었습니다
          </p>
        ) : (
          <p className={styles.helper}>후기에 이 이름으로 표시됩니다</p>
        )}
      </div>
      <Button type="submit" variant="secondary" disabled={saving}>
        저장
      </Button>
    </form>
  )
}
