import Link from 'next/link'
import styles from './Layout.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className="type-body-s">
        게시물은 작성자 개인 의견이며, 본 서비스는 게시물 내용에 대해 법적 책임을 지지 않습니다.
      </p>
      <p className={`type-body-s ${styles.footerLinks}`}>
        <Link href="/terms">이용약관</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy">개인정보처리방침</Link>
      </p>
      <p className={`type-caption ${styles.copyright}`}>© 2026 거르개</p>
    </footer>
  )
}
