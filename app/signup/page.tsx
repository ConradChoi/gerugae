import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/SignupForm'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: '회원가입 · 거르개',
}

export default function SignupPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <div className={styles.wrap}>
          <section className={styles.card}>
            <h1 className="type-h1">회원가입</h1>
            <p className={`type-body-s ${styles.intro}`}>
              이메일과 비밀번호만 있으면 됩니다. 실명이나 연락처는 받지 않습니다.
            </p>
            <SignupForm />
            <div className={styles.notice}>
              <p className="type-label-m">가입 전 확인해 주세요</p>
              <p className={`type-body-s ${styles.noticeBody}`}>
                이곳의 게시물은 작성자 개인 의견이며, 더 나은 계약 환경을 만들기 위한 공간입니다.
                본 서비스는 게시물 내용에 대해 법적 책임을 지지 않습니다.
              </p>
            </div>
            <p className={`type-body-s ${styles.altLink}`}>
              이미 계정이 있으신가요? <Link href="/login">로그인</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
