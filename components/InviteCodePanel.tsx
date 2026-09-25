'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

type Code = {
  code: string
  max_uses: number
  used_count: number
  expires_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function InviteCodePanel({ initialCode }: { initialCode: Code | null }) {
  const [code, setCode] = useState<Code | null>(initialCode)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function issue() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('issue_invite_code')
      if (rpcError || !data?.[0]) {
        setError('코드를 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setCode(data[0] as Code)
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {code ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              flexWrap: 'wrap',
            }}
          >
            <span
              className="type-h2"
              style={{ letterSpacing: '0.12em', fontFamily: 'ui-monospace, monospace' }}
            >
              {code.code}
            </span>
            <Button variant="secondary" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <p className="type-body-s" style={{ color: 'var(--color-text-secondary)' }}>
            {code.max_uses - code.used_count}명 남음 (총 {code.max_uses}명) ·{' '}
            {formatDate(code.expires_at)}까지
          </p>
        </>
      ) : (
        <>
          <p className="type-body-m" style={{ color: 'var(--color-text-secondary)' }}>
            아직 발급한 코드가 없습니다. 함께 쓰면 좋을 프리랜서를 3명까지 초대할 수 있습니다.
          </p>
          <div>
            <Button variant="secondary" onClick={issue} disabled={loading}>
              초대 코드 발급
            </Button>
          </div>
        </>
      )}
      {error && (
        <p className="type-body-s" role="alert" style={{ color: 'var(--color-status-error-fg)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
