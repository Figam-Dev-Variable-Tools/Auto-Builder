import { KrField } from '../KrField'
import { digitsOnly, formatExpiry, validateExpiry } from '../format'

// 카드 유효기간 — MM/YY 자동 포맷, 4자리 완성 시 월 범위 검증

export type KrExpiryFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}

export function KrExpiryField({ value, onChange, label = '유효기간', disabled = false }: KrExpiryFieldProps) {
  const digits = digitsOnly(value)
  const complete = digits.length === 4
  const valid = complete && validateExpiry(digits)
  const error = complete && !valid

  return (
    <KrField
      label={label}
      value={value}
      onChange={(v) => onChange(formatExpiry(v))}
      placeholder="MM/YY"
      inputMode="numeric"
      maxLength={5}
      disabled={disabled}
      error={error}
      success={valid}
      helperText={error ? '유효기간이 올바르지 않습니다' : undefined}
    />
  )
}
