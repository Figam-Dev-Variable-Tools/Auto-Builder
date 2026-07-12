import { Fragment } from 'react'
import styles from './Kbd.module.css'

export type KbdProps = {
  keys: string[]
  /** 키 사이에 '+' 구분자를 표시할지 여부 */
  withSeparator?: boolean
}

export function Kbd({ keys, withSeparator = false }: KbdProps) {
  return (
    <span className={styles.group}>
      {keys.map((key, index) => (
        <Fragment key={`${key}-${index}`}>
          {withSeparator && index > 0 && <span className={styles.separator}>+</span>}
          <kbd className={styles.key}>{key}</kbd>
        </Fragment>
      ))}
    </span>
  )
}
