import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/LogoutButton'
import styles from './Layout.module.css'

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link href="/">
        <Logo />
      </Link>
      <nav className={styles.actions}>
        <Link href="/login" className={styles.navLink}>
          로그인
        </Link>
        {/* 비로그인 상태에서는 작성 화면 대신 로그인으로 보낸다 */}
        <Link href="/login?from=review" className={styles.navLink} data-variant="primary">
          후기 작성
        </Link>
      </nav>
    </header>
  )
}

export function MemberHeader() {
  return (
    <header className={styles.header}>
      <Link href="/home">
        <Logo />
      </Link>
      <nav className={styles.actions}>
        <Link href="/companies" className={`${styles.navLink} ${styles.hideOnMobile}`}>
          기업 찾기
        </Link>
        <Link href="/mypage" className={`${styles.navLink} ${styles.hideOnMobile}`}>
          마이페이지
        </Link>
        <span className={styles.hideOnMobile}>
          <LogoutButton />
        </span>
        <span className={styles.spacer} />
        <Link href="/reviews/new" className={styles.navLink} data-variant="primary">
          후기 작성
        </Link>
      </nav>
    </header>
  )
}
