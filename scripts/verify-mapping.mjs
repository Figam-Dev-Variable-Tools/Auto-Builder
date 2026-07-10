// V1-2 — 매핑 규약 검증: src/ds/* props ↔ figma-plugin COMPONENT_MANIFEST 대조
// 파싱/분류 로직은 scripts/lib/ds-props.mjs 공유 (build-story-manifest.mjs와 SSOT)
import { rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { parsePropsFile, classifyProps } from './lib/ds-props.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

// ── 1. 플러그인 매니페스트 로드 (esbuild로 TS → ESM 변환 후 import) ──
export async function loadPluginManifest() {
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
  const mod = await import(pathToFileURL(tmpOut).href)
  rmSync(tmpOut)
  return mod.COMPONENT_MANIFEST
}

const COMPONENT_MANIFEST = await loadPluginManifest()
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function check(component, manifestName) {
  const spec = COMPONENT_MANIFEST.components.find((c) => c.name === manifestName)
  if (!spec) {
    failures.push(`${manifestName}: 매니페스트에 없음`)
    return
  }
  const { props } = parsePropsFile(root, component)
  const expect = classifyProps(props)

  const actualAxes = spec.variants.map((v) => ({ name: v.name, values: v.values }))
  if (!eq(actualAxes, expect.axes))
    failures.push(
      `${manifestName}: variant 축 불일치\n  기대(D1): ${JSON.stringify(expect.axes)}\n  실제(P3): ${JSON.stringify(actualAxes)}`,
    )
  if (!eq(spec.text.map((t) => t.name), expect.text))
    failures.push(`${manifestName}: TEXT 불일치 — 기대 ${expect.text} vs 실제 ${spec.text.map((t) => t.name)}`)
  if (!eq(spec.booleans.map((b) => b.name), expect.booleans))
    failures.push(`${manifestName}: BOOLEAN 불일치 — 기대 ${expect.booleans} vs 실제 ${spec.booleans.map((b) => b.name)}`)
  if (!eq(spec.swaps.map((s) => s.name), expect.swaps))
    failures.push(`${manifestName}: INSTANCE_SWAP 불일치 — 기대 ${expect.swaps} vs 실제 ${spec.swaps.map((s) => s.name)}`)
  const actualSlot = spec.slot ? spec.slot.name : null
  if (actualSlot !== expect.slot)
    failures.push(`${manifestName}: slot 불일치 — 기대 ${expect.slot} vs 실제 ${actualSlot}`)
}

check('Button', 'DS/Button')
check('TextField', 'DS/TextField')
check('Card', 'DS/Card')
check('Alert', 'DS/Alert')
check('Badge', 'DS/Badge')

// D2: provider/size 유니온 ↔ manifest.social
{
  const { props } = parsePropsFile(root, 'SocialLoginButton')
  const provider = props.find((p) => p.name === 'provider')
  const size = props.find((p) => p.name === 'size')
  if (!eq(provider?.values, COMPONENT_MANIFEST.social.providers))
    failures.push(`DS/SocialLoginButton: provider 불일치 — ${provider?.values} vs ${COMPONENT_MANIFEST.social.providers}`)
  if (!eq(size?.values, COMPONENT_MANIFEST.social.sizes))
    failures.push(`DS/SocialLoginButton: size 불일치 — ${size?.values} vs ${COMPONENT_MANIFEST.social.sizes}`)
}

// D3: type 유니온 ↔ manifest.chart.types
{
  const { props } = parsePropsFile(root, 'Chart', 'DsChart')
  const type = props.find((p) => p.name === 'type')
  if (!eq(type?.values, COMPONENT_MANIFEST.chart.types))
    failures.push(`DS/Chart: type 불일치 — ${type?.values} vs ${COMPONENT_MANIFEST.chart.types}`)
}

if (failures.length > 0) {
  console.error(`verify-mapping FAIL — ${failures.length}건:\n` + failures.join('\n'))
  process.exit(1)
}
console.log('verify-mapping OK — D1~D3 props ↔ P3 매니페스트 불일치 0건')
