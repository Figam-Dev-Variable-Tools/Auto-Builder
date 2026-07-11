import { useEffect, useRef, useState, type ReactNode } from 'react'
import docsContent from '../../docs/docs-content.json'
import { ThemeScope } from '../shared/ThemeScope'
import { Button } from '../ds/Button/Button'
import { TextField } from '../ds/TextField/TextField'
import { Card } from '../ds/Card/Card'
import { Alert } from '../ds/Alert/Alert'
import { Badge } from '../ds/Badge/Badge'
import { SocialLoginButton } from '../ds/SocialLoginButton/SocialLoginButton'
import { DsChart } from '../ds/Chart/DsChart'
import styles from './DocRenderer.module.css'

type Block = {
  type: string
  text?: string
  tokens?: string[]
  sizes?: string[]
  component?: string
  id?: string
}

// 렌더링 메타데이터(문서 프로세가 아닌 UI 라벨) — DEMOS와 동일 성격. 문서 프로세는 JSON에서만(§0-12).
const COLOR_USAGE: Record<string, string> = {
  primary: '메인 액션·강조 — 주요 버튼, 링크, 활성 상태',
  secondary: '보조 — 서브 텍스트, 비활성 보더, 부가 정보',
  error: '오류·위험 — 에러 메시지, 삭제, 유효성 실패',
  success: '성공·완료 — 확인 메시지, 완료 상태',
  warning: '경고·주의 — 주의 알림, 대기 상태',
  bg: '기본 배경 — 페이지·카드 표면',
  bgSubtle: '옅은 배경 — 비활성 입력, 헤더 줄무늬',
  text: '본문 텍스트 — 기본 글자색',
  border: '보더·구분선 — 입력 테두리, 카드 경계',
}

const SIZE_USAGE: Record<string, string> = {
  xs: '캡션·라벨',
  sm: '보조·헬퍼 텍스트',
  md: '본문 기본',
  lg: '소제목',
  xl: '제목',
  xxl: '디스플레이',
}

const DEMOS: Record<string, ReactNode> = {
  Button: <Button variant="primary" size="md" label="Button" />,
  TextField: <TextField label="Email" placeholder="name@example.com" />,
  Card: <Card title="Card title">This is a sample card.</Card>,
  Alert: <Alert variant="error" label="This is a warning message." showIcon />,
  Badge: <Badge variant="primary" size="md" label="Badge" />,
  SocialLoginButton: <SocialLoginButton provider="kakao" size="md" />,
  DsChart: <DsChart type="line" dataset="revenue" title="Revenue" />,
}

/** 테마 스코프 안에서 CSS 변수 실제 계산값을 읽는다 */
function useCssVar<T extends HTMLElement>(name: string): [React.RefObject<T | null>, string] {
  const ref = useRef<T>(null)
  const [value, setValue] = useState('')
  useEffect(() => {
    if (!ref.current) return
    setValue(getComputedStyle(ref.current).getPropertyValue(name).trim())
  }, [name])
  return [ref, value]
}

function ColorCard({ token }: { token: string }) {
  const [ref, hex] = useCssVar<HTMLButtonElement>(`--ds-color-${token}`)
  const [copied, setCopied] = useState(false)
  const cssVar = `var(--ds-color-${token})`

  return (
    <button
      type="button"
      ref={ref}
      className={styles.colorCard}
      onClick={() => {
        navigator.clipboard.writeText(cssVar).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        })
      }}
      aria-label={`${token} 색상 변수 복사`}
    >
      <div className={styles.swatch} style={{ background: cssVar }} />
      <div className={styles.cardMeta}>
        <div className={styles.tokenRow}>
          <span className={styles.tokenVar}>--ds-color-{token}</span>
          <span className={styles.tokenVal}>{hex.toUpperCase()}</span>
        </div>
        <span className={styles.usage}>{COLOR_USAGE[token] ?? ''}</span>
        <span className={[styles.copyHint, copied ? styles.copied : ''].join(' ')}>
          {copied ? '✓ 복사됨' : 'click → var() 복사'}
        </span>
      </div>
    </button>
  )
}

function TypeRow({ size }: { size: string }) {
  const [ref, px] = useCssVar<HTMLDivElement>(`--ds-font-size-${size}`)
  return (
    <div ref={ref} className={styles.typeRow}>
      <span className={styles.typeSample} style={{ fontSize: `var(--ds-font-size-${size})` }}>
        가나다 ABC 123
      </span>
      <span className={styles.typeMeta}>
        <span className={styles.usage}>{SIZE_USAGE[size] ?? ''}</span>
        <span className={styles.tokenVar}>--ds-font-size-{size}</span>
        <span className={styles.tokenVal}>{px}</span>
      </span>
    </div>
  )
}

function CalloutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={styles.calloutIcon}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  )
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case 'heading':
      return (
        <h2 key={index} className={styles.heading}>
          {block.text}
        </h2>
      )
    case 'paragraph':
      return (
        <p key={index} className={styles.para}>
          {block.text}
        </p>
      )
    case 'callout':
      return (
        <div key={index} className={styles.callout}>
          <CalloutIcon />
          <span>{block.text}</span>
        </div>
      )
    case 'colorGrid':
      return (
        <div key={index} className={styles.colorGrid}>
          {(block.tokens ?? []).map((token) => (
            <ColorCard key={token} token={token} />
          ))}
        </div>
      )
    case 'typeScale':
      return (
        <div key={index} className={styles.typeList}>
          {(block.sizes ?? []).map((size) => (
            <TypeRow key={size} size={size} />
          ))}
        </div>
      )
    case 'componentDemo': {
      const demo = block.component ? DEMOS[block.component] : null
      if (!demo) return null
      return (
        <div key={index} className={styles.previewFrame}>
          <span className={styles.previewLabel}>{block.component}</span>
          {demo}
        </div>
      )
    }
    case 'table': {
      const def = block.id
        ? (docsContent.tables as Record<string, { columns: string[]; rows: string[][] }>)[block.id]
        : undefined
      if (!def) return null
      return (
        <div key={index} style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                {def.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {def.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    default:
      return null
  }
}

export function DocRenderer({ sectionId }: { sectionId: string }) {
  const section = docsContent.sections.find((s) => s.id === sectionId)
  if (!section) return null
  // 독립 MDX 페이지는 preview 데코레이터(ThemeScope)를 타지 않으므로 직접 감싼다. 문서 사이트 기본 프리셋 = toss.
  return (
    <ThemeScope preset="toss">
      <div className={styles.page}>{(section.blocks as Block[]).map(renderBlock)}</div>
    </ThemeScope>
  )
}
