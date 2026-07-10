import { digitsOnly, formatBizNo, validateBizNo } from '../format'
import { KrField } from '../KrField'

// 사업자등록번호 필드 — 123-45-67890 자동 포맷, 10자리 완성 시 국세청 검증식 체크

export type KrBizNoFieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  helperText?: string
}

export function KrBizNoField({
  label = '사업자등록번호',
  value,
  onChange,
  disabled = false,
  helperText = '숫자 10자리를 입력하세요',
}: KrBizNoFieldProps) {
  const complete = digitsOnly(value).length === 10
  const valid = complete && validateBizNo(value)
  const invalid = complete && !valid

  return (
    <KrField
      label={label}
      value={value}
      onChange={(next) => onChange(formatBizNo(next))}
      placeholder="123-45-67890"
      inputMode="numeric"
      maxLength={12}
      disabled={disabled}
      error={invalid}
      success={valid}
      helperText={invalid ? '유효하지 않은 사업자등록번호입니다' : valid ? '확인되었습니다' : helperText}
    />
  )
}
