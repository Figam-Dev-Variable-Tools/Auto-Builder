// 카테고리 생성기 3분할의 공용 부품 — 렌더 헬퍼·색 바인딩·KR 폼 조각·문서 타입.
// 왜 따로 두는가: DS/Form(Layout)이 KR 폼 헬퍼를 재사용하는 등 섹션 간 실제 공유가 있다.
// 사본을 만들지 말고 여기서 가져다 써라. 세트 빌더 자체는 lib/build-set.ts가 정본이다.
// boundText·bindFillVar·bindStrokeVar의 정본은 lib/bind.ts다(foundations.ts가 재수출) — 이 파일은
// 예전에 자체 사본을 갖고 있었다(verify-bindings B4). 여기서 다시 export해 categories-core·
// categories-data-kr-media·categories-nav-overlay의 기존 import 경로('./categories-shared')를 유지한다.
import { ACCENT, autoFrame, bindFillVar, bindStrokeVar, BORDER, boundPaint, boundText, type Ctx, INK, MUTED, solid, SUB, SURFACE, WHITE } from './foundations'
import { iconInstance } from './icon-vec'
import { type State } from './lib/build-set'
import { onToneHex, onVarName, solidToneHex, solidVarName } from './tone'

export const FIELD_W = 300
export const PAGE_INPUT = '1. System - Input'
export const PAGE_SELECTION = '2. System - Selection'
export const PAGE_ACTION = '3. System - Action'
export const PAGE_FEEDBACK = '4. System - Feedback'
export const PAGE_NAV = '5. System - Navigation'
export const PAGE_LAYOUT = '6. System - Layout'
export const PAGE_OVERLAY = '7. System - Overlay'
export const PAGE_DATA = '8. System - Data'
export const PAGE_STRUCTURE = '9. System - Structure'
export const PAGE_DATETIME = '10. System - Date & Time'
export const PAGE_KR = '11. System - Korea Templates'
export const PAGE_MEDIA = '12. System - Media'
export const PAGE_TEMPLATES = '13. System - Templates'
export const PAGE_ETC = '14. System - ETC'

