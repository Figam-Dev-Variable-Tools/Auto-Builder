import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

export type SkeletonProps = {
  variant?: 'text' | 'block' | 'circle'
  width?: string | number
  height?: string | number
  lines?: number
}

function toSize(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 3,
}: SkeletonProps) {
  if (variant === 'text') {
    const count = Math.max(1, lines)
    return (
      <div className={styles.textGroup} style={{ width: toSize(width) }} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`${styles.bar} ${styles.text}`}
            style={{ height: toSize(height) }}
          />
        ))}
      </div>
    )
  }

  const style: CSSProperties = {
    width: toSize(width),
    height: toSize(height),
  }

  return (
    <span
      className={`${styles.bar} ${variant === 'circle' ? styles.circle : styles.block}`}
      style={style}
      aria-hidden="true"
    />
  )
}
