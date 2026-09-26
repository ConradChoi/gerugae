import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { WithdrawForm } from '@/components/WithdrawForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '회원 탈퇴 · 거르개',
}

export default async function WithdrawPage() {
  const { supabase, user } = await requireMember()

  const [{ count: reviewCount }, { count: postCount }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
    supabase
      .from('community_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
  ])

  const reviews = reviewCount ?? 0
  const posts = postCount ?? 0
  const hasContent = reviews + posts > 0

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 640 }}>
            <h1 className="type-h2">회원 탈퇴</h1>
            <p className={`type-body-s ${styles.intro}`}>
              탈퇴하면 아래 내용이 적용됩니다. 되돌릴 수 없습니다.
            </p>

            <ul className="type-body-m" style={{ paddingLeft: '1.2em', marginBottom: 'var(--spacing-lg)' }}>
              {hasContent ? (
                <li style={{ marginBottom: 'var(--spacing-2xs)' }}>
                  지금까지 쓰신 <strong>후기 {reviews}개</strong>와{' '}
                  <strong>정보글 {posts}개</strong>는 <strong>삭제되지 않고 남습니다.</strong> 작성자
                  표시만 &ldquo;탈퇴한 회원&rdquo;으로 바뀌며,{' '}
                  <strong>이후에는 본인도 수정하거나 삭제할 수 없습니다.</strong>
                </li>
              ) : (
                <li style={{ marginBottom: 'var(--spacing-2xs)' }}>
                  작성하신 후기와 정보글이 없습니다.
                </li>
              )}
              <li style={{ marginBottom: 'var(--spacing-2xs)' }}>
                계정 정보(이메일, 닉네임)는 삭제됩니다.
              </li>
              <li style={{ marginBottom: 'var(--spacing-2xs)' }}>
                발급하신 초대 코드는 사라지며, 아직 쓰지 않은 코드도 쓸 수 없게 됩니다.
              </li>
              <li>같은 이메일로 다시 가입할 수 있지만, 이전에 쓴 글과 연결되지는 않습니다.</li>
            </ul>

            {hasContent && (
              <p className={`type-body-s ${styles.intro}`}>
                지우고 싶은 글이 있다면 <Link href="/mypage">마이페이지</Link>에서 먼저 삭제한 뒤
                탈퇴해 주세요.
              </p>
            )}

            <WithdrawForm />

            <p className={`type-body-s ${styles.altLink}`}>
              <Link href="/mypage">돌아가기</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
