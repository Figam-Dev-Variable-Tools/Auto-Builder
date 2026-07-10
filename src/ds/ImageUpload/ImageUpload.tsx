import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import styles from './ImageUpload.module.css'
import { Upload } from '../Upload/Upload'

export type ImageUploadProps = {
  label?: string
  files: File[]
  onChange?: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
  helperText?: string
}

export function ImageUpload({
  label,
  files,
  onChange,
  maxFiles = 6,
  disabled = false,
  helperText,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urls, setUrls] = useState<string[]>([])

  // 오브젝트 URL 생성/해제 관리
  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file))
    setUrls(next)
    return () => {
      next.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleAddInput = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = e.target.files
    if (incoming && incoming.length > 0) {
      onChange?.([...files, ...Array.from(incoming)].slice(0, maxFiles))
    }
    e.target.value = '' // 같은 파일 재선택 허용
  }

  const removeAt = (index: number) => {
    onChange?.(files.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.imageUpload}>
      <Upload
        label={label}
        files={files}
        onChange={onChange}
        accept="image/*"
        multiple
        maxFiles={maxFiles}
        disabled={disabled}
        helperText={helperText}
      />
      {files.length > 0 && (
        <div className={styles.grid}>
          {files.map((file, index) => {
            const url = urls[index]
            return (
              <div key={`${file.name}-${index}`} className={styles.thumb}>
                {url != null && <img src={url} alt={file.name} className={styles.img} />}
                {!disabled && (
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`${file.name} 삭제`}
                    onClick={() => removeAt(index)}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
          {files.length < maxFiles && !disabled && (
            <button
              type="button"
              className={styles.addTile}
              aria-label="이미지 추가"
              onClick={() => inputRef.current?.click()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className={styles.input}
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={handleAddInput}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
