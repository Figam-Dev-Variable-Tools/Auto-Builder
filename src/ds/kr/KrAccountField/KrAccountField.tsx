import { KrField } from '../KrField'
import { digitsOnly } from '../format'

// 계좌번호 — 은행별 자릿수/구분 방식이 상이하므로 고정 그룹핑 없이 숫자만 받는다 (최대 14자리).

export type KrAccountFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  error?: boolean
  success?: boolean
  helperText?: string
}

export function KrAccountField({
  value,
  onChange,
  label = '계좌번호',
  disabled = false,
  error = false,
  success = false,
  helperText = '숫자만 입력하세요',
}: KrAccountFieldProps) {
  return (
    <KrField
      label={label}
      value={value}
      onChange={(v) => onChange(digitsOnly(v).slice(0, 14))}
      placeholder="계좌번호 입력"
      inputMode="numeric"
      maxLength={14}
      disabled={disabled}
      error={error}
      success={success}
      helperText={helperText}
    />
  )
}
