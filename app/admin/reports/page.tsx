import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ReportActions } from '@/components/ReportActions'
import layout from '@/components/layout/Layout.module.css'
import styles from './admin.module.css'

export const metadata: Metadata = {
  title: '신고 관리 · 거르개',
}

type Report = {
  id: string
  target_type: 'review' | 'post' | 'company'
  target_id: string
  reason: string
  detail: string | null
  status: 'pending' | 'hidden' | 'kept'
  created_at: string
  reporter: { nickname: string } | null
}

const TARGET_LABEL = { review: '후기', post: '정보글', company: '기업 정보' }
const STATUS_LABEL = { pending: '검토 대기', hidden: '가림 처리됨', kept: '유지' }

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // is_admin 컬럼은 일반 사용자에게 조회 권한이 없다. 본인 여부만 함수로 확인한다.
  const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin')

  if (adminCheckError) {
    // 권한 확인 자체가 실패한 경우다. 조용히 404를 내면 원인을 알 수 없다.
    console.error('AdminReportsPage: is_admin() 호출 실패', adminCheckError, 'user:', user.id)
  }

  // 관리자가 아니면 이 화면의 존재 자체를 알리지 않는다
  if (!isAdmin) {
    notFound()
  }

  const { data: reportData } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reason, detail, status, created_at, reporter:profiles!reports_reporter_id_fkey(nickname)')
    .order('created_at', { ascending: false })
    .limit(100)

  const reports = (reportData ?? []) as unknown as Report[]
  const pending = reports.filter((r) => r.status === 'pending')
  const resolved = reports.filter((r) => r.status !== 'pending')

  function targetHref(report: Report) {
    if (report.target_type === 'post') return `/posts/${report.target_id}`
    if (report.target_type === 'company') return `/companies/${report.target_id}`
    return null
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <h1 className="type-h1">신고 관리</h1>
          <p className={`type-body-s ${styles.meta}`}>
            신고된 글은 가리기 전까지 그대로 노출됩니다. 명예훼손·허위사실 신고는 빠르게 판단해
            주세요.
          </p>

          <section className={styles.section}>
            <h2 className="type-h2">검토 대기 {pending.length}</h2>
            {pending.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>처리할 신고가 없습니다.</p>
            ) : (
              <ul className={styles.list}>
                {pending.map((report) => (
                  <li key={report.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className="type-label-l">
                        {TARGET_LABEL[report.target_type]} · {report.reason}
                      </span>
                      <span className={`type-body-s ${styles.meta}`}>
                        {report.reporter?.nickname ?? '탈퇴한 회원'} ·{' '}
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>
                    {report.detail && <p className="type-body-m">{report.detail}</p>}
                    {targetHref(report) && (
                      <Link href={targetHref(report)!} className={`type-body-s ${styles.link}`}>
                        신고된 대상 보기
                      </Link>
                    )}
                    <ReportActions
                      reportId={report.id}
                      targetType={report.target_type}
                      targetId={report.target_id}
                      adminId={user.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h2 className="type-h2">처리 완료 {resolved.length}</h2>
            {resolved.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>아직 처리한 신고가 없습니다.</p>
            ) : (
              <ul className={styles.list}>
                {resolved.map((report) => (
                  <li key={report.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className="type-label-l">
                        {TARGET_LABEL[report.target_type]} · {report.reason}
                      </span>
                      <span className={`type-body-s ${styles.meta}`}>
                        {STATUS_LABEL[report.status]}
                      </span>
                    </div>
                    {targetHref(report) && (
                      <Link href={targetHref(report)!} className={`type-body-s ${styles.link}`}>
                        대상 보기
                      </Link>
                    )}
                    <ReportActions
                      reportId={report.id}
                      targetType={report.target_type}
                      targetId={report.target_id}
                      adminId={user.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
