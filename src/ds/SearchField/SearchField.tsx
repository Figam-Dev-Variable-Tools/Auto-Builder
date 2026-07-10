import { InputBase, inputStyles } from '../InputBase/InputBase'

export type SearchFieldProps = {
  label?: string
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Enter 입력 시 호출 */
  onSearch?: (value: string) => void
  /** 값이 있을 때 지우기(×) 버튼 표시 (기본 표시) */
  showClear?: boolean
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder = '검색어를 입력하세요',
  disabled = false,
  onSearch,
  showClear = true,
}: SearchFieldProps) {
  return (
    <InputBase
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type="search"
      inputMode="search"
      disabled={disabled}
      leading={<SearchIcon />}
      trailing={
        showClear && value !== '' ? (
          <button
            type="button"
            className={inputStyles.iconButton}
            aria-label="지우기"
            disabled={disabled}
            onClick={() => onChange?.('')}
          >
            ×
          </button>
        ) : undefined
      }
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSearch?.(value)
      }}
    />
  )
}
