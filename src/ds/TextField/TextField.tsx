import { useId, useState } from 'react'
import styles from './TextField.module.css'

// TextField는 InputBase를 합성하지 않는다(중복처럼 보이지만 의도적 — 셋 다 실측 확인함):
//  1. maxLength를 넘겨도 입력을 막지 않고 카운터만 error색으로 보여준다(§8, 아래 `over`).
//     InputBase는 <input maxLength>를 네이티브로 그대로 걸어 브라우저가 강제로 잘라낸다 — 다른 동작.
//  2. description(showDescription)과 helperText를 동시에(두 줄로) 보여줄 수 있다.
//     InputBase의 meta는 helperText 한 줄 + counter뿐이라 description 축이 아예 없다.
//  3. hover/focus/error/success 보더색이 --ds-color-primary/error/success 인데,
//     InputBase는 --ds-color-solid-primary/error/success를 쓴다(실제로 다른 색상값 — tokens 확인함).
//     그대로 합성하면 기존 TextField 화면 전부의 보더 색이 바뀐다(회귀).
// size 스케일(패딩 숫자)만 InputBase.module.css의 --input-size-* 로 공유한다(TextField.module.css 참조).
export type TextFieldProps = {
  label: string
  placeholder?: string
  error?: boolean
  success?: boolean
  disabled?: boolean
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  description?: string
  showDescription?: boolean
  helperText?: string
  maxLength?: number
  showCounter?: boolean
}

export function TextField({
  label,
  placeholder,
  error = false,
  success = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  description,
  showDescription = false,
  helperText,
  maxLength,
  showCounter = false,
}: TextFieldProps) {
  const id = useId()
  const [count, setCount] = useState(0)
  // §8: 초과 입력은 막지 않고 카운터·보더를 error색으로 표시
  const over = maxLength != null && count > maxLength
  const invalid = error || over
  const className = [
    styles.field,
    styles[size],
    invalid ? styles.error : '',
    !invalid && success ? styles.success : '',
  ]
    .filter(Boolean)
    .join(' ')
  const hasMeta = (showDescription && description != null) || helperText || showCounter

  return (
    <div className={className}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onChange={(e) => setCount(e.target.value.length)}
      />
      {hasMeta && (
        <div className={styles.meta}>
          <span className={styles.messages}>
            {showDescription && description != null && (
              <span className={styles.description}>{description}</span>
            )}
            {helperText && <span className={styles.helperText}>{helperText}</span>}
          </span>
          {showCounter && (
            <span className={[styles.counter, over ? styles.counterOver : ''].filter(Boolean).join(' ')}>
              {maxLength != null ? `${count}/${maxLength}자` : `${count}자`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
