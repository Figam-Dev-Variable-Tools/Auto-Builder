import { useState } from 'react'
import styles from './Rating.module.css'

export type RatingProps = {
  value?: number
  max?: number
  size?: 'sm' | 'md'
  readOnly?: boolean
  onChange?: (value: number) => void
}

const STAR_PATH =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

function StarIcon() {
  return (
    <svg className={styles.svg} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} />
    </svg>
  )
}

function clampFraction(display: number, index: number): number {
  // index is 1-based; returns 0…1 fill for this star.
  return Math.max(0, Math.min(1, display - (index - 1)))
}

export function Rating({
  value = 3,
  max = 5,
  size = 'md',
  readOnly = false,
  onChange,
}: RatingProps) {
  const [current, setCurrent] = useState(value)
  const [hover, setHover] = useState<number | null>(null)

  const display = hover ?? current
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  const commit = (next: number) => {
    setCurrent(next)
    onChange?.(next)
  }

  const className = [styles.rating, styles[size], readOnly ? styles.readOnly : styles.interactive]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      role={readOnly ? 'img' : 'slider'}
      aria-label={`Rating ${display} of ${max}`}
      aria-valuenow={readOnly ? undefined : current}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : max}
      onMouseLeave={readOnly ? undefined : () => setHover(null)}
    >
      {stars.map((index) => {
        const fraction = clampFraction(display, index)
        return (
          <span key={index} className={styles.star}>
            <span className={styles.empty}>
              <StarIcon />
            </span>
            <span className={styles.filled} style={{ width: `${fraction * 100}%` }}>
              <StarIcon />
            </span>
            {!readOnly && (
              <>
                <button
                  type="button"
                  className={`${styles.hit} ${styles.hitLeft}`}
                  aria-label={`${index - 0.5} stars`}
                  onMouseEnter={() => setHover(index - 0.5)}
                  onFocus={() => setHover(index - 0.5)}
                  onClick={() => commit(index - 0.5)}
                />
                <button
                  type="button"
                  className={`${styles.hit} ${styles.hitRight}`}
                  aria-label={`${index} stars`}
                  onMouseEnter={() => setHover(index)}
                  onFocus={() => setHover(index)}
                  onClick={() => commit(index)}
                />
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
