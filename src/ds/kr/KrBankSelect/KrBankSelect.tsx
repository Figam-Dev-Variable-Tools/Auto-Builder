import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import fieldStyles from '../../TextField/TextField.module.css'
import styles from './KrBankSelect.module.css'

// 은행 선택 — 검색 가능한 셀렉트. 트리거는 KrField 룩(TextField css 재사용),
// 패널이 열리면 타이핑으로 목록을 필터링한다.

export const KR_BANKS = [
  'KB국민',
  '신한',
  '우리',
  '하나',
  'NH농협',
  'IBK기업',
  'SC제일',
  '씨티',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '새마을금고',
  '신협',
  '우체국',
  '수협',
  '대구',
  '부산',
  '광주',
  '전북',
  '경남',
  '제주',
] as const

export type KrBankSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

export function KrBankSelect({ value, onChange, disabled = false, label = '은행' }: KrBankSelectProps) {
  const id = useId()
  const listId = `${id}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  const filtered = KR_BANKS.filter((bank) => bank.toLowerCase().includes(query.trim().toLowerCase()))
  const hi = Math.min(highlight, Math.max(0, filtered.length - 1))
  const activeId = open && filtered.length > 0 ? `${id}-opt-${hi}` : undefined

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // 하이라이트 항목을 패널 스크롤 안으로 유지
  useEffect(() => {
    if (!activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  function openPanel() {
    if (disabled || open) return
    setQuery('')
    setHighlight(Math.max(0, KR_BANKS.findIndex((bank) => bank === value)))
    setOpen(true)
  }

  function select(bank: string) {
    onChange(bank)
    setOpen(false)
  }

  function handleInput(next: string) {
    if (!open) {
      // 닫힌 상태에서 타이핑하면 열면서 새로 입력된 부분만 검색어로 사용
      setQuery(next.startsWith(value) ? next.slice(value.length) : next)
      setHighlight(0)
      setOpen(true)
      return
    }
    setQuery(next)
    setHighlight(0)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        openPanel()
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlight(Math.min(hi + 1, filtered.length - 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setHighlight(Math.max(hi - 1, 0))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (filtered[hi]) select(filtered[hi])
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setOpen(false)
      e.preventDefault()
    }
  }

  return (
    <div ref={rootRef} className={fieldStyles.field}>
      <label className={fieldStyles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={[fieldStyles.input, styles.trigger].join(' ')}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          placeholder="은행을 선택하세요"
          autoComplete="off"
          value={open ? query : value}
          disabled={disabled}
          onFocus={openPanel}
          onClick={openPanel}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <svg
          className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open && (
          <ul id={listId} className={styles.panel} role="listbox" aria-label={label}>
            {filtered.map((bank, index) => (
              <li
                key={bank}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={bank === value}
                className={[
                  styles.option,
                  index === hi ? styles.active : '',
                  bank === value ? styles.selected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => select(bank)}
              >
                {bank}
              </li>
            ))}
            {filtered.length === 0 && <li className={styles.empty}>검색 결과가 없습니다</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
