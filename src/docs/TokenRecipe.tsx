import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ThemeScope } from '../shared/ThemeScope'
import type { StylePreset } from '../tokens/generated/types'
import { Button } from '../ds/Button/Button'
import { Card } from '../ds/Card/Card'
import { Badge } from '../ds/Badge/Badge'
import { Alert } from '../ds/Alert/Alert'
import styles from './TokenRecipe.module.css'

type VarSpec = { role: string; name: string; color?: boolean }
type Recipe = { name: string; node: ReactNode; vars: VarSpec[] }

const RECIPES: Recipe[] = [
  {
    name: 'Button',
    node: <Button variant="primary" size="md" label="Button" />,
    vars: [
      { role: '배경', name: '--ds-color-primary', color: true },
      { role: '글자', name: '--ds-color-bg', color: true },
      { role: '모서리', name: '--ds-radius-md' },
      { role: '굵기', name: '--ds-font-weight-medium' },
    ],
  },
  {
    name: 'Card',
    node: <Card title="Card title">본문 텍스트가 들어갑니다.</Card>,
    vars: [
      { role: '표면', name: '--ds-color-bg', color: true },
      { role: '텍스트', name: '--ds-color-text', color: true },
      { role: '모서리', name: '--ds-radius-lg' },
      { role: '패딩', name: '--ds-spacing-4' },
    ],
  },
  {
    name: 'Badge',
    node: <Badge variant="primary" size="md" label="Badge" />,
    vars: [
      { role: '배경', name: '--ds-color-primary', color: true },
      { role: '글자', name: '--ds-color-bg', color: true },
      { role: '모서리', name: '--ds-radius-sm' },
      { role: '크기', name: '--ds-font-size-sm' },
    ],
  },
  {
    name: 'Alert',
    node: <Alert variant="error" label="오류가 발생했습니다." showIcon />,
    vars: [
      { role: '보더', name: '--ds-color-error', color: true },
      { role: '본문', name: '--ds-color-text', color: true },
      { role: '모서리', name: '--ds-radius-md' },
    ],
  },
]

const PRESETS: StylePreset[] = ['bootstrap', 'tailwind', 'toss']

/** 테마 스코프 안에서 CSS 변수 실제 값을 읽는다. preset 변경 시 재측정. */
function VarValue({ spec, preset }: { spec: VarSpec; preset: StylePreset }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState('')
  useEffect(() => {
    if (!ref.current) return
    setValue(getComputedStyle(ref.current).getPropertyValue(spec.name).trim())
  }, [spec.name, preset])
  return (
    <span ref={ref} className={styles.varVal}>
      {spec.color && (
        <span className={styles.chipSwatch} style={{ background: `var(${spec.name})` }} />
      )}
      {spec.color ? value.toUpperCase() : value}
    </span>
  )
}

function RecipeCard({ recipe, preset }: { recipe: Recipe; preset: StylePreset }) {
  return (
    <div className={styles.recipe}>
      <div className={styles.preview}>{recipe.node}</div>
      <div className={styles.recipeName}>
        <b>{recipe.name}</b>
        <span className={styles.arrow}>=</span>
        <span>사용 변수</span>
      </div>
      <div className={styles.varList}>
        {recipe.vars.map((spec) => (
          <div key={spec.name} className={styles.varRow}>
            <span className={styles.role}>{spec.role}</span>
            <span className={styles.varName}>{spec.name}</span>
            <VarValue spec={spec} preset={preset} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** 변수(토큰) 조합 → 생성물 데모. 프리셋을 바꾸면 같은 변수 조합이 다른 결과로 나온다. */
export function TokenRecipe() {
  const [preset, setPreset] = useState<StylePreset>('toss')

  return (
    <ThemeScope preset={preset}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div>
            <h3 className={styles.title}>변수 조합 → 생성물</h3>
            <p className={styles.sub}>
              컴포넌트는 하드코딩 색이 없고 오직 <code>--ds-*</code> 변수만 참조합니다. 개발/플러그인이
              이 변수들을 조합해 아래 결과를 만듭니다. 프리셋을 바꾸면 <b>같은 조합, 다른 결과</b>가 됩니다.
            </p>
          </div>
          <div className={styles.presets} role="group" aria-label="프리셋 전환">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={[styles.presetBtn, p === preset ? styles.presetActive : ''].join(' ')}
                onClick={() => setPreset(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.grid}>
          {RECIPES.map((recipe) => (
            <RecipeCard key={recipe.name} recipe={recipe} preset={preset} />
          ))}
        </div>
      </div>
    </ThemeScope>
  )
}
