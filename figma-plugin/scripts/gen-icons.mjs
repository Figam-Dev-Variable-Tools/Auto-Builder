// lucide-react(스토리북 Icons/Lucide에서 쓰는 라이브러리) → figma-plugin/src/icons-data.ts
// 오너 규칙: 스토리북 아이콘을 그대로. Lucide는 24그리드 stroke 아이콘(fill:none)이라
// 플러그인은 이 path들을 "선(stroke)"으로 렌더한다(Figma fill 와인딩 문제 회피).
// 값은 아이콘별 subpath d 문자열 배열(24그리드). 재생성: pnpm --dir figma-plugin gen:icons
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const iconsDir = resolve(root, 'node_modules', 'lucide-react', 'dist', 'esm', 'icons')

// [Figma 이름(_Icon/<Name>), lucide 파일 후보(존재하는 첫 번째)]
// Search/Eye/Close/Minus/Plus/Check는 컴포넌트 어포던스가 참조. Star/Heart/Bell은 매니페스트 swap 참조.
const MAP = [
  ['Star', ['star']],
  ['Heart', ['heart']],
  ['Bell', ['bell']],
  ['House', ['house', 'home']],
  ['Person', ['user']],
  ['Envelope', ['mail']],
  ['Phone', ['phone']],
  ['Settings', ['settings']],
  ['Calendar', ['calendar']],
  ['Clock', ['clock']],
  ['Search', ['search']],
  ['Trash', ['trash-2', 'trash']],
  ['Edit', ['pencil', 'pencil-line']],
  ['Plus', ['plus']],
  ['Minus', ['minus']],
  ['Close', ['x']],
  ['Check', ['check']],
  ['Info', ['info']],
  ['Warning', ['triangle-alert', 'alert-triangle']],
  ['Help', ['circle-help', 'help-circle']],
  ['AlertCircle', ['circle-alert', 'alert-circle']],
  ['Camera', ['camera']],
  ['Cart', ['shopping-cart']],
  ['Chat', ['message-circle']],
  ['Cloud', ['cloud']],
  ['Image', ['image']],
  ['Lock', ['lock']],
  ['Unlock', ['lock-open', 'unlock']],
  ['Eye', ['eye']],
  ['EyeOff', ['eye-off']],
  ['Key', ['key']],
  ['Folder', ['folder']],
  ['File', ['file-text']],
  ['Bookmark', ['bookmark']],
  ['Tag', ['tag']],
  ['Flag', ['flag']],
  ['Gift', ['gift']],
  ['Download', ['download']],
  ['Upload', ['upload']],
  ['Link', ['link']],
  ['Share', ['share-2']],
  ['Paperclip', ['paperclip']],
  ['MapPin', ['map-pin']],
  ['CreditCard', ['credit-card']],
  ['Play', ['play']],
  ['Pause', ['pause']],
  ['Menu', ['menu']],
  ['ChevronDown', ['chevron-down']],
  ['ChevronUp', ['chevron-up']],
  ['ChevronLeft', ['chevron-left']],
  ['ChevronRight', ['chevron-right']],
  ['ArrowLeft', ['arrow-left']],
  ['ArrowRight', ['arrow-right']],
  ['Refresh', ['refresh-cw']],
  ['Filter', ['filter', 'funnel']],
  ['List', ['list']],
  ['Globe', ['globe']],
  ['Sun', ['sun']],
  ['Moon', ['moon']],
  ['BookOpen', ['book-open']],
]

// SVG 원시 도형 → path d (stroke용). 원/선/사각형/폴리라인을 path로 통일.
const K = 0.5522847498307936
function circleD(cx, cy, r) {
  const k = K * r
  return (
    `M${cx - r} ${cy}` +
    `C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}` +
    `C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}` +
    `C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}` +
    `C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}Z`
  )
}
function ellipseD(cx, cy, rx, ry) {
  const kx = K * rx
  const ky = K * ry
  return (
    `M${cx - rx} ${cy}` +
    `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}` +
    `C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
    `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
    `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}Z`
  )
}
function rectD(x, y, w, h, rx, ry) {
  const r = rx || ry || 0
  if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
  const k = K * r
  return (
    `M${x + r} ${y}H${x + w - r}` +
    `C${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}V${y + h - r}` +
    `C${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h}H${x + r}` +
    `C${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r}V${y + r}` +
    `C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`
  )
}
function pointsD(points, close) {
  const p = points.trim().split(/[\s,]+/).map(Number)
  let d = `M${p[0]} ${p[1]}`
  for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`
  return d + (close ? 'Z' : '')
}
function elToD(tag, a) {
  if (tag === 'path') return a.d
  if (tag === 'circle') return circleD(+a.cx, +a.cy, +a.r)
  if (tag === 'ellipse') return ellipseD(+a.cx, +a.cy, +a.rx, +a.ry)
  if (tag === 'line') return `M${a.x1} ${a.y1}L${a.x2} ${a.y2}`
  if (tag === 'rect') return rectD(+a.x, +a.y, +a.width, +a.height, +(a.rx || 0), +(a.ry || 0))
  if (tag === 'polyline') return pointsD(a.points, false)
  if (tag === 'polygon') return pointsD(a.points, true)
  return null
}

function iconNodeOf(file) {
  const src = readFileSync(resolve(iconsDir, `${file}.mjs`), 'utf8')
  const m = src.match(/const __iconNode\s*=\s*(\[[\s\S]*?\]);/)
  if (!m) return null
  // [tag, {attrs}] 배열 — 패키지 산출물이라 안전하게 eval
  // eslint-disable-next-line no-eval
  return eval(m[1])
}

const out = {}
const skipped = []
for (const [name, candidates] of MAP) {
  const file = candidates.find((c) => existsSync(resolve(iconsDir, `${c}.mjs`)))
  if (!file) {
    skipped.push(name + '(no file)')
    continue
  }
  const node = iconNodeOf(file)
  if (!node) {
    skipped.push(name + '(no node)')
    continue
  }
  const ds = node.map(([tag, attrs]) => elToD(tag, attrs)).filter(Boolean)
  if (!ds.length) {
    skipped.push(name + '(empty)')
    continue
  }
  out[`_Icon/${name}`] = ds
}

const ts =
  '// AUTO-GENERATED by scripts/gen-icons.mjs — lucide-react(스토리북 Icons/Lucide) 24그리드 stroke path.\n' +
  '// DO NOT EDIT. 재생성: pnpm --dir figma-plugin gen:icons\n' +
  '// 값 = 아이콘별 subpath d 배열(24그리드). 플러그인은 "선(stroke)"으로 렌더한다.\n' +
  `export const ICON_PATHS: Record<string, string[]> = ${JSON.stringify(out, null, 2)}\n`
writeFileSync(resolve(here, '..', 'src', 'icons-data.ts'), ts)
console.log(
  `gen-icons OK — ${Object.keys(out).length} lucide icons → figma-plugin/src/icons-data.ts` +
    (skipped.length ? ` (skipped: ${skipped.join(', ')})` : ''),
)
