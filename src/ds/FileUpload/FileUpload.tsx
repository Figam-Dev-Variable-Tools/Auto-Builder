import styles from './FileUpload.module.css'
import { Upload, formatBytes } from '../Upload/Upload'

export type FileUploadProps = {
  label?: string
  files: File[]
  onChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  helperText?: string
}

export function FileUpload({
  label,
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles,
  disabled = false,
  helperText,
}: FileUploadProps) {
  const removeAt = (index: number) => {
    onChange?.(files.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.fileUpload}>
      <Upload
        label={label}
        files={files}
        onChange={onChange}
        accept={accept}
        multiple={multiple}
        maxFiles={maxFiles}
        disabled={disabled}
        helperText={helperText}
      />
      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className={styles.item}>
              <svg
                className={styles.fileIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <path d="M13 2v7h7" />
              </svg>
              <span className={styles.name}>{file.name}</span>
              <span className={styles.size}>{formatBytes(file.size)}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`${file.name} 삭제`}
                disabled={disabled}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
