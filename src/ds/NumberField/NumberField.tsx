import { useState } from 'react'
import { InputBase, inputStyles } from '../InputBase/InputBase'

export type NumberFieldProps = {
  label?: string
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** 값 우측에 표시할 단위 (예: 개, %) */
  unit?: string
  disabled?: boolean
  readOnly?: boolean
  helperText?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  readOnly = false,
  helperText,
}: NumberFieldProps) {
  // 입력 중간 상태('', '-', '1.') 허용을 위한 드래프트 — 블러/스텝퍼에서 확정
  const [draft, setDraft] = useState<string | null>(null)

  const clamp = (n: number) => {
    let out = n
    if (min != null) out = Math.max(min, out)
    if (max != null) out = Math.min(max, out)
    return out
  }
  const commit = (n: number) => {
    onChange?.(clamp(n))
    setDraft(null)
  }
  const stepBy = (dir: 1 | -1) => commit(value + dir * step)

  const atMin = min != null && value <= min
  const atMax = max != null && value >= max

  return (
    <InputBase
      label={label}
      value={draft ?? String(value)}
      onChange={(text) => {
        setDraft(text)
        const parsed = Number(text)
        if (text !== '' && !Number.isNaN(parsed)) onChange?.(clamp(parsed))
      }}
      inputMode="numeric"
      disabled={disabled}
      readOnly={readOnly}
      helperText={helperText}
      onBlur={() => {
        const parsed = Number(draft)
        commit(draft == null || draft === '' || Number.isNaN(parsed) ? value : parsed)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          stepBy(1)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          stepBy(-1)
        }
      }}
      trailing={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {unit != null && <span>{unit}</span>}
          <button
            type="button"
            className={inputStyles.iconButton}
            aria-label="감소"
            disabled={disabled || readOnly || atMin}
            onClick={() => stepBy(-1)}
          >
            −
          </button>
          <button
            type="button"
            className={inputStyles.iconButton}
            aria-label="증가"
            disabled={disabled || readOnly || atMax}
            onClick={() => stepBy(1)}
          >
            +
          </button>
        </span>
      }
    />
  )
}
