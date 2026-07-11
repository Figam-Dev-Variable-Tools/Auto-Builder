// svg-path.ts 검증: 실제 소스를 esbuild로 번들해 Node에서 실행한다(Figma 런타임 없이).
// 모든 아이콘 + 합성 엣지케이스가 Figma-safe(M/L/C/Z 절대·유한수)로 변환되는지 확인.
import { build } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const tmp = resolve(root, 'dist', '_test-svg-path.mjs')

await build({
  entryPoints: [resolve(root, 'scripts', '_svg-path-entry.ts')],
  bundle: true,
  format: 'esm',
  outfile: tmp,
  logLevel: 'silent',
})
const { svgToFigmaPath, ICON_PATHS } = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`)

let failures = 0
const fail = (name, msg) => {
  failures++
  console.error(`  ✗ ${name}: ${msg}`)
}

// 출력 재토큰화: Figma가 받는 구조(M/L/C/Z + 유한수, 인자수 정확)인지 검증 후 bbox 반환.
function validateFigmaPath(name, out) {
  if (!/^[MLCZ0-9.\-\s]*$/.test(out)) {
    fail(name, `허용되지 않은 문자 포함: ${out.slice(0, 60)}`)
    return null
  }
  const toks = out.split(/\s+/).filter(Boolean)
  const counts = { M: 2, L: 2, C: 6, Z: 0 }
  let j = 0
  let cx = 0
  let cy = 0
  let started = false
  const ex = [] // 끝점 좌표(moveto/lineto/curve endpoint) — 좌표 범위 검사용
  const ey = []
  const ax = [] // 제어점 포함 전체 — 면적(비퇴화) 검사용
  const ay = []
  while (j < toks.length) {
    const cmd = toks[j++]
    if (!(cmd in counts)) {
      fail(name, `알 수 없는 명령 토큰 '${cmd}'`)
      return null
    }
    if (cmd === 'M' && !started) started = true
    else if (!started) {
      fail(name, `M으로 시작하지 않음`)
      return null
    }
    const need = counts[cmd]
    const nums = []
    for (let k = 0; k < need; k++) {
      const v = Number(toks[j++])
      if (!Number.isFinite(v)) {
        fail(name, `유한하지 않은 수 (cmd ${cmd})`)
        return null
      }
      nums.push(v)
    }
    if (cmd === 'M' || cmd === 'L') {
      cx = nums[0]
      cy = nums[1]
      ex.push(cx)
      ey.push(cy)
      ax.push(cx)
      ay.push(cy)
    } else if (cmd === 'C') {
      ax.push(nums[0], nums[2], nums[4])
      ay.push(nums[1], nums[3], nums[5])
      cx = nums[4]
      cy = nums[5]
      ex.push(cx)
      ey.push(cy)
    }
  }
  if (!started) {
    fail(name, `빈 path`)
    return null
  }
  return {
    // 좌표 범위: 끝점 기준(제어점은 곡선 성형용으로 그리드 밖에 나갈 수 있음 — 하트)
    minX: Math.min(...ex),
    maxX: Math.max(...ex),
    minY: Math.min(...ey),
    maxY: Math.max(...ey),
    // 면적: 제어점 포함 전체 span(완전 퇴화 방지)
    spanX: Math.max(...ax) - Math.min(...ax),
    spanY: Math.max(...ay) - Math.min(...ay),
    endX: cx,
    endY: cy,
  }
}

console.log('· 아이콘 35종 변환 검증')
let iconCount = 0
for (const [name, raw] of Object.entries(ICON_PATHS)) {
  iconCount++
  // 런타임과 동일하게: 각 <path d>를 독립 변환 후 합침
  const parts = Array.isArray(raw) ? raw : [raw]
  let out
  try {
    out = parts.map(svgToFigmaPath).join(' ')
  } catch (e) {
    fail(name, `변환 예외: ${e.message}`)
    continue
  }
  const bbox = validateFigmaPath(name, out)
  if (!bbox) continue
  // Lucide 24그리드 stroke 아이콘: 끝점이 상식 범위(여유 포함) 안. 선 아이콘(Minus 등)은
  // 한 축 span이 0이므로 span 합으로만 비퇴화 확인.
  if (bbox.minX < -3 || bbox.maxX > 27 || bbox.minY < -3 || bbox.maxY > 27) {
    fail(name, `끝점 범위 이상: [${bbox.minX},${bbox.minY} → ${bbox.maxX},${bbox.maxY}]`)
  }
  if (bbox.spanX + bbox.spanY < 2) {
    fail(name, `면적 없음: span [${bbox.spanX}, ${bbox.spanY}]`)
  }
}
console.log(`  아이콘 ${iconCount}종 처리`)

console.log('· 합성 엣지케이스')
const cases = [
  ['packed-decimals(star fragment)', 'M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765z'],
  ['arc-packed-flags', 'M8 8a3 3 0 1 0 0-6'],
  ['arc-absolute', 'M.5 1A.5.5 0 0 1 1 .5L1 1Z'],
  ['h-v-shorthand', 'M0 0H10V10H0Z'],
  ['smooth-cubic', 'M0 0C0 5 5 5 5 0S10 -5 10 0'],
  ['quad-and-smooth', 'M0 0Q5 5 10 0T20 0'],
  ['implicit-lineto', 'M0 0 1 1 2 2 3 3'],
  ['relative-mixed', 'm1 1 2 0 0 2-2 0z'],
  ['exponent', 'M1e1 0 L 0 1e1'],
]
for (const [name, raw] of cases) {
  let out
  try {
    out = svgToFigmaPath(raw)
  } catch (e) {
    fail(name, `변환 예외: ${e.message}`)
    continue
  }
  validateFigmaPath(name, out)
}

// arc 끝점 연속성: A의 종료점이 변환된 마지막 C의 종료점과 일치해야 함
{
  const out = svgToFigmaPath('M2 2A4 4 0 0 1 10 2')
  const b = validateFigmaPath('arc-endpoint', out)
  if (b) {
    if (Math.abs(b.endX - 10) > 0.01 || Math.abs(b.endY - 2) > 0.01) {
      fail('arc-endpoint', `끝점 불일치: (${b.endX},${b.endY}) ≠ (10,2)`)
    }
  }
}

writeFileSync(tmp, '') // 정리
if (failures > 0) {
  console.error(`\n✗ svg-path 검증 실패: ${failures}건`)
  process.exit(1)
}
console.log('\n✓ svg-path 검증 통과 — 모든 path가 Figma-safe(M/L/C/Z 절대)')