export const VARIANT_HEX: Record<string, string> = {
  primary: ACCENT,
  secondary: SUB,
  error: '#F04452',
  success: '#00C471',
  warning: '#FF9F0A',
  // 브랜드가 아닌 검정 톤 — 변수(color/neutral 등)가 항상 존재하므로 실사용되진 않는 폴백.
  neutral: INK,
}
// soft(연한 톤) 배경 폴백 — 변수 color/<tone>/100 이 없을 때만 쓰는 리터럴(흰색 쪽으로 mix).
export function tintHex(hex: string, amt = 0.86): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return '#' + ((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')
}

// ── 색 바인딩 헬퍼 — 정본은 lib/bind.ts, 여기서는 재수출만 한다 ────────
export { boundText, bindFillVar, bindStrokeVar }

// 이미지 스크림 위 반투명 흰 글자 — React(ImageCard.module.css .overlayDescription)는
// `color: rgb(255 255 255 / 0.85)`로 그린다(paint 알파). 오너: "폰트에 불투명도 걸지 마라, 100%여야
// 한다"는 **노드 opacity**(자간·그림자까지 통째로 흐려짐)를 금지한 것이지, React가 이미 쓰는 이
// paint 알파(색 자체의 반투명)와는 다른 문제다 — React 값을 그대로 따른다.
export const OVERLAY_DESC_ALPHA = 0.85
/** 텍스트 노드의 fill(들어온 그대로, 변수 바인딩 포함)에 알파만 얹는다 — 노드 opacity는 건드리지 않는다. */
export function overlayAlpha(node: TextNode, alpha: number) {
  const fills = node.fills
  if (!Array.isArray(fills) || !fills.length) return
  node.fills = [{ ...(fills[0] as SolidPaint), opacity: alpha }]
}

// ── solid 면 · on-color 바인딩 ────────────────────────────────────────
// 오너 확정: 브랜드 hue는 유지하되 solid 면 위 글자는 흰색이 기본.
//   면   = color/solid-<tone>  (base에서 계산된 파생 변수 — tokens.ts가 생성)
//   글자 = color/on-<tone>     (그 면 위 AA를 통과하는 전경색)
// soft/outline/ghost의 톤 글자는 웹(Button.module.css의 --tone = --ds-color-<tone>)과 같은
// 셰이드, 즉 base인 color/<tone>을 그대로 쓴다.
/** 톤의 base hex — 사용자가 고른 색 > 프리셋 폴백. 변수가 없을 때만 쓰인다. */
export function toneBase(ctx: Ctx, tone: string): string {
  return ctx.userColors['color/' + tone] || VARIANT_HEX[tone] || ACCENT
}
/** solid 면 fill — color/solid-<tone> 바인딩(없으면 같은 공식으로 계산한 hex). */
export function bindSolidFill(ctx: Ctx, node: GeometryMixin, tone: string) {
  bindFillVar(ctx, node, solidVarName(tone), solidToneHex(toneBase(ctx, tone)))
}
/** solid 면 위 도형(노브·체크바 등) fill — color/on-<tone> 바인딩. */
export function bindOnFill(ctx: Ctx, node: GeometryMixin, tone: string) {
  bindFillVar(ctx, node, onVarName(tone), onToneHex(toneBase(ctx, tone)))
}
/** solid 면 위 전경 hex(변수 없을 때의 폴백 · txt() 리터럴용). */
export function onHex(ctx: Ctx, tone: string): string {
  return onToneHex(toneBase(ctx, tone))
}
export function fixedFrame(name: string, dir: 'HORIZONTAL' | 'VERTICAL', w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.fills = []
  return f
}

// ══ ACTION 계열 (Button / Badge) ═════════════════════════════════════
/** 인스턴스 아이콘 색 오버라이드(버튼 위 흰색 등). */
export function recolorIcon(node: SceneNode, hex: string) {
  if (node.type === 'INSTANCE') {
    const v = node.findOne((n) => n.type === 'VECTOR')
    if (v) (v as VectorNode).strokes = [solid(hex)]
  }
}
/** 인스턴스 아이콘 색을 변수에 바인딩(없으면 hex). 아이콘도 글자와 같은 색 토큰을 따라간다. */
export function recolorIconVar(ctx: Ctx, node: SceneNode, varName: string, hex: string) {
  if (node.type !== 'INSTANCE') return
  const vv = ctx.vars.get(varName)
  const v = node.findOne((n) => n.type === 'VECTOR')
  if (v) (v as VectorNode).strokes = [vv ? boundPaint(vv) : solid(ctx.userColors[varName] ?? hex)]
}
/** solid 면 위 아이콘 — color/on-<tone> 바인딩. */
export function recolorIconOn(ctx: Ctx, node: SceneNode, tone: string) {
  recolorIconVar(ctx, node, onVarName(tone), onHex(ctx, tone))
}

// ══ INPUT 복합 (Select / MultiSelect / Slider / Upload) ══════════════
export function inputShell(ctx: Ctx, label: string, disabled: boolean): { c: ComponentNode; addField: (f: SceneNode) => void } {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(FIELD_W, c.height)
  c.primaryAxisSizingMode = 'AUTO'
  c.itemSpacing = 6
  c.fills = []
  if (disabled) c.opacity = 0.45
  const lbl = boundText(ctx, label, 13, 'color/text', INK, true)
  lbl.name = 'label'
  c.appendChild(lbl)
  return { c, addField: (f) => c.appendChild(f) }
}
export function fieldRow(ctx: Ctx, toneVar: string | null, toneHex: string | null, disabled: boolean): FrameNode {
  const row = autoFrame('field', 'HORIZONTAL')
  row.counterAxisAlignItems = 'CENTER'
  row.layoutAlign = 'STRETCH'
  row.primaryAxisSizingMode = 'FIXED'
  row.itemSpacing = 8
  row.paddingTop = row.paddingBottom = 10
  row.paddingLeft = row.paddingRight = 12
  row.cornerRadius = 8
  bindFillVar(ctx, row, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? '#F5F7FA' : WHITE)
  bindStrokeVar(ctx, row, toneVar ?? 'color/border', toneHex ?? BORDER)
  row.strokeWeight = 1
  row.strokeAlign = 'INSIDE'
  return row
}

// ══ KR 컴포넌트 (한국 도메인 폼) — Storybook src/ds/kr 미러 ═══════════
export type KrSpec = { label: string; ph: string; helper?: string; errHelper?: string; trailing?: 'eye' | 'chevron' | string; narrow?: boolean }
// 프레임형 필드(콤포지트 내부용) — 라벨 + 입력행 + (옵션)헬퍼
export function krSubField(ctx: Ctx, spec: KrSpec, filled = false): FrameNode {
  const f = autoFrame('field/' + spec.label, 'VERTICAL')
  f.layoutAlign = 'STRETCH'
  f.itemSpacing = 6
  const lbl = boundText(ctx, spec.label, 13, 'color/text', INK, true)
  lbl.name = 'FieldLabel'
  f.appendChild(lbl)
  const row = fieldRow(ctx, null, null, false)
  const val = boundText(ctx, spec.ph, 15, filled ? 'color/text' : 'color/secondary', filled ? INK : MUTED)
  val.name = 'value'
  val.layoutGrow = 1
  row.appendChild(val)
  if (spec.trailing === 'eye' || spec.trailing === 'chevron') {
    const ic = iconInstance(spec.trailing === 'eye' ? '_Icon/EyeOff' : '_Icon/ChevronDown', 'Icon', 18)
    recolorIcon(ic, SUB)
    row.appendChild(ic)
  } else if (typeof spec.trailing === 'string') {
    row.appendChild(krTrailingBtn(ctx, spec.trailing))
  }
  f.appendChild(row)
  if (spec.helper) {
    const h = boundText(ctx, spec.helper, 12, 'color/secondary', SUB)
    h.name = 'Helper'
    f.appendChild(h)
  }
  return f
}
export function krTrailingBtn(ctx: Ctx, label: string): FrameNode {
  const b = autoFrame('Button', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 6
  b.paddingLeft = b.paddingRight = 12
  b.cornerRadius = 6
  bindFillVar(ctx, b, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, b, 'color/border', BORDER)
  b.strokeWeight = 1
  b.strokeAlign = 'INSIDE'
  const t = boundText(ctx, label, 13, 'color/text', INK, true)
  b.appendChild(t)
  return b
}
// 콤포지트 폼 공용 카드
export function krFormCard(ctx: Ctx, title: string): { c: ComponentNode; add: (n: SceneNode) => void } {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.itemSpacing = 14
  c.paddingTop = c.paddingBottom = 24
  c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 14
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const t = boundText(ctx, title, 17, 'color/text', INK, true)
  t.name = 'title'
  c.appendChild(t)
  return { c, add: (n) => c.appendChild(n) }
}
export function krPrimaryBtn(ctx: Ctx, label: string): FrameNode {
  const b = autoFrame('submit', 'HORIZONTAL')
  b.layoutAlign = 'STRETCH'
  b.primaryAxisSizingMode = 'FIXED'
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 12
  b.cornerRadius = 8
  bindSolidFill(ctx, b, 'primary')
  const t = boundText(ctx, label, 15, onVarName('primary'), onHex(ctx, 'primary'), true)
  t.name = 'Submit'
  b.appendChild(t)
  return b
}

// ── 카테고리 정의 ────────────────────────────────────────────────────
export type ComponentDoc = {
  key: string
  setName: string
  eyebrow: string
  desc: string
  build: (ctx: Ctx, page: PageNode) => ComponentSetNode
  states: State[]
}
export type CategoryDef = { pageName: string; title: string; subtitle: string; docs: ComponentDoc[] }
