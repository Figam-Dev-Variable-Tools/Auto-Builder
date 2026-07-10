import { useEffect, useId, useRef, useState } from 'react'
import { Calendar, formatDateK } from '../Calendar/Calendar'
import styles from './DatePicker.module.css'

// 인풋형 트리거 + 드롭다운 캘린더. 바깥 클릭/Escape로 닫힌다.
export type DatePickerProps = {
  label?: string
  value: Date | null
  onChange?: (d: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = '날짜 선택',
  minDate,
  maxDate,
  disabled = false,
  error = false,
  helperText,
}: DatePickerProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // 바깥 클릭 + Escape로 닫기
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function select(d: Date) {
    onChange?.(d)
    setOpen(false)
  }

  function clear() {
    onChange?.(null)
    setOpen(false)
  }

  const fieldClass = [styles.field, error ? styles.error : ''].filter(Boolean).join(' ')
  const triggerClass = [styles.trigger, open ? styles.open : ''].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={fieldClass}>
      {label != null && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        <button
          id={id}
          type="button"
          className={triggerClass}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            className={styles.icon}
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={value != null ? styles.value : styles.placeholder}>
            {value != null ? formatDateK(value) : placeholder}
          </span>
        </button>
        {open && (
          <div className={styles.panel} role="dialog" aria-label={label ?? '날짜 선택'}>
            <Calendar value={value} onChange={select} minDate={minDate} maxDate={maxDate} />
            <div className={styles.footer}>
              <button type="button" className={styles.clear} onClick={clear}>
                지우기
              </button>
            </div>
          </div>
        )}
      </div>
      {helperText != null && <span className={styles.helper}>{helperText}</span>}
    </div>
  )
}
