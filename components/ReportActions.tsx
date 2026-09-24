'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

type Props = {
  reportId: string
  targetType: 'review' | 'post' | 'company'
  targetId: string
  adminId: string
}

/** 기업 신고는 글이 아니라 정보 오류이므로 가림 대상이 아니다 */
const HIDEABLE: Record<Props['targetType'], 'reviews' | 'community_posts' | null> = {
  review: 'reviews',
  post: 'community_posts',
  company: null,
}

export function ReportActions({ reportId, targetType, targetId, adminId }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function resolve(status: 'hidden' | 'kept') {
    setError(null)
    setWorking(true)
    try {
      const supabase = createClient()
      const table = HIDEABLE[targetType]

      if (status === 'hidden' && table) {
        const { error: hideError } = await supabase
          .from(table)
          .update({ hidden_at: new Date().toISOString(), hidden_reason: '신고 검토 결과 가림' })
          .eq('id', targetId)
        if (hideError) {
          setError('글을 가리지 못했습니다.')
          return
        }
      }

      if (status === 'kept' && table) {
        const { error: showError } = await supabase
          .from(table)
          .update({ hidden_at: null, hidden_reason: null })
          .eq('id', targetId)
        if (showError) {
          setError('가림을 해제하지 못했습니다.')
          return
        }
      }

      const { error: updateError } = await supabase
        .from('reports')
        .update({ status, resolved_at: new Date().toISOString(), resolved_by: adminId })
        .eq('id', reportId)

      if (updateError) {
        setError('처리 상태를 저장하지 못했습니다.')
        return
      }
      window.location.reload()
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
      {HIDEABLE[targetType] && (
        <Button variant="danger" onClick={() => resolve('hidden')} disabled={working}>
          가리기
        </Button>
      )}
      <Button variant="secondary" onClick={() => resolve('kept')} disabled={working}>
        {HIDEABLE[targetType] ? '유지 (가림 해제)' : '확인함'}
      </Button>
      {error && (
        <span className="type-body-s" role="alert" style={{ color: 'var(--color-status-error-fg)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
