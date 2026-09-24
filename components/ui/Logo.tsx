type SymbolProps = {
  size?: number
  className?: string
}

export function GerugaeSymbol({ size = 28, className }: SymbolProps) {
  const height = Math.round((size * 215) / 240)
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 240 215"
      fill="none"
      role="img"
      aria-label="거르개"
      className={className}
    >
      <path d="M16 2 L88 90 L16 90 Z" fill="currentColor" />
      <path d="M224 2 L224 90 L152 90 Z" fill="currentColor" />
      <path d="M0 0 H240 L120 215 Z" fill="currentColor" />
      <path d="M46 64 H94 L70 100 Z" fill="var(--color-brand-accent)" />
      <path d="M150 64 H198 L174 100 Z" fill="var(--color-brand-accent)" />
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
