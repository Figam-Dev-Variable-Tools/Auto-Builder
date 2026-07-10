import { useId, type ReactNode } from 'react'
import styles from '../TextField/TextField.module.css'
import krStyles from './KrField.module.css'

// KR 필드 공용 베이스 — TextField와 동일한 룩(css 모듈 재사용)에 컨트롤드 value/onChange를
// 더한 내부용 컴포넌트. DS TextField의 공개 props는 Figma 매니페스트 왕복 동일성 대상이라
// 확장하지 않고 별도 베이스를 둔다(§9 전용, 매니페스트 비대상).

export type KrFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  helperText?: string
  inputMode?: 'numeric' | 'tel' | 'text'
  maxLength?: number
  /** 인풋 우측 액세서리 — 마스킹 토글, 우편번호 조회 버튼 등 */
  trailing?: ReactNode
}

export function KrField({
  label,
  value,
  onChange,
  placeholder,
  error = false,
  success = false,
  disabled = false,
  readOnly = false,
  helperText,
  inputMode = 'text',
  maxLength,
  trailing,
}: KrFieldProps) {
  const id = useId()
  const className = [styles.field, error ? styles.error : '', !error && success ? styles.success : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={trailing ? krStyles.row : undefined}>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing && <span className={krStyles.trailing}>{trailing}</span>}
      </div>
      {helperText && (
        <div className={styles.meta}>
          <span className={styles.messages}>
            <span className={styles.helperText}>{helperText}</span>
          </span>
        </div>
      )}
    </div>
  )
}
