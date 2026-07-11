import { useState, type ReactNode } from 'react'

type Props = {
  /** [이름, 렌더된 아이콘 노드] 목록 */
  items: ReadonlyArray<readonly [string, ReactNode]>
  /** 그리드를 감싸야 하는 경우(예: Bootstrap Icons의 FrameworkScope) */
  renderGrid?: (children: ReactNode) => ReactNode
}

/** 아이콘 갤러리 공용 셸 — 이름 검색 필터 + 반응형 그리드 + 카운트 */
export function IconGallery({ items, renderGrid }: Props) {
  const [query, setQuery] = useState('')
  const filtered = items.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))

  const grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
        gap: 12,
        textAlign: 'center',
      }}
    >
      {filtered.map(([name, node]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '12px 4px',
            border: '1px solid var(--ds-color-border)',
            borderRadius: 'var(--ds-radius-md)',
            background: 'var(--ds-color-bg)',
          }}
        >
          {node}
          <div
            style={{
              fontSize: 'var(--ds-font-size-xs)',
              color: 'var(--ds-color-secondary)',
              wordBreak: 'break-all',
              lineHeight: 1.3,
            }}
          >
            {name}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div
      style={{
        fontFamily: 'var(--ds-font-family)',
        color: 'var(--ds-color-text)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="아이콘 이름 검색"
          aria-label="아이콘 이름 검색"
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-md)',
            color: 'var(--ds-color-text)',
            background: 'var(--ds-color-bg)',
            border: '1px solid var(--ds-color-border)',
            borderRadius: 'var(--ds-radius-md)',
            padding: '8px 12px',
            width: 260,
          }}
        />
        <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-secondary)' }}>
          {filtered.length}/{items.length}개
        </span>
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-secondary)' }}>
          검색 결과가 없습니다.
        </div>
      ) : renderGrid ? (
        renderGrid(grid)
      ) : (
        grid
      )}
    </div>
  )
}
