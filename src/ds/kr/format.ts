// KR 입력 포맷터/검증기 (§9) — 순수 함수 코어. 모든 KR 필드 컴포넌트가 공유한다.

export const digitsOnly = (v: string) => v.replace(/\D/g, '')

/** 휴대폰: 01X-XXXX-XXXX (10자리는 01X-XXX-XXXX) */
export function formatPhone(v: string): string {
  const d = digitsOnly(v).slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function validatePhone(v: string): boolean {
  return /^01[016789]\d{7,8}$/.test(digitsOnly(v))
}

/** 주민등록번호: XXXXXX-XXXXXXX */
export function formatRrn(v: string): string {
  const d = digitsOnly(v).slice(0, 13)
  if (d.length < 7) return d
  return `${d.slice(0, 6)}-${d.slice(6)}`
}

/**
 * 주민등록번호 검증.
 * - 기본: 형식(13자리) + 생년월일 유효성 + 성별코드(1~8)
 * - checksum 옵션: 가중치 2~5 검증식. 2020-10 이후 신규 발급분에는 검증식이
 *   적용되지 않으므로 기본 false를 권장한다.
 */
export function validateRrn(v: string, opts: { checksum?: boolean } = {}): boolean {
  const d = digitsOnly(v)
  if (!/^\d{13}$/.test(d)) return false
  const mm = Number(d.slice(2, 4))
  const dd = Number(d.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false
  if (!/[1-8]/.test(d[6])) return false
  if (!opts.checksum) return true
  const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  const sum = w.reduce((acc, weight, i) => acc + weight * Number(d[i]), 0)
  return (11 - (sum % 11)) % 10 === Number(d[12])
}

/** 사업자등록번호: XXX-XX-XXXXX */
export function formatBizNo(v: string): string {
  const d = digitsOnly(v).slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/** 사업자등록번호 검증식 (국세청 공식 가중치) */
export function validateBizNo(v: string): boolean {
  const d = digitsOnly(v)
  if (!/^\d{10}$/.test(d)) return false
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = w.reduce((acc, weight, i) => acc + weight * Number(d[i]), 0)
  sum += Math.floor((Number(d[8]) * 5) / 10)
  return (10 - (sum % 10)) % 10 === Number(d[9])
}

/** 카드번호: XXXX-XXXX-XXXX-XXXX */
export function formatCardNo(v: string): string {
  const d = digitsOnly(v).slice(0, 16)
  return d.replace(/(\d{4})(?=\d)/g, '$1-')
}

/** Luhn 체크 (카드번호) */
export function luhnCheck(v: string): boolean {
  const d = digitsOnly(v)
  if (d.length < 13) return false
  let sum = 0
  let dbl = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return sum % 10 === 0
}

/** 카드 유효기간: MM/YY */
export function formatExpiry(v: string): string {
  const d = digitsOnly(v).slice(0, 4)
  if (d.length < 3) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function validateExpiry(v: string): boolean {
  const d = digitsOnly(v)
  if (d.length !== 4) return false
  const mm = Number(d.slice(0, 2))
  return mm >= 1 && mm <= 12
}

/** 차량번호: 12가3456 / 123가4567 (형식 검증만) */
export function validateVehicleNo(v: string): boolean {
  return /^\d{2,3}[가-힣]\d{4}$/.test(v.replace(/\s/g, ''))
}

/** 우편번호: 5자리 */
export function formatPostcode(v: string): string {
  return digitsOnly(v).slice(0, 5)
}
