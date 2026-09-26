import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../reports/admin.module.css'

export const metadata: Metadata = {
  title: '회원 · 초대 경로 · 거르개',
}

type Member = {
  id: string
  nickname: string
  created_at: string
  member_since: string | null
  inviter_nickname: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    notFound()
  }

  // profiles의 member_since/invited_by는 조회 권한이 없다. 관리자만 통과하는
  // 함수로만 열어 두었기 때문에(0007) 여기서도 함수를 통해 읽는다.
  const { data, error } = await supabase.rpc('admin_list_members', { limit_count: 200 })

  if (error) {
    console.error('AdminMembersPage: 회원 목록 조회 실패', error)
  }

  const members = (data ?? []) as unknown as Member[]
  const joined = members.filter((m) => m.member_since)
  const pending = members.filter((m) => !m.member_since)

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <h1 className="type-h1">회원 · 초대 경로</h1>
          <p className={`type-body-s ${styles.meta}`}>
            문제가 되는 글이 반복되면 초대한 사람까지 거슬러 확인할 수 있습니다.
          </p>

          <section className={styles.section}>
            <h2 className="type-h2">이용 중 {joined.length}</h2>
            <ul className={styles.list}>
              {joined.map((member) => (
                <li key={member.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <span className="type-label-l">{member.nickname}</span>
                    <span className={`type-body-s ${styles.meta}`}>
                      가입 {formatDate(member.member_since)}
                    </span>
                  </div>
                  <p className={`type-body-s ${styles.meta}`}>
                    초대한 사람: {member.inviter_nickname ?? '없음 (직접 가입 또는 운영자)'}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className="type-h2">코드 미입력 {pending.length}</h2>
            {pending.length === 0 ? (
              <p className={`type-body-m ${styles.meta}`}>
                가입만 하고 코드를 넣지 않은 계정이 없습니다.
              </p>
            ) : (
              <ul className={styles.list}>
                {pending.map((member) => (
                  <li key={member.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className="type-label-l">{member.nickname}</span>
                      <span className={`type-body-s ${styles.meta}`}>
                        계정 생성 {formatDate(member.created_at)}
                      </span>
                    </div>
                    <p className={`type-body-s ${styles.meta}`}>
                      콘텐츠를 볼 수 없는 상태입니다.
                    </p>
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
