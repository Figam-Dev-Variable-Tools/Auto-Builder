// Storybook ⇄ Figma 토큰 양방향 패리티 검증기.
// tokens/*.json 을 단일 소스로 보고 3가지를 확인한다:
//  1) 값 패리티   — figma-plugin/src/presets.data.ts 의 값이 tokens/*.json 과 완전 동일.
//  2) 변수명 패리티 — Storybook --ds-<group>-<key>  ⇔  Figma <group>/<key> 가 1:1.
//  3) 이름 존재   — Figma 변수명 템플릿이 generators/tokens.ts 에 실제로 선언됨.
// 사용: pnpm verify:parity  (드리프트 시 비정상 종료)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORY_FILES } from './lib/figma-sets.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokensDir = join(root, 'tokens')
const genDir = join(root, 'src', 'tokens', 'generated')
const PRESET_ORDER = ['bootstrap', 'tailwind', 'toss']
const PALETTE_KEYS = ['primary', 'secondary', 'error', 'success', 'warning', 'neutral']
const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

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
  // solid 면 + on-color(전경색) — 셰이드와 같이 base에서 계산되는 파생 토큰.
  for (const key of PALETTE_KEYS) add(`color/solid-${key}`, `--ds-color-solid-${key}`)
  for (const key of PALETTE_KEYS) add(`color/on-${key}`, `--ds-color-on-${key}`)
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
    'color/solid-${key}',
    'color/on-${key}',
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

