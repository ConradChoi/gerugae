import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GerugaeSymbol } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import layout from '@/components/layout/Layout.module.css'
import styles from './home.module.css'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

type RecentCompany = { id: string; name: string; category: string }

type RecentReview = {
  id: string
  rating: number
  content: string
  created_at: string
  company: { id: string; name: string } | null
  author: { nickname: string } | null
}

export default async function HomePage() {
  const { supabase, user } = await requireMember()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('HomePage: failed to load profile', error)
  }

  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, category')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, company:companies(id, name), author:profiles(nickname)')
    .order('created_at', { ascending: false })
    .limit(5)

  const companies = (companyData ?? []) as RecentCompany[]
  const reviews = (reviewData ?? []) as unknown as RecentReview[]

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <section className={styles.search}>
          <h1 className="type-h1">
            {profile?.nickname ? `${profile.nickname}님, ` : ''}어떤 기업과 일하시나요?
          </h1>
          <p className={`type-body-m ${styles.searchSub}`}>
            계약 전에 다른 프리랜서의 후기를 먼저 확인하세요
          </p>
          <form className={styles.searchBar} action="/companies">
            <label htmlFor="home-search" className="type-body-m" style={{ display: 'none' }}>
              기업 이름으로 검색
            </label>
            <input
              id="home-search"
              name="q"
              className={styles.searchInput}
              placeholder="기업 이름으로 검색"
            />
            <button type="submit" className={styles.searchButton}>
              검색
            </button>
          </form>
        </section>

        <div className={styles.body}>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className="type-h2">최근 후기</h2>
            </div>
            {reviews.length > 0 ? (
              <ul className={styles.cardList}>
                {reviews.map((review) => (
                  <li key={review.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <Link href={`/companies/${review.company?.id ?? ''}`} className="type-label-l">
                        {review.company?.name ?? '삭제된 기업'}
                      </Link>
                      <span className={`type-body-s ${styles.searchSub}`}>
                        {review.author?.nickname ?? '알 수 없음'} · {formatDate(review.created_at)}
                      </span>
                    </div>
                    <Rating value={review.rating} size={18} />
                    <p className="type-body-m">{review.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <GerugaeSymbol size={48} />
                <h3 className="type-h3">아직 등록된 후기가 없습니다</h3>
                <p className={`type-body-m ${styles.emptyDesc}`}>
                  첫 후기를 남겨 주세요.{'\n'}다른 프리랜서에게 큰 도움이 됩니다.
                </p>
                <Link href="/companies">
                  <Button variant="primary">첫 후기 쓰기</Button>
                </Link>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className="type-h2">최근 등록된 기업</h2>
              <Link href="/companies" className={`type-label-m ${styles.searchSub}`}>
                전체 보기
              </Link>
            </div>
            {companies.length > 0 ? (
              <ul className={styles.cardList}>
                {companies.map((company) => (
                  <li key={company.id}>
                    <Link href={`/companies/${company.id}`} className={styles.card}>
                      <span className="type-label-l">{company.name}</span>
                      <span className={`type-body-s ${styles.searchSub}`}>{company.category}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <p className={`type-body-m ${styles.emptyDesc}`}>
                  아직 등록된 기업이 없습니다.{'\n'}함께 일한 기업을 직접 등록할 수 있습니다.
                </p>
                <Link href="/companies/new">
                  <Button variant="secondary">기업 등록하기</Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
