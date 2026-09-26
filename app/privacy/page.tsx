import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { PublicHeader } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import layout from '@/components/layout/Layout.module.css'

export const metadata: Metadata = {
  title: '개인정보처리방침 · 거르개',
}

export default function PrivacyPage() {
  return (
    <div className={layout.page}>
      <PublicHeader />
      <main className={layout.main}>
        <LegalDocument file="privacy-policy.md" title="개인정보처리방침" />
      </main>
      <Footer />
    </div>
  )
}
