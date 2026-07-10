import { useState } from 'react'
import { InputBase } from '../InputBase/InputBase'

export type EmailFieldProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  /** 블러 시 형식 검증 → 정상·에러 상태 자동 표시 (기본 켜짐) */
  validate?: boolean
  onValidChange?: (valid: boolean) => void
  disabled?: boolean
  required?: boolean
  helperText?: string
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function EmailField({
  label = '이메일',
  value,
  onChange,
  placeholder = 'name@example.com',
  validate = true,
  onValidChange,
  disabled = false,
  required = false,
  helperText,
}: EmailFieldProps) {
  const [touched, setTouched] = useState(false)

  const valid = EMAIL_RE.test(value)
  const showError = validate && touched && value !== '' && !valid
  const showSuccess = validate && touched && valid

  return (
    <InputBase
      label={label}
      value={value}
      onChange={(v) => {
        onChange?.(v)
        if (validate && touched) onValidChange?.(EMAIL_RE.test(v))
      }}
      placeholder={placeholder}
      type="email"
      inputMode="email"
      error={showError}
      success={showSuccess}
      disabled={disabled}
      required={required}
      helperText={showError ? '이메일 형식이 올바르지 않습니다.' : helperText}
      onBlur={() => {
        setTouched(true)
        if (validate) onValidChange?.(valid)
      }}
    />
  )
}
