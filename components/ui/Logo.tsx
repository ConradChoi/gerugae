type SymbolProps = {
  size?: number
  className?: string
}

/**
 * 귀(위) → 머리(귀 밑동을 덮음) → 눈 순서로 겹쳐 그린다.
 * 모서리 둥글기는 같은 색 stroke + linejoin=round로 표현한다.
 */
export function GerugaeSymbol({ size = 28, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      role="img"
      aria-label="거르개"
      className={className}
    >
      <g fill="currentColor" stroke="currentColor" strokeLinejoin="round">
        <path d="M52 20 L22 84 L82 84 Z" strokeWidth="16" />
        <path d="M188 20 L158 84 L218 84 Z" strokeWidth="16" />
        <path d="M16 78 L224 78 L120 222 Z" strokeWidth="24" />
      </g>
      <g
        fill="var(--color-brand-accent, #FFD84D)"
        stroke="var(--color-brand-accent, #FFD84D)"
        strokeWidth="6"
        strokeLinejoin="round"
      >
        <path d="M56 116 H94 L75 148 Z" />
        <path d="M146 116 H184 L165 148 Z" />
      </g>
    </svg>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        color: 'var(--color-text-primary)',
      }}
    >
      <GerugaeSymbol size={size} />
      <span className="type-h3">거르개</span>
    </span>
  )
}
