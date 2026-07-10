import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from 'react'
import styles from './Upload.module.css'

export type UploadProps = {
  label?: string
  files: File[]
  onChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  helperText?: string
  /** 드롭존 안내 영역 커스텀 */
  children?: ReactNode
}

/** 바이트 수를 '1.2 MB' 형식 문자열로 변환 */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = n
  let unitIndex = -1
  do {
    value /= 1024
    unitIndex += 1
  } while (value >= 1024 && unitIndex < units.length - 1)
  return `${value.toFixed(1).replace(/\.0$/, '')} ${units[unitIndex]}`
}

export function Upload({
  label,
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles,
  disabled = false,
  helperText,
  children,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const added = multiple ? Array.from(incoming) : Array.from(incoming).slice(0, 1)
    let next = multiple ? [...files, ...added] : added
    if (maxFiles != null) next = next.slice(0, maxFiles) // 초과분은 무시
    onChange?.(next)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = '' // 같은 파일 재선택 허용
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    addFiles(e.dataTransfer.files)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const zoneClassName = [
    styles.dropzone,
    dragOver ? styles.dragOver : '',
    disabled ? styles.disabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      {label != null && <span className={styles.label}>{label}</span>}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={zoneClassName}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {children ?? (
          <>
            <svg
              className={styles.icon}
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
            <span className={styles.text}>파일을 끌어다 놓거나 클릭하여 업로드</span>
            {helperText != null && <span className={styles.helper}>{helperText}</span>}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className={styles.input}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
