'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function LogoutButton() {
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setError(null)
    const supabase = createClient()
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    window.location.href = '/'
  }

  return (
    <>
      <Button variant="ghost" onClick={handleLogout}>
        로그아웃
      </Button>
      {error && (
        <p className="type-body-s" role="alert" style={{ color: 'var(--color-status-error-fg)' }}>
          {error}
        </p>
      )}
    </>
  )
}
