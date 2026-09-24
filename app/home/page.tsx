import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GerugaeSymbol } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import layout from '@/components/layout/Layout.module.css'
import styles from './home.module.css'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('HomePage: failed to load profile', error)
  }

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
            <div className={styles.empty}>
              <GerugaeSymbol size={48} />
              <h3 className="type-h3">아직 등록된 후기가 없습니다</h3>
              <p className={`type-body-m ${styles.emptyDesc}`}>
                첫 후기를 남겨 주세요.{'\n'}다른 프리랜서에게 큰 도움이 됩니다.
              </p>
              <Button variant="primary">첫 후기 쓰기</Button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className="type-h2">최근 등록된 기업</h2>
            </div>
            <div className={styles.empty}>
              <p className={`type-body-m ${styles.emptyDesc}`}>
                아직 등록된 기업이 없습니다.{'\n'}함께 일한 기업을 직접 등록할 수 있습니다.
              </p>
              <Button variant="secondary">기업 등록하기</Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
