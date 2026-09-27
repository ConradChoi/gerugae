'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { INQUIRY_CATEGORIES, validateInquiryInput } from '@/lib/inquiry'
import styles from '@/components/ui/Field.module.css'

export function ContactForm() {
  const [category, setCategory] = useState<string>(INQUIRY_CATEGORIES[0])
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validation = validateInquiryInput({ category, content, contact, targetUrl, honeypot })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSending(true)
    try {
      const supabase = createClient()
      const { data, error: submitError } = await supabase.rpc('submit_inquiry', {
        input_category: validation.value.category,
        input_content: validation.value.content,
        input_contact: validation.value.contact,
        input_target_url: validation.value.targetUrl,
      })

      if (submitError) {
        setError(submitError.message.includes('몰리고') ? submitError.message : '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setToken(data as string)
    } catch {
      setError('일시적인 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  if (token) {
    return (
      <div role="status">
        <p className="type-body-m">문의가 접수되었습니다.</p>
        <p className={`type-body-s ${styles.helper}`}>
          아래 <strong>조회 코드</strong>로 처리 상태와 답변을 확인할 수 있습니다.{' '}
          <strong>이 코드가 유일한 확인 방법이니 꼭 저장해 주세요.</strong>
        </p>
        <p
          className="type-h2"
          style={{
            margin: 'var(--spacing-md) 0',
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            letterSpacing: '0.1em',
            textAlign: 'center',
            userSelect: 'all',
          }}
        >
          {token}
        </p>
        <Link href={`/contact/status?code=${token}`}>
          <Button variant="secondary">문의 확인하러 가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="inquiry-category">
          문의 유형
        </label>
        <select
          id="inquiry-category"
          className={styles.input}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {INQUIRY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {category !== '일반 문의' && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="inquiry-target">
            대상 글 주소 <span className={styles.helper}>(선택)</span>
          </label>
          <input
            id="inquiry-target"
            className={styles.input}
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://gerugae.ylia.io/companies/..."
          />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="inquiry-content">
          내용
        </label>
        <textarea
          id="inquiry-content"
          className={styles.input}
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <p className={styles.helper}>
          삭제를 요청하시는 경우, 어느 부분이 어떤 권리를 침해하는지 적어 주시면 더 빨리 처리할 수
          있습니다.
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="inquiry-contact">
          회신받을 연락처 <span className={styles.helper}>(선택)</span>
        </label>
        <input
          id="inquiry-contact"
          className={styles.input}
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className={styles.helper}>
          적지 않으셔도 됩니다. 접수 후 드리는 조회 코드로 답변을 확인할 수 있습니다.
        </p>
      </div>

      {/* 사람에게는 보이지 않는 칸. 자동 입력을 걸러내기 위한 것이다. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="inquiry-website">웹사이트</label>
        <input
          id="inquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={sending}>
        {sending ? '보내는 중...' : '보내기'}
      </Button>
    </form>
  )
}
