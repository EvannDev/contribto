import type { CSSProperties } from 'react'

interface LogoProps {
  iconSize?: number
  className?: string
  style?: CSSProperties
}

export function Logo({ iconSize = 18, className, style }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1, ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={iconSize} height={iconSize} style={{ display: 'block', flexShrink: 0 }} />
      <span>Contrib<span style={{ color: 'var(--accent-fg)' }}>.to</span></span>
    </span>
  )
}
