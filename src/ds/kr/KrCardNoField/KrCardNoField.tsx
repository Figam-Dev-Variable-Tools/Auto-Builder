import { KrField } from '../KrField'
import { digitsOnly, formatCardNo, luhnCheck } from '../format'

// 카드번호 — XXXX-XXXX-XXXX-XXXX 자동 포맷, 16자리 완성 시 Luhn 검증

export type KrCardNoFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}

export function KrCardNoField({ value, onChange, label = '카드번호', disabled = false }: KrCardNoFieldProps) {
  const digits = digitsOnly(value)
  const complete = digits.length === 16
  const valid = complete && luhnCheck(digits)
  const error = complete && !valid

  return (
    <KrField
      label={label}
      value={value}
      onChange={(v) => onChange(formatCardNo(v))}
      placeholder="0000-0000-0000-0000"
      inputMode="numeric"
      maxLength={19}
      disabled={disabled}
      error={error}
      success={valid}
      helperText={error ? '카드번호를 다시 확인해 주세요' : valid ? '유효한 카드번호입니다' : undefined}
    />
  )
}
