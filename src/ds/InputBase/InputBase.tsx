import { useId, type KeyboardEvent, type ReactNode } from 'react'
import styles from './InputBase.module.css'

// Input 계열 공용 베이스 — §7 공통 State:
// Default/Hover/Focus/Disabled/Readonly/Required/Success/Error/Empty를 담당한다.
export type InputBaseProps = {
  label?: string
  /**
   * 눈에 보이는 라벨이 없을 때의 접근성 이름(placeholder는 이름이 아니다).
   * 툴바 안 검색 입력처럼 라벨을 그릴 자리가 없는 자리를 위해 연다 — 주지 않으면 붙지 않는다.
   * label을 생략하면 라벨 자리 자체가 렌더되지 않는다(빈 공간이 남지 않는다) — WithoutLabel 스토리 참조.
   */
  ariaLabel?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'search' | 'tel'
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'search'
  /** 박스 크기 3단 — TextField와 같은 스케일을 쓴다(값은 InputBase.module.css에 한 곳만 선언). 기본 md */
  size?: 'sm' | 'md' | 'lg'
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  helperText?: string
  maxLength?: number
  showCounter?: boolean
  /**
   * 인풋 좌/우 액세서리 — 아이콘, 토글 버튼, 스텝퍼 등.
   * Figma에서는 INSTANCE_SWAP(leading/trailing)으로 미러링된다 — 이름을 그대로 속성명으로 쓴다.
   */
  leading?: ReactNode
  trailing?: ReactNode
  /**
   * true면 필드가 부모(폼 그리드의 열)를 꽉 채운다 — 기본 320px 상한을 푼다.
   * 세로로 쌓는 단독 폼은 상한이 있어야 줄이 길어지지 않지만, 2열 폼 그리드에서는 열이 폭을 정한다.
   */
  fullWidth?: boolean
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function InputBase({
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  size = 'md',
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
  fullWidth = false,
  onBlur,
  onKeyDown,
}: InputBaseProps) {
  const id = useId()
  const fieldClass = [
    styles.field,
    size !== 'md' ? styles[size] : '',
    error ? styles.error : '',
    success ? styles.success : '',
    fullWidth ? styles.fullWidth : '',
  ]
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
          aria-label={ariaLabel}
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
