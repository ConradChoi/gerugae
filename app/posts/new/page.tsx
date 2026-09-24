import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/PostForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '정보글 쓰기 · 거르개',
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: { company?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: company } = searchParams.company
    ? await supabase
        .from('companies')
        .select('id, name, category')
        .eq('id', searchParams.company)
        .maybeSingle()
    : { data: null }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">정보글 쓰기</h1>
            <p className={`type-body-s ${styles.intro}`}>
              후기가 아닌 계약 팁, 질문, 경험 공유를 남기는 공간입니다.
            </p>

            {company ? (
              <>
                <div className={styles.notice}>
                  <p className="type-label-m">어떤 기업에 대한 글인가요</p>
                  <p className="type-h3">{company.name}</p>
                  <p className={`type-body-s ${styles.noticeBody}`}>{company.category}</p>
                </div>
                <PostForm companyId={company.id} />
              </>
            ) : (
              <>
                <p className={`type-body-s ${styles.intro}`}>
                  먼저 기업을 선택해 주세요. 기업 페이지의 정보공유 탭에서 글쓰기를 누르면 이
                  화면으로 돌아옵니다.
                </p>
                <Link href="/companies">
                  <Button variant="primary" fullWidth>
                    기업 찾기
                  </Button>
                </Link>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
