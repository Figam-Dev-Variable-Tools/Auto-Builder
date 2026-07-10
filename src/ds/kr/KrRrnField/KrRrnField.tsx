import { useState } from 'react'
import { KrField } from '../KrField'
import { digitsOnly, formatRrn, validateRrn } from '../format'
import styles from './KrRrnField.module.css'

export type KrRrnFieldProps = {
  label?: string
  /** 원본 숫자만 보관 (최대 13자리) — 표시용 마스킹은 내부에서 처리한다 */
  value: string
  onChange?: (value: string) => void
  /** 외국인등록번호 모드 — 레이블·문구만 변경, 형식은 동일 */
  foreigner?: boolean
  /** 블러 또는 13자리 완성 시 정상·에러 상태 자동 표시 */
  validate?: boolean
  placeholder?: string
  disabled?: boolean
}

const MASK = '●'

export function KrRrnField({
  label,
  value,
  onChange,
  foreigner = false,
  validate = true,
  placeholder = '000000-0000000',
  disabled = false,
}: KrRrnFieldProps) {
  const [touched, setTouched] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const noun = foreigner ? '외국인등록번호' : '주민등록번호'
  const digits = digitsOnly(value).slice(0, 13)
  const back = digits.slice(6)

  // 뒷자리는 성별코드 1자리만 노출, 나머지 6자리는 마스킹
  const display = revealed
    ? formatRrn(digits)
    : back
      ? `${digits.slice(0, 6)}-${back[0]}${MASK.repeat(back.length - 1)}`
      : digits

  function handleChange(next: string) {
    // 마스킹 문자를 기존 뒷자리 숫자로 복원하며 파싱
    const hidden = digits.slice(7)
    let h = 0
    let out = ''
    for (const ch of next) {
      if (ch >= '0' && ch <= '9') out += ch
      else if (ch === MASK && h < hidden.length) out += hidden[h++]
    }
    let d = out.slice(0, 13)
    // 하이픈만 지운 경우 앞의 숫자까지 함께 삭제
    if (next.length < display.length && d === digits) d = d.slice(0, -1)
    onChange?.(d)
  }

  const complete = digits.length === 13
  const valid = validateRrn(digits)
  const showStatus = validate && !disabled && digits.length > 0 && (touched || complete)
  const error = showStatus && !valid
  const success = showStatus && valid

  return (
    <div onBlur={() => setTouched(true)}>
      <KrField
        label={label ?? noun}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={14}
        disabled={disabled}
        error={error}
        success={success}
        helperText={error ? `${noun} 형식이 아닙니다` : success ? '올바른 형식입니다' : undefined}
        trailing={
          <button
            type="button"
            className={styles.eyeBtn}
            aria-label={revealed ? `${noun} 숨기기` : `${noun} 표시`}
            aria-pressed={revealed}
            disabled={disabled}
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.4 20.4 0 0 1-3.22 4.35" />
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            )}
          </button>
        }
      />
    </div>
  )
}
