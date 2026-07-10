import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { KrField } from '../KrField'
import { searchAddresses, type KrAddress } from '../addressData'
import styles from './KrAddressAutocomplete.module.css'

// 주소 자동완성 — 입력값으로 SAMPLE_ADDRESSES를 필터해 드롭다운으로 제안한다.
// 방향키/Enter 선택, Escape·바깥 클릭 닫기. 실제 서비스에서는 주소 검색 API 연동 지점.

export type KrAddressAutocompleteProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  /** 항목 선택 시 전체 주소(우편번호/도로명/지번) 전달 */
  onSelect?: (address: KrAddress) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export function KrAddressAutocomplete({
  label = '주소',
  value,
  onChange,
  onSelect,
  placeholder = '도로명, 지번, 건물명으로 검색',
  disabled = false,
  error = false,
  helperText,
}: KrAddressAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const query = value.trim()
  const results = query ? searchAddresses(query) : []
  const visible = open && results.length > 0

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function onDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // 활성 항목이 보이도록 스크롤
  useEffect(() => {
    if (active < 0) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function handleChange(next: string) {
    onChange(next)
    setOpen(true)
    setActive(-1)
  }

  function select(address: KrAddress) {
    onChange(address.road)
    onSelect?.(address)
    setOpen(false)
    setActive(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!visible) {
      if (event.key === 'ArrowDown' && results.length > 0) {
        setOpen(true)
        event.preventDefault()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      setActive((index) => (index + 1) % results.length)
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      setActive((index) => (index - 1 + results.length) % results.length)
      event.preventDefault()
    } else if (event.key === 'Enter') {
      if (active >= 0) {
        select(results[active])
        event.preventDefault()
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className={styles.wrap} onKeyDown={handleKeyDown}>
      <KrField
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
      />
      {visible && (
        <ul ref={listRef} role="listbox" aria-label="주소 검색 결과" className={styles.listbox}>
          {results.map((address, index) => (
            <li
              key={`${address.postcode}-${address.road}`}
              role="option"
              aria-selected={index === active}
              className={[styles.option, index === active ? styles.active : ''].filter(Boolean).join(' ')}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(address)}
            >
              <span className={styles.road}>{address.road}</span>
              <span className={styles.meta}>
                {address.postcode} · 지번 {address.jibun}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
