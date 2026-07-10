import { useState } from 'react'
import { InputBase, inputStyles } from '../InputBase/InputBase'

export type PasswordFieldProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  helperText?: string
  maxLength?: number
  /** 표시/숨김 토글 버튼 (기본 표시) */
  showToggle?: boolean
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="4" y1="20" x2="20" y2="4" />}
    </svg>
  )
}

export function PasswordField({
  label = '비밀번호',
  value,
  onChange,
  placeholder = '비밀번호를 입력하세요',
  error = false,
  success = false,
  disabled = false,
  readOnly = false,
  required = false,
  helperText,
  maxLength,
  showToggle = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputBase
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={visible ? 'text' : 'password'}
      error={error}
      success={success}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      helperText={helperText}
      maxLength={maxLength}
      trailing={
        showToggle ? (
          <button
            type="button"
            className={inputStyles.iconButton}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
          >
            <EyeIcon off={visible} />
          </button>
        ) : undefined
      }
    />
  )
}
