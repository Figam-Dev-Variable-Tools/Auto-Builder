import { useEffect, useId, useRef, useState } from 'react'
import styles from './TimePicker.module.css'

// 시/분 선택 — 24시간제 'HH:MM' 문자열 컨트롤드. 두 값이 모두 정해지면 onChange.
export type TimePickerProps = {
  label?: string
  /** 'HH:MM' 24시간제, 미선택은 '' */
  value: string
  onChange?: (v: string) => void
  minuteStep?: 5 | 10 | 15 | 30
  disabled?: boolean
  helperText?: string
}

function parseTime(v: string): { hour: number | null; minute: number | null } {
  const m = /^(\d{2}):(\d{2})$/.exec(v)
  if (m == null) return { hour: null, minute: null }
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour > 23 || minute > 59) return { hour: null, minute: null }
  return { hour, minute }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function TimePicker({
  label,
  value,
  onChange,
  minuteStep = 5,
  disabled = false,
  helperText,
}: TimePickerProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState<number | null>(null)
  const [minute, setMinute] = useState<number | null>(null)

  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)

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

  // 열릴 때 선택 항목을 스크롤 안으로
  useEffect(() => {
    if (!open) return
    if (hour != null) document.getElementById(`${id}-h-${hour}`)?.scrollIntoView({ block: 'nearest' })
    if (minute != null)
      document.getElementById(`${id}-m-${minute}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, id, hour, minute])

  function toggle() {
    if (!open) {
      const parsed = parseTime(value)
      setHour(parsed.hour)
      setMinute(parsed.minute)
    }
    setOpen((o) => !o)
  }

  function pickHour(h: number) {
    setHour(h)
    if (minute != null) onChange?.(`${pad2(h)}:${pad2(minute)}`)
  }

  function pickMinute(m: number) {
    setMinute(m)
    if (hour != null) onChange?.(`${pad2(hour)}:${pad2(m)}`)
  }

  function clear() {
    setHour(null)
    setMinute(null)
    onChange?.('')
    setOpen(false)
  }

  const triggerClass = [styles.trigger, open ? styles.open : ''].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={styles.field}>
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
          onClick={toggle}
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className={value !== '' ? styles.value : styles.placeholder}>
            {value !== '' ? value : '시간 선택'}
          </span>
        </button>
        {open && (
          <div className={styles.panel} role="dialog" aria-label={label ?? '시간 선택'}>
            <div className={styles.columns}>
              <div className={styles.column}>
                <span className={styles.columnTitle}>시</span>
                <div className={styles.list}>
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      id={`${id}-h-${h}`}
                      type="button"
                      className={[styles.item, h === hour ? styles.selected : '']
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={h === hour}
                      onClick={() => pickHour(h)}
                    >
                      {pad2(h)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.column}>
                <span className={styles.columnTitle}>분</span>
                <div className={styles.list}>
                  {minutes.map((m) => (
                    <button
                      key={m}
                      id={`${id}-m-${m}`}
                      type="button"
                      className={[styles.item, m === minute ? styles.selected : '']
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={m === minute}
                      onClick={() => pickMinute(m)}
                    >
                      {pad2(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
