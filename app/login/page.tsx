import type { Metadata } from 'next'
import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = {
  title: '로그인 | 거르개',
}

export default function LoginPage() {
  return (
    <main>
      <h1>로그인</h1>
      <LoginForm />
    </main>
  )
}
