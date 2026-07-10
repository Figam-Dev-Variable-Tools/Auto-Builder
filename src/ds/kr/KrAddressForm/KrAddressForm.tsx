import { useId, useState } from 'react'
import { Tab } from '../../Tab/Tab'
import { KrField } from '../KrField'
import { KrPostcodeSearch } from '../KrPostcodeSearch/KrPostcodeSearch'
import type { KrAddress } from '../addressData'
import styles from './KrAddressForm.module.css'

// 주소 입력 composite — 우편번호 조회(mock) + 도로명/지번(자동 입력, 탭 전환) + 상세주소 +
// 선택형 배송 요청사항. 값은 컨트롤드, 도로명/지번 표시 전환만 내부 상태로 둔다.

export const KR_ADDRESS_REQUESTS = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '배송 전 연락주세요',
  '직접 입력',
] as const

const CUSTOM_REQUEST = '직접 입력'

export type KrAddressFormValue = {
  postcode: string
  road: string
  jibun: string
  detail: string
  /** 배송 요청사항 ('' = 미선택) */
  request: string
  /** '직접 입력' 선택 시 내용 */
  requestNote: string
}

export const EMPTY_KR_ADDRESS: KrAddressFormValue = {
  postcode: '',
  road: '',
  jibun: '',
  detail: '',
  request: '',
  requestNote: '',
}

export type KrAddressFormProps = {
  value: KrAddressFormValue
  onChange: (value: KrAddressFormValue) => void
  /** 배송 요청사항 select 노출 */
  withRequest?: boolean
  /** 상세주소 필수 미입력 에러 */
  detailError?: boolean
  disabled?: boolean
}

export function KrAddressForm({
  value,
  onChange,
  withRequest = false,
  detailError = false,
  disabled = false,
}: KrAddressFormProps) {
  const [mode, setMode] = useState<'road' | 'jibun'>('road')
  const requestId = useId()

  const patch = (partial: Partial<KrAddressFormValue>) => onChange({ ...value, ...partial })

  function handleSelect(address: KrAddress) {
    patch({ postcode: address.postcode, road: address.road, jibun: address.jibun })
  }

  return (
    <div className={styles.form}>
      <KrPostcodeSearch postcode={value.postcode} onSelect={handleSelect} disabled={disabled} />
      <div className={styles.addressGroup}>
        <Tab
          items={[
            { value: 'road', label: '도로명' },
            { value: 'jibun', label: '지번' },
          ]}
          value={mode}
          onChange={(next) => setMode(next as 'road' | 'jibun')}
          variant="segmented"
          size="sm"
        />
        <KrField
          label={mode === 'road' ? '도로명 주소' : '지번 주소'}
          value={mode === 'road' ? value.road : value.jibun}
          onChange={() => {}}
          readOnly
          disabled={disabled}
          placeholder="우편번호 조회 후 자동 입력됩니다"
        />
      </div>
      <KrField
        label="상세주소"
        value={value.detail}
        onChange={(next) => patch({ detail: next })}
        placeholder="동/호수 등 상세주소 입력"
        disabled={disabled}
        error={detailError}
        helperText={detailError ? '상세주소를 입력해주세요' : undefined}
      />
      {withRequest && (
        <div className={styles.requestField}>
          <label className={styles.label} htmlFor={requestId}>
            배송 요청사항
          </label>
          <select
            id={requestId}
            className={styles.select}
            value={value.request}
            disabled={disabled}
            onChange={(event) =>
              patch({
                request: event.target.value,
                requestNote: event.target.value === CUSTOM_REQUEST ? value.requestNote : '',
              })
            }
          >
            <option value="">선택해주세요</option>
            {KR_ADDRESS_REQUESTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {value.request === CUSTOM_REQUEST && (
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="요청사항을 입력해주세요"
              value={value.requestNote}
              disabled={disabled}
              onChange={(event) => patch({ requestNote: event.target.value })}
            />
          )}
        </div>
      )}
    </div>
  )
}
