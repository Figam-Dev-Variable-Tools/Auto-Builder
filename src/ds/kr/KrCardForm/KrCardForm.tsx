import { useId, useState } from 'react'
import { Button } from '../../Button/Button'
import { Radio } from '../../Radio/Radio'
import { Toggle } from '../../Toggle/Toggle'
import { KrField } from '../KrField'
import { digitsOnly, luhnCheck, validateExpiry } from '../format'
import { KrCardNoField } from '../KrCardNoField/KrCardNoField'
import { KrExpiryField } from '../KrExpiryField/KrExpiryField'
import { KrCvcField } from '../KrCvcField/KrCvcField'
import styles from './KrCardForm.module.css'

// 카드 등록 폼 — KR 카드 필드 조합 데모. 새 프리미티브 없이 조립만 한다.

export type KrCardFormValues = {
  cardNo: string
  expiry: string
  cvc: string
  owner: string
  cashReceipt: boolean
  cashReceiptType: 'phone' | 'biz'
}

export type KrCardFormProps = {
  onSubmit?: (values: KrCardFormValues) => void
  disabled?: boolean
}

export function KrCardForm({ onSubmit, disabled = false }: KrCardFormProps) {
  const radioName = useId()
  const [cardNo, setCardNo] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [owner, setOwner] = useState('')
  const [cashReceipt, setCashReceipt] = useState(false)
  const [cashReceiptType, setCashReceiptType] = useState<'phone' | 'biz'>('phone')
  const [submitted, setSubmitted] = useState(false)

  const cardDigits = digitsOnly(cardNo)
  const canSubmit =
    !disabled &&
    !submitted &&
    cardDigits.length === 16 &&
    luhnCheck(cardDigits) &&
    validateExpiry(expiry) &&
    cvc.length === 3 &&
    owner.trim() !== ''

  function handleSubmit() {
    onSubmit?.({ cardNo, expiry, cvc, owner, cashReceipt, cashReceiptType })
    setSubmitted(true)
  }

  return (
    <div className={styles.form}>
      <KrCardNoField value={cardNo} onChange={setCardNo} disabled={disabled} />
      <div className={styles.row2}>
        <KrExpiryField value={expiry} onChange={setExpiry} disabled={disabled} />
        <KrCvcField value={cvc} onChange={setCvc} disabled={disabled} />
      </div>
      <KrField
        label="소유자명"
        value={owner}
        onChange={setOwner}
        placeholder="카드에 표기된 이름"
        disabled={disabled}
      />
      <div className={styles.receipt}>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>현금영수증</span>
          <Toggle checked={cashReceipt} onChange={setCashReceipt} disabled={disabled} size="sm" />
        </div>
        {cashReceipt && (
          <Radio
            name={radioName}
            value={cashReceiptType}
            onChange={(v) => setCashReceiptType(v as 'phone' | 'biz')}
            options={[
              { value: 'phone', label: '휴대폰', disabled },
              { value: 'biz', label: '사업자', disabled },
            ]}
          />
        )}
      </div>
      {/* DS Button은 onClick을 노출하지 않아(매니페스트 공개 props 고정) 래퍼에서 클릭 처리 */}
      <span className={styles.submit} onClick={canSubmit ? handleSubmit : undefined}>
        <Button
          variant="primary"
          size="md"
          label={submitted ? '등록 완료' : '카드 등록'}
          disabled={!canSubmit}
        />
      </span>
      {submitted && <p className={styles.done}>카드가 등록되었습니다</p>}
    </div>
  )
}
