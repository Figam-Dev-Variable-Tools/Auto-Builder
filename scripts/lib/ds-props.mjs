// 공유 파서 — src/ds TSX props를 §3 매핑 규약으로 분류한다.
// 소비자: scripts/verify-mapping.mjs (검증), scripts/build-story-manifest.mjs (Stage C 직렬화)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** TSX의 export type <X>Props 블록을 파싱해 props 목록을 반환 */
export function parsePropsFile(root, component, file = component) {
  const src = readFileSync(join(root, 'src', 'ds', component, `${file}.tsx`), 'utf8')
  const m = src.match(/export type \w+Props = \{([\s\S]*?)\n\}/)
  if (!m) throw new Error(`${component}: Props 타입을 찾지 못함`)
  const props = []
  for (const line of m[1].split('\n')) {
    const pm = line.match(/^\s*(\w+)(\?)?:\s*(.+?)\s*$/)
    if (!pm) continue
    const [, name, optional, typeStr] = pm
    if (typeStr.includes("'")) {
      const values = [...typeStr.matchAll(/'([^']+)'/g)].map((x) => x[1])
      props.push({ name, kind: 'union', values, optional: !!optional })
    } else if (typeStr.startsWith('boolean')) {
      props.push({ name, kind: 'boolean', optional: !!optional })
    } else if (typeStr.startsWith('string')) {
      props.push({ name, kind: 'string', optional: !!optional })
    } else if (typeStr.includes('ReactNode')) {
      props.push({ name, kind: name === 'children' ? 'children' : 'swap', optional: !!optional })
    }
  }
  return { props, src }
}

/** §3 분류: union → variant axis / show* boolean → BOOLEAN / 기타 boolean → variant(true/false)
 *  string → TEXT / ReactNode → INSTANCE_SWAP / children → slot('content') */
export function classifyProps(props) {
  const axes = []
  const text = []
  const booleans = []
  const swaps = []
  let slot = null
  for (const p of props) {
    if (p.kind === 'union') axes.push({ name: p.name, values: p.values })
    else if (p.kind === 'boolean' && p.name.startsWith('show')) booleans.push(p.name)
    else if (p.kind === 'boolean') axes.push({ name: p.name, values: ['false', 'true'] })
    else if (p.kind === 'string') text.push(p.name)
    else if (p.kind === 'swap') swaps.push(p.name)
    else if (p.kind === 'children') slot = 'content'
  }
  return { axes, text, booleans, swaps, slot }
}

/** 컴포넌트 함수 시그니처의 구조분해 기본값 파싱: `showIcon = false` → { showIcon: false } */
export function parseBooleanDefaults(src) {
  const out = {}
  for (const m of src.matchAll(/(\w+)\s*=\s*(true|false)/g)) {
    out[m[1]] = m[2] === 'true'
  }
  return out
}

/** *.stories.tsx의 meta args 블록에서 문자열 기본값 파싱: label: 'Button' */
export function parseStoryTextDefaults(root, component, file = component) {
  const src = readFileSync(join(root, 'src', 'ds', component, `${file}.stories.tsx`), 'utf8')
  const m = src.match(/args:\s*\{([\s\S]*?)\n\s*\}/)
  const out = {}
  if (!m) return out
  for (const pm of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) {
    out[pm[1]] = pm[2]
  }
  return out
}
