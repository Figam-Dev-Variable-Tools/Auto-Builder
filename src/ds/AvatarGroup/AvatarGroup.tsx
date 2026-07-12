import styles from './AvatarGroup.module.css'

export type AvatarGroupProps = {
  /** 표시할 이름들. 이니셜은 각 이름의 첫 글자를 사용한다. */
  names?: string[]
  /** 노출할 최대 아바타 수. 초과분은 '+N' 원으로 묶는다. */
  max?: number
  /** 아바타 크기. */
  size?: 'sm' | 'md'
}

const DEFAULT_NAMES = ['김민준', '이서연', '박도윤', '최지우']

function initial(name: string): string {
  return name.trim().charAt(0) || '?'
}

export function AvatarGroup({ names = DEFAULT_NAMES, max = 3, size = 'md' }: AvatarGroupProps) {
  const limit = Math.max(0, max)
  const visible = names.slice(0, limit)
  const overflow = names.length - visible.length
  // 왼쪽 아바타가 위로 겹치도록 z-index를 내림차순으로 준다.
  const top = visible.length + 1

  return (
    <div className={`${styles.group} ${styles[size]}`}>
      {visible.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className={styles.avatar}
          style={{ zIndex: top - i }}
          title={name}
        >
          <span className={styles.initial}>{initial(name)}</span>
        </div>
      ))}
      {overflow > 0 && (
        <div className={`${styles.avatar} ${styles.more}`} style={{ zIndex: 0 }}>
          <span className={styles.initial}>+{overflow}</span>
        </div>
      )}
    </div>
  )
}
