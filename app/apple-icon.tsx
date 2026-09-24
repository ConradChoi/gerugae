import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// iOS 홈 화면 아이콘은 SVG를 지원하지 않아 PNG로 생성한다
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFD84D',
        }}
      >
        <svg width="126" height="113" viewBox="0 0 240 215">
          <path d="M16 2 L88 90 L16 90 Z" fill="#2A2F3A" />
          <path d="M224 2 L224 90 L152 90 Z" fill="#2A2F3A" />
          <path d="M0 0 H240 L120 215 Z" fill="#2A2F3A" />
          <path d="M46 64 H94 L70 100 Z" fill="#FFD84D" />
          <path d="M150 64 H198 L174 100 Z" fill="#FFD84D" />
        </svg>
      </div>
    ),
    size
  )
}
