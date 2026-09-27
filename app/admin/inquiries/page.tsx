import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InquiryReplyForm } from '@/components/InquiryReplyForm'
import layout from '@/components/layout/Layout.module.css'
import styles from '../reports/admin.module.css'

export const metadata: Metadata = {
  title: '문의 관리 · 거르개',
}

type Inquiry = {
  id: string
  access_token: string
  category: string
  content: string
  contact: string | null
  target_url: string | null
  status: string
  reply: string | null
  created_at: string
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default async function AdminInquiriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin')

  if (adminCheckError) {
    console.error('AdminInquiriesPage: is_admin() 호출 실패', adminCheckError, 'user:', user.id)
  }

  if (!isAdmin) {
    notFound()
  }

  const { data, error } = await supabase
    .from('inquiries')
    .select('id, access_token, category, content, contact, target_url, status, reply, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('AdminInquiriesPage: 문의 목록 조회 실패', error)
  }

  const inquiries = (data ?? []) as Inquiry[]
  const open = inquiries.filter((i) => i.status !== '완료')
  const done = inquiries.filter((i) => i.status === '완료')

  function card(inquiry: Inquiry) {
    return (
      <li key={inquiry.id} className={styles.card}>
        <div className={styles.cardHead}>
          <span className="type-label-l">{inquiry.category}</span>
          <span className={`type-body-s ${styles.meta}`}>
            {formatDateTime(inquiry.created_at)} · {inquiry.status}
          </span>
        </div>

        <p className={`type-body-s ${styles.meta}`}>조회 코드 {inquiry.access_token}</p>

        {inquiry.target_url && (
          <p className={`type-body-s ${styles.meta}`}>대상 {inquiry.target_url}</p>
        )}
        {inquiry.contact && (
          <p className={`type-body-s ${styles.meta}`}>연락처 {inquiry.contact}</p>
        )}

        <p className="type-body-m" style={{ whiteSpace: 'pre-wrap' }}>
          {inquiry.content}
        </p>

        <InquiryReplyForm
          id={inquiry.id}
          initialStatus={inquiry.status}
          initialReply={inquiry.reply}
        />
      </li>
    )
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <h1 className="type-h1">문의 관리</h1>
          <p className={`type-body-s ${styles.meta}`}>
            이메일 창구를 두지 않았으므로, 여기에 남긴 답변이 접수하신 분에게 닿는 유일한
            경로입니다. 열람·삭제 요구는 받은 날부터 10일 안에 회신해야 합니다.
          </p>

          <section className={styles.section}>
            <h2 className="type-h2">처리 중 {open.length}</h2>
            {open.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>대기 중인 문의가 없습니다.</p>
            ) : (
              <ul className={styles.list}>{open.map(card)}</ul>
            )}
          </section>

          <section className={styles.section}>
            <h2 className="type-h2">완료 {done.length}</h2>
            {done.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>완료된 문의가 없습니다.</p>
            ) : (
              <ul className={styles.list}>{done.map(card)}</ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
