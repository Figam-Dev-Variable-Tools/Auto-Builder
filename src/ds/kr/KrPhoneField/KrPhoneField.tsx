import { useEffect, useRef, useState } from 'react'
import { KrField } from '../KrField'
import { digitsOnly, formatPhone, validatePhone } from '../format'

export type KrPhoneFieldProps = {
  label?: string
  /** 하이픈 포함 표시값 — formatPhone 결과를 그대로 보관한다 */
  value: string
  onChange?: (value: string) => void
  /** 블러 또는 자릿수 완성 시 정상·에러 상태 자동 표시 */
  validate?: boolean
  onValidChange?: (valid: boolean) => void
  placeholder?: string
  disabled?: boolean
}

export function KrPhoneField({
  label = '휴대폰 번호',
  value,
  onChange,
  validate = true,
  onValidChange,
  placeholder = '010-0000-0000',
  disabled = false,
}: KrPhoneFieldProps) {
  const [touched, setTouched] = useState(false)
  const digits = digitsOnly(value)
  const complete = digits.length >= 10
  const valid = validatePhone(value)

  const prevValid = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevValid.current === valid) return
    prevValid.current = valid
    onValidChange?.(valid)
  }, [valid, onValidChange])

  function handleChange(next: string) {
    let d = digitsOnly(next)
    // 하이픈만 지운 경우 앞의 숫자까지 함께 삭제
    if (next.length < value.length && d === digits) d = d.slice(0, -1)
    onChange?.(formatPhone(d))
  }

  const showStatus = validate && !disabled && digits.length > 0 && (touched || complete)
  const error = showStatus && !valid
  const success = showStatus && valid

  return (
    <div onBlur={() => setTouched(true)}>
      <KrField
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="tel"
        maxLength={13}
        disabled={disabled}
        error={error}
        success={success}
        helperText={
          error
            ? '휴대폰 번호 형식이 아닙니다'
            : success
              ? '인증번호를 받을 수 있는 번호입니다'
              : undefined
        }
      />
    </div>
  )
}
