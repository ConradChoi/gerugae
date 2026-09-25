import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/membership'
import { ReviewForm, type TagOption } from '@/components/ReviewForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../auth.module.css'

export const metadata: Metadata = {
  title: '후기 쓰기 · 거르개',
}

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: { company?: string }
}) {
  const { supabase } = await requireMember()

  const companyId = searchParams.company

  const { data: company } = companyId
    ? await supabase
        .from('companies')
        .select('id, name, category')
        .eq('id', companyId)
        .maybeSingle()
    : { data: null }

  const { data: tagData } = await supabase
    .from('tags')
    .select('id, label')
    .order('sort_order', { ascending: true })

  const tags = (tagData ?? []) as TagOption[]

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">후기 쓰기</h1>

            {company ? (
              <>
                <p className={`type-body-s ${styles.intro}`}>
                  한 기업에는 후기를 하나만 남길 수 있고, 나중에 수정할 수 있습니다.
                </p>
                <div className={styles.notice}>
                  <p className="type-label-m">후기를 남길 기업</p>
                  <p className="type-h3">{company.name}</p>
                  <p className={`type-body-s ${styles.noticeBody}`}>{company.category}</p>
                </div>
                <ReviewForm companyId={company.id} companyName={company.name} tags={tags} />
              </>
            ) : (
              <>
                <p className={`type-body-s ${styles.intro}`}>
                  먼저 후기를 남길 기업을 찾아 주세요. 기업 페이지에서 후기 쓰기를 누르면 이 화면으로
                  돌아옵니다.
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
