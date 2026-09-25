import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireMember } from '@/lib/membership'
import { ReviewForm, type TagOption } from '@/components/ReviewForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../../auth.module.css'

export const metadata: Metadata = {
  title: '후기 수정 · 거르개',
}

type ReviewRow = {
  id: string
  rating: number
  content: string
  author_id: string
  company: { id: string; name: string; category: string } | null
  review_tags: { tag_id: string }[]
}

export default async function EditReviewPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireMember()

  const { data } = await supabase
    .from('reviews')
    .select('id, rating, content, author_id, company:companies(id, name, category), review_tags(tag_id)')
    .eq('id', params.id)
    .maybeSingle()

  const review = data as unknown as ReviewRow | null

  if (!review || !review.company) {
    notFound()
  }

  // RLS가 남의 후기 수정을 막지만, 화면에서도 미리 막아 혼선을 줄인다
  if (review.author_id !== user.id) {
    redirect(`/companies/${review.company.id}`)
  }

  const { data: tagData } = await supabase
    .from('tags')
    .select('id, label')
    .order('sort_order', { ascending: true })

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">후기 수정</h1>
            <div className={styles.notice}>
              <p className="type-label-m">후기를 남긴 기업</p>
              <p className="type-h3">{review.company.name}</p>
              <p className={`type-body-s ${styles.noticeBody}`}>{review.company.category}</p>
            </div>
            <ReviewForm
              companyId={review.company.id}
              companyName={review.company.name}
              tags={(tagData ?? []) as TagOption[]}
              reviewId={review.id}
              initialRating={review.rating}
              initialContent={review.content}
              initialTagIds={review.review_tags.map((rt) => rt.tag_id)}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
