// Stage C — D1/D2/D3의 §3 매핑 정보 + tokens 3프리셋을 packages/figma-story-tools/manifest.json으로 직렬화.
// 소스는 src/ds TSX(타입)와 *.stories.tsx(기본값) — 코드가 SSOT다.
// 산출 스키마는 figma-plugin ComponentManifest와 동일해야 하며(왕복 동일성),
// 빌드 말미에 플러그인 내장 COMPONENT_MANIFEST와 deep-equal 검증한다.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import {
  parsePropsFile,
  classifyProps,
  parseBooleanDefaults,
  parseStoryTextDefaults,
} from './lib/ds-props.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'packages', 'figma-story-tools')
mkdirSync(join(outDir, 'tokens'), { recursive: true })

// §3 규약 상수 (코드에서 파생 불가한 Figma측 매핑)
const KIND = { Button: 'button', TextField: 'textfield', Card: 'card', Alert: 'alert', Badge: 'badge' }
const SWAP_RULES = {
  icon: { default: '_Icon/Star', preferred: ['_Icon/Star', '_Icon/Heart', '_Icon/Bell'] },
}

function buildComponentSpec(component, file = component) {
  const { props, src } = parsePropsFile(root, component, file)
  const cls = classifyProps(props)
  const boolDefaults = parseBooleanDefaults(src)
  const textDefaults = parseStoryTextDefaults(root, component, file)

  return {
    name: `DS/${component}`,
    kind: KIND[component],
    variants: cls.axes,
    text: cls.text.map((name) => ({ name, default: textDefaults[name] ?? name })),
    booleans: cls.booleans.map((name) => ({ name, default: boolDefaults[name] ?? false })),
    swaps: cls.swaps.map((name) => ({ name, ...SWAP_RULES[name] })),
    ...(cls.slot ? { slot: { name: cls.slot } } : {}),
  }
}

const components = ['Button', 'TextField', 'Card', 'Alert', 'Badge'].map((c) => buildComponentSpec(c))

// D2/D3 섹션
const social = (() => {
  const { props } = parsePropsFile(root, 'SocialLoginButton')
  return {
    name: 'DS/SocialLoginButton',
    providers: props.find((p) => p.name === 'provider').values,
    sizes: props.find((p) => p.name === 'size').values,
  }
})()
const chart = (() => {
  const { props } = parsePropsFile(root, 'Chart', 'DsChart')
  return { name: 'DS/Chart', types: props.find((p) => p.name === 'type').values }
})()

// tokens 3프리셋 동봉
const tokens = {}
for (const f of readdirSync(join(root, 'tokens')).filter((f) => f.endsWith('.json'))) {
  const json = JSON.parse(readFileSync(join(root, 'tokens', f), 'utf8'))
  tokens[json.$preset] = json
  copyFileSync(join(root, 'tokens', f), join(outDir, 'tokens', f))
}

const pkg = JSON.parse(readFileSync(join(outDir, 'package.json'), 'utf8'))
const manifest = { name: 'figma-story-tools', version: pkg.version, components, social, chart, tokens }

// ── 왕복 동일성 검증: 소스 파생 매니페스트 == 플러그인 내장 COMPONENT_MANIFEST ──
// (생성기는 매니페스트 입력에 결정론적이므로, 데이터 동일 ⇒ 생성 결과 동일)
const tmpOut = join(root, 'figma-plugin', 'dist', '__manifest-check.mjs')
execFileSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'esbuild',
    join(root, 'figma-plugin', 'src', 'generators', 'components.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${tmpOut}`,
  ],
  { cwd: join(root, 'figma-plugin'), stdio: 'pipe', shell: process.platform === 'win32' },
)
const { COMPONENT_MANIFEST } = await import(pathToFileURL(tmpOut).href)
rmSync(tmpOut)

const mismatches = []
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
if (!eq(components, COMPONENT_MANIFEST.components))
  mismatches.push('components 섹션이 플러그인 내장 매니페스트와 다름')
if (!eq(social, COMPONENT_MANIFEST.social)) mismatches.push('social 섹션 불일치')
if (!eq(chart, COMPONENT_MANIFEST.chart)) mismatches.push('chart 섹션 불일치')
if (mismatches.length > 0) {
  console.error('build-story-manifest FAIL(왕복 동일성):\n' + mismatches.join('\n'))
  console.error('\n소스 파생:\n' + JSON.stringify({ components, social, chart }, null, 2))
  process.exit(1)
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `build-story-manifest OK — packages/figma-story-tools/manifest.json (components ${components.length}, tokens ${Object.keys(tokens).length}프리셋, 플러그인 내장 매니페스트와 동일)`,
)
