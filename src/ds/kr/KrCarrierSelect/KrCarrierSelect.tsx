import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './KrCarrierSelect.module.css'

export const CARRIERS = ['SKT', 'KT', 'LG U+', 'SKT 알뜰폰', 'KT 알뜰폰', 'LG U+ 알뜰폰'] as const

export type Carrier = (typeof CARRIERS)[number]

export type KrCarrierSelectProps = {
  value: string
  onChange?: (value: Carrier) => void
  disabled?: boolean
}

export function KrCarrierSelect({ value, onChange, disabled = false }: KrCarrierSelectProps) {
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // 방향키로 선택 이동 (라디오 그룹 관례)
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    const index = CARRIERS.findIndex((c) => c === value)
    const next = CARRIERS[(index + (forward ? 1 : -1) + CARRIERS.length) % CARRIERS.length]
    onChange?.(next)
    pillRefs.current[next]?.focus()
    event.preventDefault()
  }

  return (
    <div role="radiogroup" aria-label="통신사 선택" className={styles.group} onKeyDown={handleKeyDown}>
      {CARRIERS.map((carrier) => {
        const selected = carrier === value
        return (
          <button
            key={carrier}
            ref={(el) => {
              pillRefs.current[carrier] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={[styles.pill, selected ? styles.selected : ''].filter(Boolean).join(' ')}
            onClick={() => onChange?.(carrier)}
          >
            {carrier}
          </button>
        )
      })}
    </div>
  )
}
