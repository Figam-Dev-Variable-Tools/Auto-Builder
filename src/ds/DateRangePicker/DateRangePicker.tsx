import { useEffect, useId, useRef, useState } from 'react'
import { formatDateK, isSameDay } from '../Calendar/Calendar'
import styles from './DateRangePicker.module.css'

// 기간 선택 — 첫 클릭이 시작일, 두 번째 클릭이 종료일(시작일 이전이면 스왑).
// 범위 하이라이트를 위해 Calendar를 확장하지 않고 자체 월 그리드를 사용한다.
export type DateRangePickerProps = {
  label?: string
  start: Date | null
  end: Date | null
  onChange?: (range: { start: Date | null; end: Date | null }) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  helperText?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// 표시 월의 첫 주 일요일부터 6주(42칸) 그리드
function buildGrid(month: Date): Date[] {
  const first = firstOfMonth(month)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function DateRangePicker({
  label,
  start,
  end,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  helperText,
}: DateRangePickerProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(start ?? new Date()))

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

  function toggle() {
    if (!open) setViewMonth(firstOfMonth(start ?? new Date()))
    setOpen((o) => !o)
  }

  function isOutOfRange(d: Date): boolean {
    if (minDate != null && d.getTime() < startOfDay(minDate).getTime()) return true
    if (maxDate != null && d.getTime() > startOfDay(maxDate).getTime()) return true
    return false
  }

  function pick(d: Date) {
    // 첫 클릭(또는 완성된 기간 후 재클릭) → 시작일 재설정
    if (start == null || end != null) {
      onChange?.({ start: d, end: null })
      return
    }
    // 두 번째 클릭 → 종료일. 시작일 이전이면 스왑.
    if (d.getTime() < startOfDay(start).getTime()) onChange?.({ start: d, end: startOfDay(start) })
    else onChange?.({ start, end: d })
    setOpen(false)
  }

  function moveMonth(delta: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  const days = buildGrid(viewMonth)
  const today = startOfDay(new Date())
  const s = start != null ? startOfDay(start) : null
  const e = end != null ? startOfDay(end) : null

  let triggerText: string
  if (start != null && end != null) triggerText = `${formatDateK(start)} – ${formatDateK(end)}`
  else if (start != null) triggerText = `${formatDateK(start)} –`
  else triggerText = '기간 선택'

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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={start != null ? styles.value : styles.placeholder}>{triggerText}</span>
        </button>
        {open && (
          <div className={styles.panel} role="dialog" aria-label={label ?? '기간 선택'}>
            <div className={styles.header}>
              <button
                type="button"
                className={styles.nav}
                aria-label="이전 달"
                onClick={() => moveMonth(-1)}
              >
                <svg
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
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className={styles.title}>
                {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
              </span>
              <button
                type="button"
                className={styles.nav}
                aria-label="다음 달"
                onClick={() => moveMonth(1)}
              >
                <svg
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
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div className={styles.weekdays}>
              {WEEKDAYS.map((w, i) => (
                <span
                  key={w}
                  className={[styles.weekday, i === 0 ? styles.sun : '', i === 6 ? styles.sat : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {w}
                </span>
              ))}
            </div>
            <div className={styles.grid}>
              {days.map((d) => {
                const edge = isSameDay(d, s) || isSameDay(d, e)
                const inRange =
                  s != null && e != null && d.getTime() > s.getTime() && d.getTime() < e.getTime()
                const dayClass = [
                  styles.day,
                  d.getMonth() !== viewMonth.getMonth() ? styles.outside : '',
                  isSameDay(d, today) ? styles.today : '',
                  inRange ? styles.inRange : '',
                  edge ? styles.edge : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={d.getTime()}
                    type="button"
                    className={dayClass}
                    disabled={isOutOfRange(d)}
                    aria-pressed={edge}
                    aria-label={`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`}
                    onClick={() => pick(new Date(d))}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {helperText != null && <span className={styles.helper}>{helperText}</span>}
    </div>
  )
}
