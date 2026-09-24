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
        <svg width="124" height="124" viewBox="0 0 240 240">
          <g fill="#2A2F3A" stroke="#2A2F3A" strokeLinejoin="round">
            <path d="M52 20 L22 84 L82 84 Z" strokeWidth="16" />
            <path d="M188 20 L158 84 L218 84 Z" strokeWidth="16" />
            <path d="M16 78 L224 78 L120 222 Z" strokeWidth="24" />
          </g>
          <g fill="#FFD84D" stroke="#FFD84D" strokeWidth="6" strokeLinejoin="round">
            <path d="M56 116 H94 L75 148 Z" />
            <path d="M146 116 H184 L165 148 Z" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
