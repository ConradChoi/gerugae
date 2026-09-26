import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NicknameForm } from '@/components/NicknameForm'
import { InviteCodePanel } from '@/components/InviteCodePanel'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import layout from '@/components/layout/Layout.module.css'
import styles from './mypage.module.css'

export const metadata: Metadata = {
  title: '마이페이지 · 거르개',
}

type MyReview = {
  id: string
  rating: number
  content: string
  created_at: string
  hidden_at: string | null
  company: { id: string; name: string } | null
}

type MyPost = {
  id: string
  title: string
  created_at: string
  hidden_at: string | null
  company: { id: string; name: string } | null
}

function HiddenNotice() {
  return (
    <p
      className="type-body-s"
      style={{
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-status-error-bg)',
        color: 'var(--color-status-error-fg)',
      }}
    >
      신고 검토 결과 가려진 글입니다. 나와 운영자에게만 보입니다.
    </p>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function MyPage() {
  const { supabase, user } = await requireMember()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .maybeSingle()

  const { data: codeData } = await supabase
    .from('invite_codes')
    .select('code, max_uses, used_count, expires_at')
    .eq('issuer_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  const activeCode = (codeData ?? []).find((c) => c.used_count < c.max_uses) ?? null

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, hidden_at, company:companies(id, name)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const { data: postData } = await supabase
    .from('community_posts')
    .select('id, title, created_at, hidden_at, company:companies(id, name)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewData ?? []) as unknown as MyReview[]
  const posts = (postData ?? []) as unknown as MyPost[]

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <h1 className="type-h1">마이페이지</h1>

          <section className={styles.panel}>
            <h2 className="type-h3">내 정보</h2>
            <p className={`type-body-s ${styles.meta}`}>이메일 {user.email}</p>
            <NicknameForm userId={user.id} initialNickname={profile?.nickname ?? ''} />
          </section>

          <section className={styles.panel}>
            <h2 className="type-h3">초대하기</h2>
            <p className={`type-body-s ${styles.meta}`}>
              거르개는 초대받은 분만 이용할 수 있습니다. 함께 쓰면 좋을 프리랜서에게 코드를 전달해
              주세요.
            </p>
            <InviteCodePanel initialCode={activeCode} />
          </section>

          <section className={styles.section}>
            <h2 className="type-h2">내 후기 {reviews.length}</h2>
            {reviews.length === 0 ? (
              <div className={styles.empty}>
                <p className={`type-body-m ${styles.meta}`}>아직 작성한 후기가 없습니다.</p>
                <Link href="/companies">
                  <Button variant="secondary">기업 찾기</Button>
                </Link>
              </div>
            ) : (
              <ul className={styles.list}>
                {reviews.map((review) => (
                  <li key={review.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <Link href={`/companies/${review.company?.id ?? ''}`} className="type-label-l">
                        {review.company?.name ?? '삭제된 기업'}
                      </Link>
                      <span className={`type-body-s ${styles.meta}`}>
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.hidden_at && <HiddenNotice />}
                    <Rating value={review.rating} size={18} />
                    <p className="type-body-m">{review.content}</p>
                    <div className={styles.actions}>
                      <Link href={`/reviews/${review.id}/edit`}>
                        <Button variant="secondary">수정</Button>
                      </Link>
                      <DeleteButton
                        table="reviews"
                        id={review.id}
                        title="이 후기를 삭제할까요?"
                        description="삭제하면 되돌릴 수 없습니다. 기업 평균 별점에서도 제외됩니다."
                        redirectTo="/mypage"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h2 className="type-h2">내 정보글 {posts.length}</h2>
            {posts.length === 0 ? (
              <div className={styles.empty}>
                <p className={`type-body-m ${styles.meta}`}>아직 작성한 정보글이 없습니다.</p>
              </div>
            ) : (
              <ul className={styles.list}>
                {posts.map((post) => (
                  <li key={post.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <Link href={`/posts/${post.id}`} className="type-label-l">
                        {post.title}
                      </Link>
                      <span className={`type-body-s ${styles.meta}`}>
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    {post.hidden_at && <HiddenNotice />}
                    <p className={`type-body-s ${styles.meta}`}>
                      {post.company?.name ?? '삭제된 기업'}
                    </p>
                    <div className={styles.actions}>
                      <Link href={`/posts/${post.id}/edit`}>
                        <Button variant="secondary">수정</Button>
                      </Link>
                      <DeleteButton
                        table="community_posts"
                        id={post.id}
                        title="이 글을 삭제할까요?"
                        description="삭제하면 되돌릴 수 없습니다."
                        redirectTo="/mypage"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className="type-h3">회원 탈퇴</h2>
            <p className={`type-body-s ${styles.meta}`}>
              탈퇴해도 지금까지 쓰신 후기와 정보글은 남습니다. 지우고 싶은 글이 있다면 먼저 삭제해
              주세요.
            </p>
            <Link href="/mypage/withdraw">
              <Button variant="secondary">탈퇴 안내 보기</Button>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
