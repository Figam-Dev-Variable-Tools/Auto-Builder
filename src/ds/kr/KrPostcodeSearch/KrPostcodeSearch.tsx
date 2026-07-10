import { useEffect, useRef, useState } from 'react'
import buttonStyles from '../../Button/Button.module.css'
import fieldStyles from '../../TextField/TextField.module.css'
import { KrField } from '../KrField'
import { formatPostcode } from '../format'
import { searchAddresses, type KrAddress } from '../addressData'
import styles from './KrPostcodeSearch.module.css'

// 우편번호 조회 — 실제 서비스에서는 카카오(다음) 우편번호 서비스(Postcode embed)를 여는 연동
// 지점이다. 이 컴포넌트는 동일한 UX(조회 버튼 → 검색 패널 → 선택 시 자동 입력)를 내장 샘플
// 데이터로 재현한 mock으로, select 핸들러 시그니처를 실제 연동 시에도 그대로 유지할 수 있다.

export type KrPostcodeSearchProps = {
  label?: string
  /** 우편번호 5자리 — 조회 결과로만 채워진다(직접 입력 불가) */
  postcode: string
  onSelect: (address: KrAddress) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export function KrPostcodeSearch({
  label = '우편번호',
  postcode,
  onSelect,
  disabled = false,
  error = false,
  helperText,
}: KrPostcodeSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // 패널 밖 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function onDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const results = searchAddresses(query)

  function select(address: KrAddress) {
    onSelect(address)
    setOpen(false)
    setQuery('')
  }

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <KrField
        label={label}
        value={formatPostcode(postcode)}
        onChange={() => {}}
        readOnly
        placeholder="00000"
        disabled={disabled}
        error={error}
        helperText={helperText}
        trailing={
          // DS Button은 onClick 미지원(매니페스트 왕복 대상)이라 동일 스타일을 로컬 버튼에 적용
          <button
            type="button"
            className={[buttonStyles.button, buttonStyles.secondary, buttonStyles.md].join(' ')}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            우편번호 조회
          </button>
        }
      />
      {open && (
        <div role="dialog" aria-label="우편번호 검색" className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>우편번호 검색</span>
            <button type="button" className={styles.close} aria-label="닫기" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <input
            ref={searchRef}
            className={[fieldStyles.input, styles.search].join(' ')}
            placeholder="도로명, 지번, 건물명으로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {results.length > 0 ? (
            <ul className={styles.list}>
              {results.map((address) => (
                <li key={`${address.postcode}-${address.road}`}>
                  <button type="button" className={styles.item} onClick={() => select(address)}>
                    <span className={styles.itemRoad}>
                      <b className={styles.itemPostcode}>{address.postcode}</b> {address.road}
                    </span>
                    <span className={styles.itemJibun}>
                      지번 {address.jibun}
                      {address.building ? ` · ${address.building}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>검색 결과가 없습니다</p>
          )}
        </div>
      )}
    </div>
  )
}
