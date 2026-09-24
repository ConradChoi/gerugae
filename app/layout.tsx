import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '거르개',
  description: '프리랜서를 위한 원천사·에이전시 리뷰 및 정보공유 서비스',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
