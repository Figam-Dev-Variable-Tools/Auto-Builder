import { useState } from 'react'
import styles from './Calendar.module.css'

// 날짜 유틸 — DatePicker/DateRangePicker 등에서 재사용한다.
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (a == null || b == null) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatDateK(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// 표시 월의 첫 주 일요일부터 6주(42칸) 그리드를 만든다.
function buildGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export type CalendarProps = {
  value?: Date | null
  onChange?: (d: Date) => void
  /** 초기 표시 월 */
  month?: Date
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

export function Calendar({
  value = null,
  onChange,
  month,
  minDate,
  maxDate,
  disabled = false,
}: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const base = month ?? value ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const today = startOfDay(new Date())
  const days = buildGrid(viewMonth)

  function isOutOfRange(d: Date): boolean {
    if (minDate != null && d.getTime() < startOfDay(minDate).getTime()) return true
    if (maxDate != null && d.getTime() > startOfDay(maxDate).getTime()) return true
    return false
  }

  function moveMonth(delta: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  const rootClass = [styles.calendar, disabled ? styles.disabled : ''].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.nav}
          aria-label="이전 달"
          disabled={disabled}
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
          disabled={disabled}
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
          const selected = isSameDay(d, value)
          const dayClass = [
            styles.day,
            d.getMonth() !== viewMonth.getMonth() ? styles.outside : '',
            isSameDay(d, today) ? styles.today : '',
            selected ? styles.selected : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={d.getTime()}
              type="button"
              className={dayClass}
              disabled={disabled || isOutOfRange(d)}
              aria-pressed={selected}
              aria-label={`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`}
              onClick={() => onChange?.(new Date(d))}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
