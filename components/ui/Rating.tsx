function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 L15 9 L22.5 9.5 L16.8 14.3 L18.6 21.6 L12 17.6 L5.4 21.6 L7.2 14.3 L1.5 9.5 L9 9 Z"
        fill={filled ? 'var(--color-rating-filled)' : 'var(--color-rating-empty)'}
      />
    </svg>
  )
}

/** 별점은 색만으로 판단하지 않도록 숫자를 함께 노출한다 */
export function Rating({ value, size = 20 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 10) / 10
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
      aria-label={`5점 만점에 ${rounded}점`}
    >
      <span style={{ display: 'inline-flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} filled={n <= Math.round(value)} size={size} />
        ))}
      </span>
      <span className="type-body-m" style={{ fontWeight: 600 }}>
        {rounded.toFixed(1)}
      </span>
    </span>
  )
}
