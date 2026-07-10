import { useRef } from 'react'
import styles from './OtpField.module.css'

export type OtpFieldProps = {
  label?: string
  /** 입력된 숫자 문자열 (최대 length 자리) */
  value: string
  onChange?: (value: string) => void
  /** 자릿수 (기본 6) */
  length?: number
  error?: boolean
  disabled?: boolean
  helperText?: string
  /** 모든 자리 입력 완료 시 호출 */
  onComplete?: (value: string) => void
}

export function OtpField({
  label = '인증번호',
  value,
  onChange,
  length = 6,
  error = false,
  disabled = false,
  helperText,
  onComplete,
}: OtpFieldProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const update = (next: string) => {
    const clipped = next.replace(/\D/g, '').slice(0, length)
    onChange?.(clipped)
    if (clipped.length === length) onComplete?.(clipped)
  }

  const handleChange = (index: number, char: string) => {
    const digits = char.replace(/\D/g, '')
    if (digits === '') return
    const chars = value.split('')
    // 붙여넣기(여러 자리) 지원 — 현재 칸부터 채운다
    for (let i = 0; i < digits.length && index + i < length; i++) {
      chars[index + i] = digits[i]
    }
    update(chars.join(''))
    const nextIndex = Math.min(index + digits.length, length - 1)
    refs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const chars = value.split('')
      if (chars[index]) {
        chars[index] = ''
        update(chars.join('').replace(/\s+$/, ''))
      } else if (index > 0) {
        chars[index - 1] = ''
        update(chars.join('').replace(/\s+$/, ''))
        refs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
  }

  return (
    <div className={[styles.field, error ? styles.error : ''].filter(Boolean).join(' ')}>
      {label != null && <span className={styles.label}>{label}</span>}
      <div className={styles.cells} role="group" aria-label={label}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            className={[styles.cell, value[i] ? styles.filled : ''].filter(Boolean).join(' ')}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            value={value[i] ?? ''}
            disabled={disabled}
            aria-label={`${i + 1}번째 자리`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      {helperText != null && <span className={styles.helper}>{helperText}</span>}
    </div>
  )
}
