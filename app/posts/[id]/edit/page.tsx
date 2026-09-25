import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireMember } from '@/lib/membership'
import { PostForm } from '@/components/PostForm'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../../../auth.module.css'

export const metadata: Metadata = {
  title: '정보글 수정 · 거르개',
}

type PostRow = {
  id: string
  title: string
  content: string
  author_id: string
  company: { id: string; name: string } | null
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireMember()

  const { data } = await supabase
    .from('community_posts')
    .select('id, title, content, author_id, company:companies(id, name)')
    .eq('id', params.id)
    .maybeSingle()

  const post = data as unknown as PostRow | null

  if (!post) {
    notFound()
  }

  // RLS가 남의 글 수정을 막지만, 화면에서도 미리 막아 혼선을 줄인다
  if (post.author_id !== user.id) {
    redirect(`/posts/${post.id}`)
  }

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card} style={{ maxWidth: 720 }}>
            <h1 className="type-h2">정보글 수정</h1>
            {post.company && (
              <p className={`type-body-s ${styles.intro}`}>{post.company.name}</p>
            )}
            <PostForm
              companyId={post.company?.id ?? ''}
              postId={post.id}
              initialTitle={post.title}
              initialContent={post.content}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
