/** 신고 검토로 가려진 글에 붙인다. 가려진 글은 작성자와 운영자에게만 보인다. */
export function HiddenNotice() {
  return (
    <p
      className="type-body-s"
      style={{
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-status-error-bg)',
        color: 'var(--color-status-error-fg)',
      }}
    >
      신고 검토 결과 가려진 글입니다. 나와 운영자에게만 보입니다.
    </p>
  )
}
