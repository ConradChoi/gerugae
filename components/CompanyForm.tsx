'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  COMPANY_CATEGORIES,
  normalizeBizRegNumber,
  validateCompanyInput,
} from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import styles from '@/components/ui/Field.module.css'

type DuplicateCompany = { id: string; name: string; category: string }

export function CompanyForm({ initialName = '' }: { initialName?: string }) {
  const [name, setName] = useState(initialName)
  const [bizRegNumber, setBizRegNumber] = useState('')
  const [category, setCategory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<DuplicateCompany | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setDuplicate(null)

    const result = validateCompanyInput({ name, bizRegNumber, category })
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const digits = normalizeBizRegNumber(bizRegNumber)

      const { data, error } = await supabase
        .from('companies')
        .insert({ name: name.trim(), biz_reg_number: digits, category })
        .select('id')
        .single()

      if (error) {
        // 23505 = unique 위반. 같은 사업자등록번호가 이미 등록된 경우다.
        if (error.code === '23505' && digits) {
          const { data: existing } = await supabase
            .from('companies')
            .select('id, name, category')
            .eq('biz_reg_number', digits)
            .maybeSingle()
          if (existing) {
            setDuplicate(existing)
            return
          }
        }
        setSubmitError('등록하지 못했습니다. 입력한 내용을 확인해 주세요.')
        return
      }

      window.location.href = `/companies/${data.id}`
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
        <label className={styles.label} htmlFor="company-name">
          기업 이름
        </label>
        <input
          id="company-name"
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name ? (
          <p className={styles.error} role="alert">
            {errors.name}
          </p>
        ) : (
          <p className={styles.helper}>사업자등록증에 적힌 상호를 그대로 입력해 주세요</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="company-biz">
          사업자등록번호 (선택)
        </label>
        <input
          id="company-biz"
          className={`${styles.input} ${errors.bizRegNumber ? styles.inputError : ''}`}
          placeholder="123-45-67890"
          value={bizRegNumber}
          onChange={(e) => setBizRegNumber(e.target.value)}
        />
        {errors.bizRegNumber ? (
          <p className={styles.error} role="alert">
            {errors.bizRegNumber}
          </p>
        ) : (
          <p className={styles.helper}>입력하면 같은 기업이 중복 등록되는 것을 막을 수 있습니다</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="company-category">
          분류
        </label>
        <select
          id="company-category"
          className={`${styles.input} ${errors.category ? styles.inputError : ''}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">분류를 선택하세요</option>
          {COMPANY_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className={styles.error} role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {duplicate && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-status-info-bg)',
          }}
        >
          <p className="type-label-m" style={{ color: 'var(--color-status-info-fg)' }}>
            같은 사업자등록번호로 이미 등록된 기업이 있습니다
          </p>
          <a className="type-body-m" href={`/companies/${duplicate.id}`}>
            {duplicate.name} · {duplicate.category} — 이 기업으로 이동
          </a>
          <p className="type-body-s" style={{ color: 'var(--color-text-secondary)' }}>
            중복 등록은 후기가 흩어지게 만듭니다. 위 기업에 후기를 남겨 주세요.
          </p>
        </div>
      )}

      {submitError && (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        등록하고 후기 쓰기
      </Button>
    </form>
  )
}
