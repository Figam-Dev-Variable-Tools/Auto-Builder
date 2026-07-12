// 배포용 토큰 CSS — tokens/*.json → dist/tokens.css(:root 기본 + [data-theme] 프리셋) + dist/tokens/<preset>.css
// build-tokens.mjs와 동일한 셰이드 공식(값 일치). 사용: node scripts/gen-kit-tokens.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokensDir = join(root, 'tokens')
const outDir = join(root, 'packages', 'design-kit', 'dist')
const tokensOut = join(outDir, 'tokens')
mkdirSync(tokensOut, { recursive: true })

const PRESET_ORDER = ['bootstrap', 'tailwind', 'toss']
const presets = {}
for (const f of readdirSync(tokensDir).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(tokensDir, f), 'utf8'))
  presets[j.$preset] = j
}
const names = PRESET_ORDER.filter((p) => presets[p])

const px = (n) => `${n}px`
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase()
const mixHex = (hex, target, amt) => {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return '#' + [0, 1, 2].map((i) => toHex(a[i] + (b[i] - a[i]) * amt)).join('')
}
const SHADE_STEPS = [
  ['50', (h) => mixHex(h, '#FFFFFF', 0.9)],
  ['100', (h) => mixHex(h, '#FFFFFF', 0.8)],
  ['200', (h) => mixHex(h, '#FFFFFF', 0.62)],
  ['300', (h) => mixHex(h, '#FFFFFF', 0.44)],
  ['400', (h) => mixHex(h, '#FFFFFF', 0.24)],
  ['500', (h) => h.toUpperCase()],
  ['600', (h) => mixHex(h, '#000000', 0.12)],
  ['700', (h) => mixHex(h, '#000000', 0.24)],
  ['800', (h) => mixHex(h, '#000000', 0.36)],
  ['900', (h) => mixHex(h, '#000000', 0.48)],
]
const PALETTE_KEYS = ['primary', 'secondary', 'error', 'success', 'warning']

function varLines(t) {
  const lines = []
  for (const [k, v] of Object.entries(t.color)) lines.push(`  --ds-color-${k}: ${v};`)
  for (const key of PALETTE_KEYS) for (const [step, fn] of SHADE_STEPS) lines.push(`  --ds-color-${key}-${step}: ${fn(t.color[key])};`)
  lines.push(`  --ds-font-family: ${t.typography.fontFamily};`)
  for (const [k, v] of Object.entries(t.typography.sizes)) lines.push(`  --ds-font-size-${k}: ${px(v)};`)
  for (const [k, v] of Object.entries(t.typography.weights)) lines.push(`  --ds-font-weight-${k}: ${v};`)
  for (const [k, v] of Object.entries(t.radius)) lines.push(`  --ds-radius-${k}: ${px(v)};`)
  lines.push(`  --ds-radius-full: 999px;`) // pill/원형(컴포넌트 fallback과 동일) — 오버라이드 가능하게 선언
  for (const [k, v] of Object.entries(t.spacing)) lines.push(`  --ds-spacing-${k}: ${px(v)};`)
  lines.push(`  --ds-border-width: 1px;`)
  lines.push(`  --ds-border-width-thick: 2px;`)
  return lines
}

const header = `/* @figam-dev-variable-tools/design-kit — 디자인 토큰. AUTO-GENERATED (SSOT: tokens/*.json). */\n`
// :root 기본 프리셋 — 브랜드 시그니처(#3D6BFF)인 toss. data-theme로 전환 가능.
const DEFAULT_PRESET = presets['toss'] ? 'toss' : names[0]
let css = header + `:root {\n${varLines(presets[DEFAULT_PRESET]).join('\n')}\n}\n\n`
for (const n of names) css += `:root[data-theme='${n}'],\n[data-theme='${n}'] {\n${varLines(presets[n]).join('\n')}\n}\n\n`
writeFileSync(join(outDir, 'tokens.css'), css)
// 프리셋별 단일 :root 파일
for (const n of names) writeFileSync(join(tokensOut, `${n}.css`), header + `:root {\n${varLines(presets[n]).join('\n')}\n}\n`)

console.log(`gen-kit-tokens OK — tokens.css(:root=${DEFAULT_PRESET} + ${names.length}프리셋) + tokens/<preset>.css`)
