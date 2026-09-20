import type { Metadata } from 'next'
import { SignupForm } from '@/components/SignupForm'

export const metadata: Metadata = {
  title: '회원가입 | 거르개',
}

export default function SignupPage() {
  return (
    <main>
      <h1>회원가입</h1>
      <SignupForm />
    </main>
  )
}
