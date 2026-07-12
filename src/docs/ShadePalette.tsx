import { ThemeScope } from '../shared/ThemeScope'
import styles from './ShadePalette.module.css'

// 팔레트 셰이드(10단) — Figma 변수 color/<key>/<step> ⇄ Storybook --ds-color-<key>-<step> 미러.
const KEYS: Array<[string, string]> = [
  ['primary', '메인'],
  ['secondary', '서브'],
  ['error', '에러'],
  ['success', '성공'],
  ['warning', '경고'],
]
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

export function ShadePalette() {
  return (
    <ThemeScope preset="toss">
      <div className={styles.wrap}>
        {KEYS.map(([key, kr]) => (
          <div key={key} className={styles.row}>
            <div className={styles.label}>
              {kr}
              <span>--ds-color-{key}-*</span>
            </div>
            <div className={styles.strip}>
              {STEPS.map((s) => (
                <div key={s} className={styles.cell}>
                  <div className={styles.chip} style={{ background: `var(--ds-color-${key}-${s})` }} />
                  <span className={s === '500' ? styles.base : undefined}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ThemeScope>
  )
}
