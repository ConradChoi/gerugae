import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { ReportButton } from '@/components/ReportButton'
import layout from '@/components/layout/Layout.module.css'
import styles from './post.module.css'

type PostRow = {
  id: string
  title: string
  content: string
  created_at: string
  author_id: string
  author: { nickname: string } | null
  company: { id: string; name: string; category: string } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('community_posts')
    .select(
      'id, title, content, created_at, author_id, author:profiles(nickname), company:companies(id, name, category)'
    )
    .eq('id', params.id)
    .maybeSingle()

  const post = data as unknown as PostRow | null

  if (!post) {
    notFound()
  }

  const isOwner = post.author_id === user.id

  return (
    <div className={layout.page}>
      <MemberHeader />
      <main className={layout.main}>
        <article className={styles.body}>
          {post.company && (
            <Link href={`/companies/${post.company.id}?tab=posts`} className={styles.companyLink}>
              {post.company.name} · {post.company.category}
            </Link>
          )}
          <h1 className="type-h1">{post.title}</h1>
          <p className={`type-body-s ${styles.meta}`}>
            {post.author?.nickname ?? '알 수 없음'} · {formatDate(post.created_at)}
          </p>
          <p className={`type-body-l ${styles.content}`}>{post.content}</p>

          <div className={styles.actions}>
            {isOwner ? (
              <>
                <Link href={`/posts/${post.id}/edit`}>
                  <Button variant="secondary">수정</Button>
                </Link>
                <DeleteButton
                  table="community_posts"
                  id={post.id}
                  title="이 글을 삭제할까요?"
                  description="삭제하면 되돌릴 수 없습니다."
                  redirectTo={post.company ? `/companies/${post.company.id}?tab=posts` : '/mypage'}
                />
              </>
            ) : (
              <ReportButton targetType="post" targetId={post.id} />
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
