import Link from 'next/link'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GerugaeSymbol } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import layout from '@/components/layout/Layout.module.css'
import styles from './page.module.css'

const FEATURES = [
  {
    title: '실제 거래 후기',
    desc: '대금 지급, 소통, 계약 이행까지\n함께 일해본 사람이 남긴 기록',
  },
  {
    title: '카테고리로 빠르게',
    desc: '대금지연·갑질·정산정확 같은\n태그로 한눈에 파악',
  },
  {
    title: '회원만 열람',
    desc: '외부에 공개되지 않는\n프리랜서끼리의 공간',
  },
]

export default function LandingPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <section className={styles.hero}>
          <GerugaeSymbol size={72} />
          <h1 className="type-display">거를 곳은 거르고 일하자</h1>
          <p className={`type-body-l ${styles.heroText}`}>
            프리랜서가 함께 일한 원천사·에이전시의 실제 후기를 모았습니다. 계약 전에 먼저
            확인하세요.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/signup">
              <Button variant="primary">가입하고 리뷰 보기</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">로그인</Button>
            </Link>
          </div>
          <p className={`type-body-s ${styles.accessNote}`}>
            가입한 회원만 리뷰를 열람할 수 있습니다.
          </p>
        </section>

        <section className={styles.features}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <h2 className="type-h3">{feature.title}</h2>
              <p className={`type-body-m ${styles.featureDesc}`}>{feature.desc}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
