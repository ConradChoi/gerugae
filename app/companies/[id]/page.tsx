import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import layout from '@/components/layout/Layout.module.css'
import styles from './detail.module.css'

const ALERT_TAGS = ['대금지연', '갑질/부당대우', '계약불이행', '소통미흡']
const POSITIVE_TAGS = ['정산정확', '재계약의사']

type ReviewRow = {
  id: string
  rating: number
  content: string
  created_at: string
  author: { nickname: string } | null
  review_tags: { tag: { label: string } | null }[]
}

function tagClass(label: string) {
  if (ALERT_TAGS.includes(label)) return `${styles.tag} ${styles.tagAlert}`
  if (POSITIVE_TAGS.includes(label)) return `${styles.tag} ${styles.tagPositive}`
  return styles.tag
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

type PostRow = {
  id: string
  title: string
  created_at: string
  author: { nickname: string } | null
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, category, biz_reg_number')
    .eq('id', params.id)
    .maybeSingle()

  if (!company) {
    notFound()
  }

  const { data: reviewData, error } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, author:profiles(nickname), review_tags(tag:tags(label))')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('CompanyDetailPage: failed to load reviews', error)
  }

  const reviews = (reviewData ?? []) as unknown as ReviewRow[]
  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const tagCounts = new Map<string, number>()
  reviews.forEach((review) => {
    review.review_tags.forEach((rt) => {
      const label = rt.tag?.label
      if (!label) return
      tagCounts.set(label, (tagCounts.get(label) ?? 0) + 1)
    })
  })
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const activeTab = searchParams.tab === 'posts' ? 'posts' : 'reviews'

  const { data: postData, count: postCount } = await supabase
    .from('community_posts')
    .select('id, title, created_at, author:profiles(nickname)', { count: 'exact' })
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (postData ?? []) as unknown as PostRow[]

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <section className={styles.summary}>
          <div className={styles.inner}>
            <h1 className="type-h1">{company.name}</h1>
            <p className={`type-body-s ${styles.meta}`}>
              {company.category}
              {company.biz_reg_number ? ` · 사업자번호 ${company.biz_reg_number}` : ''}
            </p>
            <div className={styles.scoreRow}>
              {reviews.length > 0 ? (
                <>
                  <Rating value={average} />
                  <span className={`type-body-s ${styles.meta}`}>후기 {reviews.length}개</span>
                </>
              ) : (
                <span className={`type-body-s ${styles.meta}`}>아직 후기가 없습니다</span>
              )}
            </div>
            {topTags.length > 0 && (
              <div className={styles.tagRow}>
                {topTags.map(([label, count]) => (
                  <span key={label} className={tagClass(label)}>
                    {label} {count}
                  </span>
                ))}
              </div>
            )}
            <div>
              <Link href={`/reviews/new?company=${company.id}`}>
                <Button variant="primary">이 기업 후기 쓰기</Button>
              </Link>
            </div>
          </div>
        </section>

        <nav className={styles.tabs}>
          <Link
            href={`/companies/${company.id}`}
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
          >
            후기 {reviews.length}
          </Link>
          <Link
            href={`/companies/${company.id}?tab=posts`}
            className={`${styles.tab} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          >
            정보공유 {postCount ?? 0}
          </Link>
        </nav>

        {activeTab === 'posts' ? (
          <div className={styles.list}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={`/posts/new?company=${company.id}`}>
                <Button variant="secondary">정보글 쓰기</Button>
              </Link>
            </div>
            {posts.length > 0 ? (
              <ul className={styles.list} style={{ padding: 0 }}>
                {posts.map((post) => (
                  <li key={post.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <Link href={`/posts/${post.id}`} className="type-label-l">
                        {post.title}
                      </Link>
                      <span className={`type-body-s ${styles.author}`}>
                        {post.author?.nickname ?? '알 수 없음'} · {formatDate(post.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <h2 className="type-h3">아직 정보글이 없습니다</h2>
                <p className={`type-body-m ${styles.emptyDesc}`}>
                  이 기업과 일하며 알게 된 점을 나눠 주세요.
                </p>
                <Link href={`/posts/new?company=${company.id}`}>
                  <Button variant="primary">정보글 쓰기</Button>
                </Link>
              </div>
            )}
          </div>
        ) : reviews.length > 0 ? (
          <ul className={styles.list}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <Rating value={review.rating} size={18} />
                  <span className={`type-body-s ${styles.author}`}>
                    {review.author?.nickname ?? '알 수 없음'} · {formatDate(review.created_at)}
                  </span>
                </div>
                {review.review_tags.length > 0 && (
                  <div className={styles.tagRow}>
                    {review.review_tags.map((rt) =>
                      rt.tag ? (
                        <span key={rt.tag.label} className={tagClass(rt.tag.label)}>
                          {rt.tag.label}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
                <p className="type-body-m">{review.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.list}>
            <div className={styles.empty}>
              <h2 className="type-h3">아직 후기가 없습니다</h2>
              <p className={`type-body-m ${styles.emptyDesc}`}>
                이 기업과 일해보셨다면 첫 후기를 남겨 주세요.{'\n'}다른 프리랜서에게 큰 도움이 됩니다.
              </p>
              <Link href={`/reviews/new?company=${company.id}`}>
                <Button variant="primary">첫 후기 쓰기</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
