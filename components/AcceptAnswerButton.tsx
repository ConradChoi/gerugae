'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function AcceptAnswerButton({
  questionId,
  answerId,
  accepted,
}: {
  questionId: string
  answerId: string
  accepted: boolean
}) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setError(null)
    setWorking(true)
    try {
      const supabase = createClient()
      const { error: rpcError } = await supabase.rpc('accept_answer', {
        input_question_id: questionId,
        // 이미 채택한 답변을 다시 누르면 채택을 거둔다
        input_answer_id: accepted ? null : answerId,
      })

      if (rpcError) {
        setError('처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
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
    <>
      <Button variant={accepted ? 'secondary' : 'primary'} onClick={toggle} disabled={working}>
        {accepted ? '채택 취소' : '채택하기'}
      </Button>
      {error && (
        <p className="type-body-s" role="alert" style={{ color: 'var(--color-text-danger)' }}>
          {error}
        </p>
      )}
    </>
  )
}
