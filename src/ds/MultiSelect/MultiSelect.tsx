import { useRef, useState } from 'react'
import { Chevron, CheckIcon, useDismiss, type SelectOption } from '../Select/Select'
import styles from './MultiSelect.module.css'

export type MultiSelectProps = {
  label?: string
  values: string[]
  onChange?: (values: string[]) => void
  options: SelectOption[]
  placeholder?: string
  /** 최대 선택 개수 — 도달 시 미선택 옵션 클릭 무시 */
  maxSelected?: number
  disabled?: boolean
  helperText?: string
}

export function MultiSelect({
  label,
  values,
  onChange,
  options,
  placeholder = '선택하세요',
  maxSelected,
  disabled = false,
  helperText,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, () => setOpen(false))

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange?.(values.filter((v) => v !== value))
    } else {
      if (maxSelected != null && values.length >= maxSelected) return
      onChange?.([...values, value])
    }
  }

  const selectedOptions = options.filter((o) => values.includes(o.value))
  const fieldClass = [styles.field, open ? styles.open : ''].filter(Boolean).join(' ')

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
          {selectedOptions.length > 0 ? (
            <span className={styles.chips}>
              {selectedOptions.map((option) => (
                <span key={option.value} className={styles.chip}>
                  {option.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.chipRemove}
                    aria-label={`${option.label} 제거`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(option.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        toggle(option.value)
                      }
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
          <span className={styles.chevron}>
            <Chevron />
          </span>
        </button>
        {open && (
          <div className={styles.panel} role="listbox" aria-multiselectable="true">
            {options.map((option) => {
              const checked = values.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  className={[styles.option, option.disabled ? styles.optionDisabled : '']
                    .filter(Boolean)
                    .join(' ')}
                  disabled={option.disabled}
                  onClick={() => toggle(option.value)}
                >
                  <span
                    className={[styles.checkbox, checked ? styles.checkboxChecked : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {checked && <CheckIcon />}
                  </span>
                  <span>{option.label}</span>
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