// ── 4) 아이콘 패리티: Storybook Lucide 갤러리 아이콘이 전부 Figma에 존재 ──
// 스토리북 이름(lucide PascalCase) → Figma _Icon 키(일부는 의미상 이름 다름).
const LUCIDE_TO_FIGMA = {
  MessageCircle: 'Chat',
  Home: 'House',
  ShoppingCart: 'Cart',
  User: 'Person',
  Trash2: 'Trash',
  Pencil: 'Edit',
  X: 'Close',
  AlertTriangle: 'Warning',
  HelpCircle: 'Help',
  Mail: 'Envelope',
  Share2: 'Share',
  FileText: 'File',
  RefreshCw: 'Refresh',
}
let iconCount = 0
try {
  const story = readFileSync(join(root, 'src', 'icons', 'Lucide.stories.tsx'), 'utf8')
  const m = story.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["']/)
  const iconsData = readFileSync(join(root, 'figma-plugin', 'src', 'icons-data.ts'), 'utf8')
  if (!m) note('Lucide.stories.tsx의 lucide-react import 블록을 찾지 못함.')
  else {
    const lucideNames = m[1].split(',').map((s) => s.trim()).filter(Boolean)
    iconCount = lucideNames.length
    for (const name of lucideNames) {
      const figmaKey = LUCIDE_TO_FIGMA[name] || name
      if (!iconsData.includes(`"_Icon/${figmaKey}"`)) {
        note(`아이콘 누락: Storybook '${name}' → Figma '_Icon/${figmaKey}' 없음 (gen-icons MAP 확인).`)
      }
    }
  }
} catch (e) {
  note(`아이콘 패리티 확인 실패: ${e.message}`)
}

// ── 5) 로고 패리티: Storybook 소셜 로고 SVG가 전부 Figma logos-data.ts에 존재 ──
let logoCount = 0
try {
  const logosDir = join(root, 'src', 'ds', 'SocialLoginButton', 'logos')
  const svgs = readdirSync(logosDir).filter((f) => f.endsWith('.svg')).map((f) => f.replace('.svg', ''))
  const logosData = readFileSync(join(root, 'figma-plugin', 'src', 'logos-data.ts'), 'utf8')
  logoCount = svgs.length
  for (const key of svgs) {
    if (!new RegExp(`"${key}"\\s*:`).test(logosData)) {
      note(`로고 누락: Storybook '${key}.svg' → Figma logos-data.ts에 없음 (\`pnpm --dir figma-plugin gen:logos\`).`)
    }
  }
} catch (e) {
  note(`로고 패리티 확인 실패: ${e.message}`)
}

// ── 6) 컴포넌트 커버리지: Storybook 컴포넌트 ↔ Figma 세트 (싱크율) ─────
// 실패로 치지 않고 정보로 출력(일부 갭은 의도적).
try {
  // 카테고리 생성기를 이어붙여 훑는다. 예전엔 categories.ts 한 파일만 읽었는데,
  // 그 파일이 categories-{core,nav-overlay,data-kr-media}.ts로 쪼개지면서 세트가 0개로 보였다.
  // (이 구간은 실패로 치지 않는 정보 출력이라 조용히 썩는다 → CATEGORY_FILES를 단일 소스로 삼는다.)
  // admin/site는 일부러 제외한다 — 이 지표의 분모는 예나 지금이나 "카테고리 세트"다(수치 의미 보존).
  const catSrc = CATEGORY_FILES.map((n) =>
    readFileSync(join(root, 'figma-plugin', 'src', 'generators', `${n}.ts`), 'utf8'),
  ).join('\n')
  const figmaSets = new Set()
  // 모든 ComponentDoc의 setName 리터럴(INPUTS 포함) + buildSet 리터럴
  for (const m of catSrc.matchAll(/setName: '(DS\/[^']+)'/g)) figmaSets.add(m[1])
  for (const m of catSrc.matchAll(/buildSet\(ctx, page, '(DS\/[^']+)'/g)) figmaSets.add(m[1])
  // KR·Templates는 setName을 'DS/'+key로 계산 → 헬퍼 인자에서 추출
  // 두 헬퍼 다 `(han, key, …)` 이고 setName = 'DS/' + **key**(2번째 인자)다 — 시그니처에서 확인했다.
  // 줄바꿈 허용이 필수다: `krBespokeDoc(\n  'EmptyState',\n  'EmptyState',` 처럼 여러 줄로 쓴 호출을 놓치면
  // 실재하는 세트를 "없다"고 판정한다(EmptyState·FilterBar·Dashboard·ListPage·Settings·Login 6개가 그랬다).
  for (const m of catSrc.matchAll(/kr(?:Field|Bespoke)Doc\(\s*'[^']*',\s*'([^']+)'/g)) figmaSets.add('DS/' + m[1])
  figmaSets.add('DS/SocialLoginButton')
  figmaSets.add('DS/Chart')

  // Storybook 리프 컴포넌트(섹션별)
  const storyRoot = join(root, 'src')
  const storyFiles = []
  const walkS = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) walkS(p)
      else if (f.endsWith('.stories.tsx')) storyFiles.push(p)
    }
  }
  walkS(join(storyRoot, 'ds'))
  if (existsSync(join(storyRoot, 'templates'))) walkS(join(storyRoot, 'templates'))
  // ── 스토리 제목 추출 ─────────────────────────────────────────────────
  // 예전 코드는 파일의 **첫 번째** `title:` 을 잡았다. 스토리 파일 안의 목 데이터
  // (`{ title: '배송은 얼마나 걸리나요?' }`)가 meta 보다 먼저 나오면 그걸 제목으로 착각한다.
  // 그 결과 179개 중 24개를 오독했고, Accordion·List·Sidebar·Timeline 4개가
  // 커버리지 검사에서 **통째로 빠져** "60/60 (100%)" 이라는 거짓 수치가 나왔다(분모가 틀렸다).
  const metaTitle = (src) => {
    const m = src.match(/(?:const\s+meta[^=]*=|export\s+default)\s*\{[\s\S]*?title:\s*['"]([^'"]+)['"]/)
    return m ? m[1] : undefined
  }
  /** 스토리 폴더명 = 컴포넌트명 = Figma 세트명(DS/<이름>). KR 은 제목이 한글이라 폴더명으로만 맞출 수 있다. */
  const folderOf = (f) => basename(dirname(f))

  const sections = { general: [], kr: [], site: [], admin: [], other: [] }
  for (const f of storyFiles) {
    const t = metaTitle(readFileSync(f, 'utf8'))
    // 조용한 스킵 금지 — 제목을 못 읽으면 그 컴포넌트는 검사에서 사라진다. 그게 이 버그였다.
    if (!t) {
      note(`스토리 meta title 을 읽지 못함: ${f} — 검사에서 빠지므로 실패로 처리한다`)
      continue
    }
    const item = { name: folderOf(f), title: t, file: f }
    if (t.startsWith('3. 컴포넌트/')) sections.general.push(item)
    else if (t.startsWith('6. KR')) sections.kr.push(item)
    else if (t.startsWith('Site/')) sections.site.push(item)
    else if (t.startsWith('Admin/') || t.startsWith('Templates')) sections.admin.push(item)
    else sections.other.push(item)
  }

  // 스토리가 아예 없는 컴포넌트는 **모든 게이트에 안 보인다**(InputBase 가 그래서 Figma 에 없었다).
  const dsRoot = join(storyRoot, 'ds')
  const storyless = []
  for (const d of readdirSync(dsRoot)) {
    const dir = join(dsRoot, d)
    if (!statSync(dir).isDirectory() || d === 'kr') continue
    if (!existsSync(join(dir, `${d}.tsx`))) continue
    if (!readdirSync(dir).some((f) => f.endsWith('.stories.tsx'))) storyless.push(d)
  }

  // figmaSets 는 **카테고리 생성기만** 스캔한다(위 지표의 분모를 보존하려고 admin/site 를 일부러 뺐다).
  // 커버리지는 "이 컴포넌트가 Figma 어딘가에 세트로 있는가"를 묻는 것이므로 admin·site 도 포함해야 한다.
  const allSets = new Set(figmaSets)
  for (const n of ['admin', 'site']) {
    const s = readFileSync(join(root, 'figma-plugin', 'src', 'generators', `${n}.ts`), 'utf8')
    for (const m of s.matchAll(/setName: '(DS\/[^']+)'/g)) allSets.add(m[1])
    for (const m of s.matchAll(/buildSet\(ctx, page, '(DS\/[^']+)'/g)) allSets.add(m[1])
  }
  const hasSet = (n) => allSets.has('DS/' + n)

  // 페이지 컴포넌트는 세트가 아니라 **화면**으로 그려진다(AboutPage → screens.ts/site-screens.ts 의 screenAbout).
  // 세트가 없다고 누락이 아니다 — 화면 빌더가 있으면 커버된 것이다.
  const screenSrc = ['screens', 'site-screens']
    .map((n) => readFileSync(join(root, 'figma-plugin', 'src', 'generators', `${n}.ts`), 'utf8'))
    .join('\n')
  const hasScreen = (n) =>
    new RegExp(`\\bscreen${n.replace(/Page$|Screen$/, '')}\\b`).test(screenSrc)

  const covered = (n) => hasSet(n) || hasScreen(n)
  const gapsOf = (list) => list.filter((x) => !covered(x.name)).map((x) => x.name)
  const gaps = {
    general: gapsOf(sections.general),
    kr: gapsOf(sections.kr),
    site: gapsOf(sections.site),
    storyless,
  }

  console.log(
    `\n── 컴포넌트 커버리지(Storybook→Figma) ──\n` +
      `  3. 컴포넌트: ${sections.general.length - gaps.general.length}/${sections.general.length}` +
      `   · KR: ${sections.kr.length - gaps.kr.length}/${sections.kr.length}` +
      `   · Site: ${sections.site.length - gaps.site.length}/${sections.site.length}` +
      `   · Admin·Templates: ${sections.admin.length}개(화면으로 그려짐 — 아래 참조)`,
  )

  // 알려진 갭 — **사유와 만료가 있어야 한다.** 사유 없는 면제는 부채가 아니라 거짓말이다.
  const KNOWN_GAPS = {
    // InputBase 항목은 **제거됐다**(2026-07). "DS/InputBase 세트 신설 예정"이 사유였는데 세트가 실제로
    // 생겨(categories-core.ts) 커버리지 갭이 해소됐고, 남은 것은 커버리지가 아니라 이름 규약이라
    // verify-naming이 본다 — 여기 남겨 두면 stale 검사가 계속 실패시킨다(정상 동작이다).
    // Admin/Templates 는 세트가 아니라 **화면**(17·18번 페이지)으로 그려진다.
    // 어떤 것이 세트여야 하고 어떤 것이 화면이어야 하는지 규칙이 아직 없다 → 17번 모듈화 배치에서 확정한다.
  }
  const allGaps = [...gaps.general, ...gaps.kr, ...gaps.site, ...gaps.storyless]
  const unexpected = allGaps.filter((g) => !(g in KNOWN_GAPS))
  const stale = Object.keys(KNOWN_GAPS).filter((k) => !allGaps.includes(k))

  if (allGaps.length) {
    console.log(`  알려진 갭 ${allGaps.length}건 (전부 사유 있음):`)
    for (const g of allGaps) console.log(`    · ${g} — ${KNOWN_GAPS[g] ?? '(사유 없음)'}`)
  }
  for (const u of unexpected) note(`Figma 세트 없는 Storybook 컴포넌트: ${u} — 세트를 만들거나 KNOWN_GAPS 에 사유를 적어라`)
  for (const s of stale) note(`KNOWN_GAPS 가 썩었다: ${s} — 이미 해소됐으니 목록에서 지워라`)
} catch (e) {
  // 조용한 스킵 금지 — 계산이 깨지면 커버리지는 **검사되지 않은 것**이지 통과한 것이 아니다.
  note(`커버리지 계산이 실패했다: ${e.message}`)
}

// ── 결과 ──────────────────────────────────────────────────────────────
if (fail.length) {
  console.error('✗ 토큰 패리티 실패:\n' + fail.map((m) => '  - ' + m).join('\n'))
  process.exit(1)
}
console.log(
  `✓ 토큰 패리티 OK — 프리셋 ${names.length}개 × 변수 ${mappingCount}개 (Figma <group>/<key> ⇔ Storybook --ds-<group>-<key>), 값은 tokens/*.json 단일 소스.`,
)
console.log(`✓ 아이콘 패리티 OK — Storybook Lucide 갤러리 ${iconCount}개 아이콘 전부 Figma _Icon/* 존재.`)
console.log(`✓ 로고 패리티 OK — Storybook 소셜 로고 ${logoCount}개 전부 Figma logos-data.ts 존재(fill 보존).`)
