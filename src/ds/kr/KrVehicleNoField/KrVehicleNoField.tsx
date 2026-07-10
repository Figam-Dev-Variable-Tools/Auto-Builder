import { useState } from 'react'
import { KrField } from '../KrField'
import { validateVehicleNo } from '../format'

export type KrVehicleNoFieldProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  /** 블러 또는 자릿수 완성 시 정상·에러 상태 자동 표시 */
  validate?: boolean
  placeholder?: string
  disabled?: boolean
}

export function KrVehicleNoField({
  label = '차량번호',
  value,
  onChange,
  validate = true,
  placeholder = '12가3456',
  disabled = false,
}: KrVehicleNoFieldProps) {
  const [touched, setTouched] = useState(false)

  const valid = validateVehicleNo(value)
  const complete = valid || value.replace(/\s/g, '').length >= 8
  const showStatus = validate && !disabled && value.trim().length > 0 && (touched || complete)
  const error = showStatus && !valid
  const success = showStatus && valid

  return (
    <div onBlur={() => setTouched(true)}>
      <KrField
        label={label}
        value={value}
        onChange={(next) => onChange?.(next)}
        placeholder={placeholder}
        maxLength={9}
        disabled={disabled}
        error={error}
        success={success}
        helperText={error ? '차량번호 형식이 아닙니다' : success ? '올바른 형식입니다' : undefined}
      />
    </div>
  )
}
