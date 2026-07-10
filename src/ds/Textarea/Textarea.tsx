import { useId, useRef } from 'react'
import styles from './Textarea.module.css'

export type TextareaProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  showCounter?: boolean
  /** 내용에 맞춰 높이 자동 조절 (기본 켜짐) */
  autoResize?: boolean
  error?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  helperText?: string
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  showCounter = false,
  autoResize = true,
  error = false,
  disabled = false,
  readOnly = false,
  required = false,
  helperText,
}: TextareaProps) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = ref.current
    if (!el || !autoResize) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div className={[styles.field, error ? styles.error : ''].filter(Boolean).join(' ')}>
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
      <textarea
        id={id}
        ref={ref}
        className={[styles.textarea, autoResize ? styles.autoResize : ''].filter(Boolean).join(' ')}
        value={value}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={error || undefined}
        onChange={(e) => {
          onChange?.(e.target.value)
          resize()
        }}
      />
      {(helperText != null || (showCounter && maxLength != null)) && (
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
