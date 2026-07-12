// Storybook ⇄ Figma 토큰 양방향 패리티 검증기.
// tokens/*.json 을 단일 소스로 보고 3가지를 확인한다:
//  1) 값 패리티   — figma-plugin/src/presets.data.ts 의 값이 tokens/*.json 과 완전 동일.
//  2) 변수명 패리티 — Storybook --ds-<group>-<key>  ⇔  Figma <group>/<key> 가 1:1.
//  3) 이름 존재   — Figma 변수명 템플릿이 generators/tokens.ts 에 실제로 선언됨.
// 사용: pnpm verify:parity  (드리프트 시 비정상 종료)
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokensDir = join(root, 'tokens')
const genDir = join(root, 'src', 'tokens', 'generated')
const PRESET_ORDER = ['bootstrap', 'tailwind', 'toss']
const PALETTE_KEYS = ['primary', 'secondary', 'error', 'success', 'warning']
const SHADE_STEPS = ['100', '300', '500', '700', '900']

const fail = []
const note = (m) => fail.push(m)

// ── 토큰 로드 ──────────────────────────────────────────────────────────
const presets = {}
for (const f of readdirSync(tokensDir).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(tokensDir, f), 'utf8'))
  presets[j.$preset] = j
}
const names = PRESET_ORDER.filter((p) => presets[p])
if (names.length !== PRESET_ORDER.length) note(`tokens/ 프리셋 누락: ${names}`)
const ref = presets[names[0]]

// 한 프리셋의 논리 토큰 → { figma: 'color/primary', ss: '--ds-color-primary' } 매핑 생성.
function tokenMap(t) {
  const rows = []
  const add = (figma, ss) => rows.push({ figma, ss })
  for (const k of Object.keys(t.color)) add(`color/${k}`, `--ds-color-${k}`)
  for (const key of PALETTE_KEYS) for (const s of SHADE_STEPS) add(`color/${key}/${s}`, `--ds-color-${key}-${s}`)
  add('font/family', '--ds-font-family')
  for (const k of Object.keys(t.typography.sizes)) add(`font/size/${k}`, `--ds-font-size-${k}`)
  for (const k of Object.keys(t.typography.weights)) add(`font/weight/${k}`, `--ds-font-weight-${k}`)
  for (const k of Object.keys(t.radius)) add(`radius/${k}`, `--ds-radius-${k}`)
  for (const k of Object.keys(t.spacing)) add(`spacing/${k}`, `--ds-spacing-${k}`)
  add('border/width', '--ds-border-width')
  add('border/width-thick', '--ds-border-width-thick')
  return rows
}

// ── 1) 값 패리티: presets.data.ts === tokens/*.json ───────────────────
try {
  const src = readFileSync(join(root, 'figma-plugin', 'src', 'presets.data.ts'), 'utf8')
  const jsonText = src.slice(src.indexOf('= ') + 2).trim()
  const pluginData = JSON.parse(jsonText)
  const expected = Object.fromEntries(names.map((n) => [n, presets[n]]))
  if (JSON.stringify(pluginData) !== JSON.stringify(expected)) {
    note('값 패리티 실패: presets.data.ts ≠ tokens/*.json — `pnpm build:tokens` 재생성 필요.')
  }
} catch (e) {
  note(`presets.data.ts 파싱 실패(재생성 필요): ${e.message}`)
}

// ── 2) 변수명 패리티: 프리셋별 css --ds-* === 기대 집합 ────────────────
let mappingCount = 0
for (const name of names) {
  const map = tokenMap(presets[name])
  mappingCount = map.length
  const expectedSs = new Set(map.map((r) => r.ss))
  let css = ''
  try {
    css = readFileSync(join(genDir, `vars-${name}.css`), 'utf8')
  } catch {
    note(`vars-${name}.css 없음 — \`pnpm build:tokens\` 필요.`)
    continue
  }
  const actualSs = new Set(css.match(/--ds-[A-Za-z0-9-]+(?=\s*:)/g) || [])
  for (const ss of expectedSs) if (!actualSs.has(ss)) note(`[${name}] Storybook에 누락된 변수: ${ss}`)
  for (const ss of actualSs) if (!expectedSs.has(ss)) note(`[${name}] Storybook에 여분 변수(매핑 없음): ${ss}`)
}

// ── 3) Figma 이름 존재: tokens.ts 소스에 변수명 템플릿이 실제로 있는지 ──
try {
  const tks = readFileSync(join(root, 'figma-plugin', 'src', 'generators', 'tokens.ts'), 'utf8')
  const needTemplates = [
    'color/${key}',
    'color/${key}/${step}',
    'font/family',
    'font/size/${key}',
    'font/weight/${key}',
    'radius/${key}',
    'spacing/${key}',
    'border/width',
  ]
  for (const t of needTemplates) if (!tks.includes(t)) note(`Figma tokens.ts에 변수명 템플릿 누락: ${t}`)
} catch (e) {
  note(`tokens.ts 읽기 실패: ${e.message}`)
}

// ── 결과 ──────────────────────────────────────────────────────────────
if (fail.length) {
  console.error('✗ 토큰 패리티 실패:\n' + fail.map((m) => '  - ' + m).join('\n'))
  process.exit(1)
}
console.log(
  `✓ 토큰 패리티 OK — 프리셋 ${names.length}개 × 변수 ${mappingCount}개 (Figma <group>/<key> ⇔ Storybook --ds-<group>-<key>), 값은 tokens/*.json 단일 소스.`,
)
