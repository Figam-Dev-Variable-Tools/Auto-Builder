import { InputBase } from '../InputBase/InputBase'
import { digitsOnly } from '../kr/format'

export type CurrencyFieldProps = {
  label?: string
  /** 숫자만 담긴 문자열 (예: "1500000") — 표시할 때 천단위 콤마 포맷 */
  value: string
  onChange?: (digits: string) => void
  /** 우측 통화 단위 표기 */
  currency?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  helperText?: string
  /** 최대 금액 — 초과 입력 차단 */
  max?: number
}

const formatComma = (digits: string) =>
  digits === '' ? '' : Number(digits).toLocaleString('ko-KR')

export function CurrencyField({
  label = '금액',
  value,
  onChange,
  currency = '원',
  placeholder = '0',
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  max,
}: CurrencyFieldProps) {
  return (
    <InputBase
      label={label}
      value={formatComma(value)}
      onChange={(text) => {
        const digits = digitsOnly(text)
        if (digits === '') {
          onChange?.('')
          return
        }
        if (max != null && Number(digits) > max) return
        onChange?.(String(Number(digits)))
      }}
      placeholder={placeholder}
      inputMode="numeric"
      disabled={disabled}
      readOnly={readOnly}
      error={error}
      helperText={helperText}
      trailing={<span>{currency}</span>}
    />
  )
}
