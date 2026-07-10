import { useEffect, useRef, useState } from 'react'
import styles from './Select.module.css'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = {
  label?: string
  value: string | null
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** 드롭다운 외부 클릭/Escape 닫기 공용 훅 — Select/MultiSelect/Autocomplete에서 재사용 */
export function useDismiss(ref: React.RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, onDismiss])
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  error = false,
  helperText,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, () => setOpen(false))

  const selected = options.find((o) => o.value === value) ?? null
  const fieldClass = [
    styles.field,
    open ? styles.open : '',
    error ? styles.error : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className={fieldClass}>
      {label != null && <span className={styles.label}>{label}</span>}
      <div className={styles.control}>
        <button
          type="button"
          className={styles.trigger}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {selected ? (
            <span>{selected.label}</span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
          <span className={styles.chevron}>
            <Chevron />
          </span>
        </button>
        {open && (
          <div className={styles.panel} role="listbox">
            {options.map((option) => {
            const isSelected = option.value === value
            const optionClass = [
              styles.option,
              isSelected ? styles.optionSelected : '',
              option.disabled ? styles.optionDisabled : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={optionClass}
                disabled={option.disabled}
                onClick={() => {
                  onChange?.(option.value)
                  setOpen(false)
                }}
              >
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className={styles.check}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {helperText != null && <span className={styles.helper}>{helperText}</span>}
    </div>
  )
}
