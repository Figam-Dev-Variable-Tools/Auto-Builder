import { useId, type KeyboardEvent, type ReactNode } from 'react'
import styles from './InputBase.module.css'

// Input 계열 공용 베이스 — 스토리 없음(인프라). §7 공통 State:
// Default/Hover/Focus/Disabled/Readonly/Required/Success/Error/Empty를 담당한다.
export type InputBaseProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'search' | 'tel'
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'search'
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  helperText?: string
  maxLength?: number
  showCounter?: boolean
  /** 인풋 좌/우 액세서리 — 아이콘, 토글 버튼, 스텝퍼 등 */
  leading?: ReactNode
  trailing?: ReactNode
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function InputBase({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  error = false,
  success = false,
  disabled = false,
  readOnly = false,
  required = false,
  helperText,
  maxLength,
  showCounter = false,
  leading,
  trailing,
  onBlur,
  onKeyDown,
}: InputBaseProps) {
  const id = useId()
  const fieldClass = [styles.field, error ? styles.error : '', success ? styles.success : '']
    .filter(Boolean)
    .join(' ')
  const wrapClass = [
    styles.inputWrap,
    disabled ? styles.disabled : '',
    readOnly ? styles.readOnly : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={fieldClass}>
      {label != null && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className={wrapClass}>
        {leading != null && <span className={styles.leading}>{leading}</span>}
        <input
          id={id}
          className={styles.input}
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          aria-invalid={error || undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {trailing != null && <span className={styles.trailing}>{trailing}</span>}
      </div>
      {(helperText != null || showCounter) && (
        <div className={styles.meta}>
          {helperText != null && <span className={styles.helper}>{helperText}</span>}
          {showCounter && maxLength != null && (
            <span className={styles.counter}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export const inputStyles = styles
