// 브랜드/소셜 로고 → Figma 프레임(다색 FILL 벡터). 오너 규칙: Storybook 로고 SVG를 그대로.
// 아이콘(icon-vec.ts)은 stroke 라인아트지만, 브랜드 로고는 원본 fill·색·레이어 순서를 보존한다.
import { LOGOS_DATA } from '../logos-data'
import { hexToRgb } from '../presets'
import { svgToFigmaPath } from '../svg-path'
import { bindFontVars, type Ctx, txt } from './foundations'

const NUM = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi

// M/L/C/Z 절대 경로의 좌표쌍을 아핀 변환: (x,y) → ((x-minX)*s, (y-minY)*s).
// svgToFigmaPath 출력은 A/H/V/S/T 없이 좌표쌍만 있으므로 x,y 교대 파싱이 안전하다.
function transformPath(d: string, minX: number, minY: number, s: number): string {
  let isX = true
  return d.replace(NUM, (n) => {
    const v = parseFloat(n)
    const r = isX ? (v - minX) * s : (v - minY) * s
    isX = !isX
    return String(Math.round(r * 1000) / 1000)
  })
}

// 변환된 경로의 bbox 좌상단(Figma는 벡터 지오메트리를 bbox-min→로컬원점으로 정규화 → 노드 x/y로 복원).
function bboxMin(d: string): [number, number] {
  let isX = true
  let mnX = Infinity
  let mnY = Infinity
  let m: RegExpExecArray | null
  NUM.lastIndex = 0
  while ((m = NUM.exec(d))) {
    const v = parseFloat(m[0])
    if (isX) mnX = Math.min(mnX, v)
    else mnY = Math.min(mnY, v)
    isX = !isX
  }
  return [mnX === Infinity ? 0 : mnX, mnY === Infinity ? 0 : mnY]
}

/** 브랜드 로고를 size×size 프레임(다색 fill 벡터들)으로 반환. 없거나 변환 실패 시 null. */
export function brandLogo(key: string, size: number): FrameNode | null {
  const data = LOGOS_DATA[key]
  if (!data) return null
  const [minX, minY, vbW, vbH] = data.viewBox
  const s = size / Math.max(vbW, vbH) // 로고 viewBox는 정사각 → 균일 스케일
  const box = figma.createFrame()
  box.name = key
  box.resize(size, size)
  box.fills = []
  box.clipsContent = false
  let added = 0
  for (const p of data.paths) {
    let fd: string
    try {
      fd = svgToFigmaPath(p.d)
    } catch {
      continue
    }
    const td = transformPath(fd, minX, minY, s)
    const [mnX, mnY] = bboxMin(td)
    const v = figma.createVector()
    v.vectorPaths = [{ windingRule: 'NONZERO', data: td }]
    v.strokes = []
    v.fills = [{ type: 'SOLID', color: hexToRgb(p.fill) }]
    box.appendChild(v)
    v.x = mnX
    v.y = mnY
    added++
  }
  if (!added) {
    box.remove()
    return null
  }
  return box
}

/**
 * 브랜드 고정색 채우기 — 카카오·네이버 등 3rd-party 브랜드 마크는 사용자 테마 색으로 바뀌면 안 된다
 * (카카오 노랑이 사용자 메인 컬러가 되면 그건 카카오가 아니다). brand-logos.ts가 이 파일처럼
 * verify-bindings ALLOWLIST(B1) 대상이라 여기 두면 raw hex를 써도 게이트가 정확히 판단한다 —
 * 호출부(예: 본인인증 수단 목록)를 위해 이 파일 밖에서도 쓸 수 있게 export한다.
 */
export function brandColorFill(node: GeometryMixin, hex: string) {
  node.fills = [{ type: 'SOLID', color: hexToRgb(hex) }]
}
/** 브랜드 고정색 테두리(예: Google 버튼의 #DADCE0 규정 보더) — fill과 같은 근거. */
export function brandColorStroke(node: MinimalStrokesMixin, hex: string) {
  node.strokes = [{ type: 'SOLID', color: hexToRgb(hex) }]
}

/**
 * 브랜드 고정색 텍스트(카카오 버튼 라벨 "카카오 로그인" 등) — 색은 브랜드 규정색으로 고정하되
 * 크기·굵기·글씨체는 여전히 변수에 문다(오너: 폰트는 전부 변수 — 색만 못 바꾸는 것과는 별개다).
 * 출처: src/ds/SocialLoginButton/brand.css "부록 E — 소셜 브랜드 규정표(변경 금지)".
 */
export function brandColorText(ctx: Ctx, chars: string, size: number, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, hex, bold)
  return bindFontVars(ctx, t, size, bold)
}
