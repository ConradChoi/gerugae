import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { GerugaeSymbol } from '@/components/ui/Logo'
import layout from '@/components/layout/Layout.module.css'
import styles from './companies.module.css'

export const metadata: Metadata = {
  title: '기업 찾기 · 거르개',
}

type Company = {
  id: string
  name: string
  category: string
  created_at: string
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const { supabase } = await requireMember()

  const query = (searchParams.q ?? '').trim()

  let companies: Company[] = []
  let loadError = false

  const base = supabase.from('companies').select('id, name, category, created_at')
  const filtered = query ? base.ilike('name', `%${query}%`) : base
  const { data, error } = await filtered.order('created_at', { ascending: false }).limit(20)

  if (error) {
    console.error('CompaniesPage: failed to load companies', error)
    loadError = true
  } else {
    companies = data ?? []
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.body}>
          <h1 className="type-h1">기업 찾기</h1>

          <form className={styles.searchBar} action="/companies">
            <label htmlFor="company-search" style={{ display: 'none' }}>
              기업 이름으로 검색
            </label>
            <input
              id="company-search"
              name="q"
              defaultValue={query}
              className={styles.searchInput}
              placeholder="기업 이름으로 검색"
            />
            <button type="submit" className={styles.searchButton}>
              검색
            </button>
          </form>

          {loadError ? (
            <div className={styles.empty}>
              <h2 className="type-h3">목록을 불러오지 못했습니다</h2>
              <p className={`type-body-m ${styles.emptyDesc}`}>
                잠시 후 다시 시도해 주세요.
              </p>
            </div>
          ) : companies.length > 0 ? (
            <>
              <div className={styles.resultHead}>
                <h2 className="type-h3">
                  {query ? `검색 결과 ${companies.length}곳` : `최근 등록된 기업 ${companies.length}곳`}
                </h2>
              </div>
              <ul className={styles.list}>
                {companies.map((company) => (
                  <li key={company.id}>
                    <Link href={`/companies/${company.id}`} className={styles.card}>
                      <span className="type-h3">{company.name}</span>
                      <span className={`type-body-s ${styles.meta}`}>{company.category}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className={styles.notice}>
                <p className="type-label-l">찾는 기업이 목록에 없나요?</p>
                <p className={`type-body-s ${styles.emptyDesc}`}>
                  직접 등록하고 첫 후기를 남길 수 있습니다.
                </p>
                <Link href="/companies/new">
                  <Button variant="secondary">기업 등록하기</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <GerugaeSymbol size={48} />
              <h2 className="type-h3">
                {query ? '검색 결과가 없습니다' : '아직 등록된 기업이 없습니다'}
              </h2>
              <p className={`type-body-m ${styles.emptyDesc}`}>
                {query
                  ? '이름 일부만 넣어 다시 검색해 보세요.\n목록에 없다면 직접 등록할 수 있습니다.'
                  : '함께 일한 기업을 직접 등록할 수 있습니다.'}
              </p>
              <Link href={`/companies/new${query ? `?name=${encodeURIComponent(query)}` : ''}`}>
                <Button variant="primary">기업 등록하기</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
