'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

type Props = {
  table: 'reviews' | 'community_posts'
  id: string
  title: string
  description: string
  /** 삭제 후 이동할 경로. 없으면 현재 페이지를 새로고침한다 */
  redirectTo?: string
}

export function DeleteButton({ table, id, title, description, redirectTo }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
      if (deleteError) {
        setError('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      window.location.href = redirectTo ?? window.location.pathname
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        삭제
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
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
              gap: 'var(--spacing-sm)',
              width: '100%',
              maxWidth: 420,
              padding: 'var(--spacing-xl) var(--spacing-xl) var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-surface)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h2 className="type-h3">{title}</h2>
            <p className="type-body-m" style={{ color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
            {error && (
              <p className="type-body-s" role="alert" style={{ color: 'var(--color-status-error-fg)' }}>
                {error}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--spacing-xs)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>
                취소
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
