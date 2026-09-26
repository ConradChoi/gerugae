import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'

export const metadata: Metadata = {
  title: '이용약관 · 거르개',
}

export default function TermsPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <LegalDocument file="terms.md" title="이용약관" />
      </main>
      <Footer />
    </div>
  )
}
