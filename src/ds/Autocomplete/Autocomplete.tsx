import { useRef, useState } from 'react'
import { InputBase } from '../InputBase/InputBase'
import { useDismiss } from '../Select/Select'
import styles from './Autocomplete.module.css'

export type AutocompleteProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  /** 자동완성 후보 목록 */
  options: string[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  /** 검색 결과 없음 문구 */
  emptyText?: string
  /** 표시할 최대 후보 수 */
  maxSuggestions?: number
  /** 후보 선택 시 호출 */
  onSelect?: (value: string) => void
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (query === '' || index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <span className={styles.match}>{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  )
}

export function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder = '입력하여 검색',
  disabled = false,
  error = false,
  helperText,
  emptyText = '검색 결과가 없습니다.',
  maxSuggestions = 8,
  onSelect,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, () => setOpen(false))

  const suggestions =
    value === ''
      ? []
      : options
          .filter((o) => o.toLowerCase().includes(value.toLowerCase()) && o !== value)
          .slice(0, maxSuggestions)

  const pick = (option: string) => {
    onChange?.(option)
    onSelect?.(option)
    setOpen(false)
    setActive(-1)
  }

  return (
    <div ref={rootRef} className={styles.field}>
      <div className={styles.control}>
        <InputBase
          label={label}
          value={value}
          onChange={(v) => {
            onChange?.(v)
            setOpen(true)
            setActive(-1)
          }}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          helperText={helperText}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (a + 1) % suggestions.length)
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1))
            }
            if (e.key === 'Enter' && active >= 0) {
              e.preventDefault()
              pick(suggestions[active])
            }
          }}
        />
        {open && value !== '' && (
          <div className={styles.panel} role="listbox">
            {suggestions.length === 0 ? (
              <div className={styles.empty}>{emptyText}</div>
            ) : (
              suggestions.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={[styles.option, i === active ? styles.optionActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pick(option)}
                  onMouseEnter={() => setActive(i)}
                >
                  <Highlight text={option} query={value} />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
