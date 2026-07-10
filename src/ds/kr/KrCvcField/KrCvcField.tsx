import { useState } from 'react'
import { KrField } from '../KrField'
import { digitsOnly } from '../format'
import styles from './KrCvcField.module.css'

// CVC — 숫자 3자리, 기본 마스킹(●●●) 표시 + 트레일링 눈 아이콘으로 표시 토글

export type KrCvcFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
}

const eyeIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const eyeOffIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export function KrCvcField({
  value,
  onChange,
  label = 'CVC',
  disabled = false,
  error = false,
  helperText = '카드 뒷면 3자리',
}: KrCvcFieldProps) {
  const [masked, setMasked] = useState(true)
  const display = masked ? '●'.repeat(value.length) : value

  // 마스킹 중 편집 — ●는 기존 자릿값에 위치 매핑하고 새로 입력된 숫자만 반영
  function handleChange(next: string) {
    if (!masked) {
      onChange(digitsOnly(next).slice(0, 3))
      return
    }
    let out = ''
    let i = 0
    for (const ch of next) {
      if (ch === '●') {
        out += value[i] ?? ''
        i += 1
      } else if (/\d/.test(ch)) {
        out += ch
      }
    }
    onChange(out.slice(0, 3))
  }

  return (
    <KrField
      label={label}
      value={display}
      onChange={handleChange}
      placeholder="●●●"
      inputMode="numeric"
      maxLength={3}
      disabled={disabled}
      error={error}
      helperText={helperText}
      trailing={
        <button
          type="button"
          className={styles.eye}
          aria-label={masked ? 'CVC 표시' : 'CVC 숨기기'}
          aria-pressed={!masked}
          disabled={disabled}
          onClick={() => setMasked((m) => !m)}
        >
          {masked ? eyeIcon : eyeOffIcon}
        </button>
      }
    />
  )
}
