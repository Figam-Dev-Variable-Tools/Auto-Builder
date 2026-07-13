// 프론트(사이트) 컴포넌트 문서 — 스토리북 src/ds의 Site 계열을 Figma 베리언트 세트로.
// 대상: SiteHeader · SiteFooter · ProductCard · SortBar · SiteSection · InquiryForm(ContactPage) · InfoCard(ContactPage)
//
// admin.ts와 같은 machinery(setup/buildSet/makeRoot/makeHeader/makeSection/variantItem)를 쓰되
// categories.ts는 건드리지 않는다 → 비-export 헬퍼는 이 파일에 그대로 복제하고 출처를 표기했다.
//
// ── 이 파일의 규격: 다크는 없다. 프론트는 전부 라이트(흰색)다 ────────────────
// 정본(src/ds/SiteSection/SiteSection.module.css)이 라이트 단일 테마로 재작성되면서
// theme 축 · 토큰 반전(배경=color/text) · SiteSurface(라이트 아일랜드)가 모두 사라졌다.
// 위계는 색 반전이 아니라 **면 교차(tone)** 로 만든다:
//   tone=plain  → color/bg      (흰색)
//   tone=subtle → color/bgSubtle(아주 옅은 회색)
// 카드(ProductCard·InfoCard)는 어차피 흰 면 위의 흰 판이라 "아일랜드" 개념 자체가 필요 없다.
//
// ── 강조색 패밀리(출처: SiteSection.module.css .accentSuccess) ──────────────
//   --site-accent      → color/success/500  : 선·면(장식). 대비 기준 없음.
//   --site-accent-text → color/success/800  : 흰 면 위 글자. -500은 흰 배경에서 2.3:1로 AA 미달.
//
// ── solid 면·글자(오너 확정) ────────────────────────────────────────────────
//   solid 버튼/배지/체크박스처럼 "톤 색을 면으로 깔고 그 위에 글자를 얹는" 자리는
//   base 톤(color/success)이 아니라 파생 토큰 color/solid-<tone> / color/on-<tone>를 쓴다.
//   solid-*는 흰 글자가 4.5:1을 넘는 첫 셰이드(base → -600 → -700 → -800)이고,
//   on-*는 그 면 위에서 AA를 통과하는 글자색(대부분 흰색)이다.
//   → 예전처럼 "그린 면 위 color/bg" 같은 표면 의존 규칙이 없어졌다. 면과 글자가 한 쌍으로 온다.
import {
  type Ctx,
  solid,
  boundPaint,
  autoFrame,
  txt,
  makeRoot,
  makeHeader,
  makeSection,
  setup,
  applyPageColorMode,
  placeRoot,
  INK,
  SUB,
  BORDER,
  SURFACE,
  ACCENT,
  WHITE,
} from './foundations'
import { iconInstance, ICON_COMPONENTS } from './icon-vec'
import { buildSet, addTextProp, addBoolProp, addSwapProp, type Axis, type PropSpec } from './lib/build-set'
import { propKeys } from './lib/build-set'
// site-screens.ts가 './site'에서 propKeys를 가져간다 — 정본은 lib/build-set.ts, 여기선 경로만 유지한다.
export { propKeys }
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14)·Admin(15)·Layout(16)·Screens(17) 다음 번호.
const PAGE_SITE = '18. System - Site'
// reset 대상 등록용 — reset.ts가 이 배열을 함께 삭제해야 재생성이 된다(안 하면 좀비 페이지).
export const SITE_PAGE_NAMES = [PAGE_SITE]

// ── 프론트 컴포넌트 세트 레지스트리 ───────────────────────────────────
// admin.ts의 ADMIN_SETS와 같은 패턴. '19. System - Site Screens'(site-screens.ts)가
// 여기서 세트를 꺼내 헤더·푸터·상품카드·정렬바·문의폼·정보카드를 인스턴스로 조립한다.
// 프론트 컴포넌트 스코프를 끄고 화면만 켜면 비어 있고, site-screens.ts는 직접 그리는 폴백으로 내려간다.
export const SITE_SETS = new Map<string, ComponentSetNode>()

/**
 * 이미 있는 '18. System - Site' 페이지의 컴포넌트 세트를 레지스트리에 입양한다.
 * 프론트 컴포넌트 스코프를 끄고 화면만 다시 돌려도 인스턴스 조립이 되게 하는 장치.
 */
export function adoptSiteSets(): number {
  const page = figma.root.children.find((p) => p.name === PAGE_SITE)
  if (!page) return 0
  let n = 0
  for (const node of page.children) {
    if (node.type === 'COMPONENT_SET') {
      SITE_SETS.set(node.name, node)
      n++
    }
  }
  return n
}

/** 살아 있는 세트만 반환(재생성으로 페이지가 지워지면 removed=true인 유령 노드가 남는다). */
export function siteSet(name: string): ComponentSetNode | null {
  const set = SITE_SETS.get(name)
  if (!set) return null
  try {
    if (set.removed) {
      SITE_SETS.delete(name)
      return null
    }
  } catch {
    SITE_SETS.delete(name)
    return null
  }
  return set
}

// ══ 색 해석 ══════════════════════════════════════════════════════════
// 색은 전부 Figma Variable에 바인딩한다. 아래 hex는 "변수가 아직 없을 때"만 쓰이는 폴백이며,
// 계산식은 tokens.ts(=scripts/build-tokens.mjs)와 같아서 같은 값이 나온다.
const SUCCESS_HEX = '#00C471'
const ERROR_HEX = '#F04452'
const WARNING_HEX = '#FF9F0A'

/** 두 색 선형 보간. 출처: tokens.ts mixHex */
function mixHex(hex: string, target: string, amt: number): string {
  const a = parseInt(hex.replace('#', ''), 16)
  const b = parseInt(target.replace('#', ''), 16)
  const ch = (n: number, sh: number) => (n >> sh) & 255
  const mix = (sh: number) => Math.round(ch(a, sh) + (ch(b, sh) - ch(a, sh)) * amt)
  return '#' + ((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, '0')
}

// 셰이드 계산식 — 출처: tokens.ts SHADE_STEPS(50..900).
const SHADE_MIX: Record<string, [string, number]> = {
  '50': ['#FFFFFF', 0.9],
  '100': ['#FFFFFF', 0.8],
  '200': ['#FFFFFF', 0.62],
  '300': ['#FFFFFF', 0.44],
  '400': ['#FFFFFF', 0.24],
  '500': ['#FFFFFF', 0],
  '600': ['#000000', 0.12],
  '700': ['#000000', 0.24],
  '800': ['#000000', 0.36],
  '900': ['#000000', 0.48],
}

// ── solid/on 폴백 — 출처: tokens.ts solidColorFor·onColorFor(같은 공식) ──
const WCAG_AA = 4.5
function relLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}
function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
/** solid 면 — 흰 글자가 AA를 통과하는 첫 셰이드(base → -600 → -700 → -800). 전부 실패하면 base(hue 보존). */
function solidHexOf(base: string): string {
  for (const amt of [0, 0.12, 0.24, 0.36]) {
    const surface = amt === 0 ? base.toUpperCase() : mixHex(base, '#000000', amt)
    if (contrastRatio('#FFFFFF', surface) >= WCAG_AA) return surface
  }
  return base.toUpperCase()
}
/** solid 면 위 글자 — 원칙적으로 흰색. 흰 글자가 불가능한 극단적 톤(노란 warning 등)에서만 어두운 글자. */
function onHexOf(base: string): string {
  const surface = solidHexOf(base)
  if (contrastRatio('#FFFFFF', surface) >= WCAG_AA) return '#FFFFFF'
  for (let i = 48; i <= 100; i++) {
    const darker = mixHex(base, '#000000', i / 100)
    if (contrastRatio(darker, surface) >= WCAG_AA) return darker
  }
  return '#000000'
}

const BASE_HEX: Record<string, string> = {
  primary: ACCENT,
  secondary: SUB,
  success: SUCCESS_HEX,
  error: ERROR_HEX,
  warning: WARNING_HEX,
  bg: WHITE,
  bgSubtle: SURFACE,
  text: INK,
  border: BORDER,
}
/** 프리셋에서 고른 base 색(없으면 부록 C 기본값). */
function baseHex(ctx: Ctx, key: string): string {
  return ctx.userColors['color/' + key] ?? BASE_HEX[key] ?? INK
}
/**
 * 변수 이름 → 폴백 hex. 'color/success/800' · 'color/solid-success' · 'color/on-success' 전부 해석한다.
 * 셰이드·solid·on은 전부 base에서 계산되는 파생값이므로 프리셋을 바꾸면 함께 움직인다.
 */
function hexOf(ctx: Ctx, varName: string): string {
  const direct = ctx.userColors[varName]
  if (direct) return direct
  const parts = varName.split('/') // color / key / step?
  const key = parts[1] ?? ''
  if (key.indexOf('solid-') === 0) return solidHexOf(baseHex(ctx, key.slice(6)))
  if (key.indexOf('on-') === 0) return onHexOf(baseHex(ctx, key.slice(3)))
  const base = baseHex(ctx, key)
  if (parts.length < 3) return base
  const m = SHADE_MIX[parts[2]]
  return m ? mixHex(base, m[0], m[1]) : base
}

// ── 역할 → 변수 이름 (라이트 단일) ──────────────────────────────────
const V_BG = 'color/bg' // 섹션 면(plain) · 카드 · 컨트롤 배경
const V_SUBTLE = 'color/bgSubtle' // 섹션 면(subtle) · 드롭존 · 푸터
const V_TEXT = 'color/text' // 본문 글자
const V_SUB = 'color/secondary' // 보조 글자
const V_BORDER = 'color/border' // 보더·구분선
const V_MUTED = 'color/secondary/300' // 플레이스홀더 심볼 등 아주 옅은 장식
const V_ERROR = 'color/error' // 필수 표시(*)

// 강조색 패밀리 — 프론트의 기본 accent는 success(레퍼런스의 그린).
const TONE = 'success'
const V_ACCENT = `color/${TONE}/500` // 선·면(장식) — --site-accent
const V_ACCENT_TEXT = `color/${TONE}/800` // 흰 면 위 글자 — --site-accent-text
const V_ACCENT_SOLID = `color/solid-${TONE}` // solid 버튼 면
const V_ACCENT_ON = `color/on-${TONE}` // solid 버튼 글자

// ── 색·토큰 바인딩 헬퍼 (출처: categories.ts — 비-export라 동일 구현을 복제) ──
function boundText(ctx: Ctx, chars: string, size: number, varName: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, hexOf(ctx, varName), bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  // 오너: 텍스트 크기·굵기·글씨체도 변수로.
  const bind = t as unknown as { setBoundVariable: (field: string, v: Variable) => void }
  const sv = ctx.vars.get('font/size/' + size)
  if (sv) {
    try {
      bind.setBoundVariable('fontSize', sv)
    } catch {
      /* skip */
    }
  }
  const wv = ctx.vars.get(bold ? 'font/weight/bold' : 'font/weight/regular')
  if (wv) {
    try {
      bind.setBoundVariable('fontWeight', wv)
    } catch {
      /* skip */
    }
  }
  // ctx.fontFamilyVar가 null이면 절대 바인딩하지 않는다(미로드 폰트 바인딩 = 노드 생성 실패).
  if (ctx.fontFamilyVar) {
    try {
      bind.setBoundVariable('fontFamily', ctx.fontFamilyVar)
    } catch {
      /* skip */
    }
  }
  return t
}
function fillV(ctx: Ctx, node: GeometryMixin, varName: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(hexOf(ctx, varName))]
}
function strokeV(ctx: Ctx, node: MinimalStrokesMixin, varName: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(hexOf(ctx, varName))]
}
/** 보더·패딩·라운드·불투명도를 값이 맞는 변수에 후처리 바인딩. 출처: categories.ts bindTokens */
function bindTokens(ctx: Ctx, root: SceneNode) {
  const all: SceneNode[] = [root]
  const rf = root as unknown as { findAll?: (cb: (n: SceneNode) => boolean) => SceneNode[] }
  if (typeof rf.findAll === 'function') all.push(...rf.findAll(() => true))
  for (const node of all) {
    const a = node as unknown as {
      cornerRadius?: number | symbol
      strokeWeight?: number | symbol
      strokes?: readonly Paint[]
      layoutMode?: string
      paddingTop?: number
      paddingRight?: number
      paddingBottom?: number
      paddingLeft?: number
      itemSpacing?: number
      opacity?: number
      setBoundVariable: (field: string, v: Variable) => void
    }
    if (typeof a.opacity === 'number' && a.opacity > 0 && a.opacity < 1) {
      const ov = ctx.vars.get('opacity/' + Math.round(a.opacity * 100))
      if (ov)
        try {
          a.setBoundVariable('opacity', ov)
        } catch {
          /* skip */
        }
    }
    if (typeof a.cornerRadius === 'number' && a.cornerRadius > 0) {
      const rv = ctx.vars.get('radius/' + a.cornerRadius)
      if (rv)
        for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
          try {
            a.setBoundVariable(c, rv)
          } catch {
            /* skip */
          }
        }
    }
    if (typeof a.strokeWeight === 'number' && a.strokeWeight > 0 && a.strokes && a.strokes.length) {
      const bv = ctx.vars.get('border/' + a.strokeWeight)
      if (bv)
        try {
          a.setBoundVariable('strokeWeight', bv)
        } catch {
          /* skip */
        }
    }
    if (a.layoutMode && a.layoutMode !== 'NONE') {
      for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing'] as const) {
        const val = a[p]
        if (typeof val === 'number' && val > 0) {
          const sv = ctx.vars.get('space/' + val)
          if (sv)
            try {
              a.setBoundVariable(p, sv)
            } catch {
              /* skip */
            }
        }
      }
    }
  }
}
/** 크기 고정 프레임. 출처: categories.ts fixedFrame */
function fixedFrame(name: string, dir: 'HORIZONTAL' | 'VERTICAL', w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.fills = []
  return f
}
/**
 * 아이콘 인스턴스 — VECTOR stroke까지 Variable에 바인딩한다(오너: 색은 전부 변수).
 * 출처: categories.ts recolorIcon(그쪽은 hex 고정) — 여기서는 변수 우선 + hex 폴백.
 */
function icon(ctx: Ctx, key: string, name: string, size: number, varName: string): SceneNode {
  const ic = iconInstance(key, name, size)
  const v = ctx.vars.get(varName)
  const paint: Paint = v ? boundPaint(v) : solid(hexOf(ctx, varName))
  const f = ic as unknown as { findAll?: (cb: (n: SceneNode) => boolean) => SceneNode[] }
  if (typeof f.findAll === 'function') {
    for (const n of f.findAll((x) => x.type === 'VECTOR')) (n as VectorNode).strokes = [paint]
  }
  return ic
}
/** 아래쪽 1px 보더(헤더 하단선). 출처: categories.ts bottomBorder */
function bottomBorder(ctx: Ctx, node: FrameNode | ComponentNode, varName: string) {
  strokeV(ctx, node, varName)
  node.strokeAlign = 'INSIDE'
  node.strokeTopWeight = 0
  node.strokeLeftWeight = 0
  node.strokeRightWeight = 0
  node.strokeBottomWeight = 1
}
/** 위쪽 1px 보더(푸터 상단선). */
function topBorder(ctx: Ctx, node: FrameNode | ComponentNode, varName: string) {
  strokeV(ctx, node, varName)
  node.strokeAlign = 'INSIDE'
  node.strokeTopWeight = 1
  node.strokeLeftWeight = 0
  node.strokeRightWeight = 0
  node.strokeBottomWeight = 0
}


// 베리언트 세트 빌더 + 속성 헬퍼는 lib/build-set.ts가 정본이다(사본 금지).
type State = {
  caption: string
  props: Record<string, string>
  /** TEXT 속성 오버라이드(표시 이름 기준) */
  texts?: Record<string, string>
  /** INSTANCE_SWAP 오버라이드(표시 이름 → 아이콘 키) */
  swaps?: Record<string, string>
  /** 문서에서 인스턴스를 얹을 면 — 투명 헤더처럼 배경이 없는 변형용 */
  backdrop?: 'subtle'
}
type ComponentDoc = {
  key: string
  setName: string
  eyebrow: string
  desc: string
  build: (ctx: Ctx, page: PageNode) => ComponentSetNode
  states: State[]
}
type CategoryDef = { pageName: string; title: string; subtitle: string; docs: ComponentDoc[] }


// ── 문서 안 변형 아이템(인스턴스 + 캡션). 출처: categories.ts variantItem ──
// 확장점 두 가지(이 파일 소유):
//   1) texts/swaps — 같은 단일 컴포넌트를 문서에서 4장(Address/Phone/Email/Hours)으로 보여주기 위해.
//   2) backdrop — 투명 헤더는 스스로 배경이 없어 흰 문서 면 위에서는 "투명함"이 보이지 않는다.
//      옅은 회색 면(color/bgSubtle)을 깔아 배경이 비치는 것을 드러낸다(컴포넌트는 투명 그대로).
function variantItem(ctx: Ctx, set: ComponentSetNode, state: State): FrameNode {
  const item = autoFrame('Variant / ' + state.caption, 'VERTICAL')
  item.counterAxisAlignItems = 'MIN'
  item.itemSpacing = 8
  const inst = set.defaultVariant.createInstance()
  inst.layoutAlign = 'INHERIT'
  inst.layoutGrow = 0

  const props: Record<string, string> = { ...state.props }
  const keys = propKeys(set)
  if (state.texts) {
    for (const name of Object.keys(state.texts)) {
      const key = keys[name]
      if (key) props[key] = state.texts[name]
    }
  }
  if (state.swaps) {
    for (const name of Object.keys(state.swaps)) {
      const key = keys[name]
      const comp = ICON_COMPONENTS.get(state.swaps[name])
      if (key && comp) props[key] = comp.id
    }
  }
  try {
    inst.setProperties(props)
  } catch {
    ctx.warnings.push(`${set.name} setProperties 실패: ${JSON.stringify(props)}`)
  }

  if (state.backdrop === 'subtle') {
    const stage = autoFrame('Stage', 'HORIZONTAL')
    stage.paddingTop = stage.paddingBottom = stage.paddingLeft = stage.paddingRight = 16
    stage.cornerRadius = 12
    fillV(ctx, stage, V_SUBTLE) // 히어로(옅은 회색) 면 — 투명 헤더가 비쳐 보이도록
    stage.appendChild(inst)
    item.appendChild(stage)
  } else {
    item.appendChild(inst)
  }
  item.appendChild(txt(ctx, state.caption, 12, SUB))
  return item
}

// ══ 사이트 공용 조각(atoms) ══════════════════════════════════════════
// GNB 메뉴 — 출처: templates/SiteSuite/SiteSuite.tsx MENU.
// site-screens.ts가 이걸 import한다(예전엔 같은 배열을 각자 선언해서, 한쪽만 항목을 늘리면
// GNB variant의 active 축 값과 화면 인덱스가 조용히 어긋났다). admin-menu.ts와 같은 규율.
export const MENU = ['회사 소개', '연혁', '포트폴리오', '상품', '오시는길']
const BRAND = 'SPACE PLANNING'

/**
 * 사이트 버튼 — 레퍼런스의 '1:1 문의'는 Button variant="success" appearance="solid".
 * 면은 color/solid-success, 글자는 color/on-success. 두 변수는 한 쌍으로 계산되므로
 * 어떤 프리셋을 골라도 면 위 글자가 AA를 넘는다(파란 면에 검은 글자 같은 사고가 구조적으로 불가능).
 */
function siteBtn(ctx: Ctx, label: string, layer: string, size: 'sm' | 'lg' = 'sm'): FrameNode {
  const b = autoFrame(layer.replace(' Label', '') + ' Button', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.itemSpacing = 6
  b.paddingTop = b.paddingBottom = size === 'sm' ? 7 : 12
  b.paddingLeft = b.paddingRight = size === 'sm' ? 12 : 20
  b.cornerRadius = 8
  fillV(ctx, b, V_ACCENT_SOLID)
  const t = boundText(ctx, label, size === 'sm' ? 13 : 15, V_ACCENT_ON, true)
  t.name = layer
  b.appendChild(t)
  return b
}

/**
 * 이미지 플레이스홀더 심볼 — 흰 판 + 둥근 사각 프레임 + Image 심볼.
 * 출처: src/shared/placeholders.tsx(둥근 사각 프레임 rx10 + 심볼).
 */
function placeholderPlate(ctx: Ctx, w: number, h: number): FrameNode {
  const plate = fixedFrame('Media', 'HORIZONTAL', w, h)
  plate.primaryAxisAlignItems = 'CENTER'
  plate.counterAxisAlignItems = 'CENTER'
  plate.clipsContent = true
  // 레퍼런스가 배경을 뺀 누끼 상품컷이라 미디어 면도 카드와 같은 흰색이다(출처: ProductCard.module.css .media)
  fillV(ctx, plate, V_BG)

  const symbol = fixedFrame('Placeholder', 'HORIZONTAL', 72, 64)
  symbol.primaryAxisAlignItems = 'CENTER'
  symbol.counterAxisAlignItems = 'CENTER'
  symbol.cornerRadius = 10
  symbol.fills = []
  strokeV(ctx, symbol, V_BORDER)
  symbol.strokeWeight = 1
  symbol.strokeAlign = 'INSIDE'
  symbol.appendChild(icon(ctx, '_Icon/Image', 'Placeholder Icon', 26, V_MUTED))
  plate.appendChild(symbol)
  return plate
}

/** solid 배지(품절) — Badge secondary/solid: 면 color/solid-secondary + 글자 color/on-secondary. */
function solidBadge(ctx: Ctx, label: string, layer: string): FrameNode {
  const b = autoFrame(layer + ' Chip', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 5
  b.paddingLeft = b.paddingRight = 10
  b.cornerRadius = 6
  fillV(ctx, b, 'color/solid-secondary')
  const t = boundText(ctx, label, 13, 'color/on-secondary', true)
  t.name = layer
  b.appendChild(t)
  return b
}

/** Select(드롭다운) — 라벨 없는 바 안의 컨트롤. 값 + 셰브런. */
function selectBox(ctx: Ctx, value: string, layer: string, w = 160): FrameNode {
  const f = fixedFrame(layer, 'HORIZONTAL', w, 36)
  f.counterAxisAlignItems = 'CENTER'
  f.paddingLeft = f.paddingRight = 12
  f.itemSpacing = 6
  f.cornerRadius = 8
  fillV(ctx, f, V_BG)
  strokeV(ctx, f, V_BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  const t = boundText(ctx, value, 13, V_TEXT)
  t.name = layer + ' Value'
  t.layoutGrow = 1
  f.appendChild(t)
  f.appendChild(icon(ctx, '_Icon/ChevronDown', layer + ' Chevron', 15, V_SUB))
  return f
}

/** 폼 필드 — 라벨(+필수 *) 위 / 컨트롤 아래. 출처: InputBase·Select(라벨 상단형). */
function formField(
  ctx: Ctx,
  label: string,
  placeholder: string,
  w: number,
  required: boolean,
  iconKey?: string,
): FrameNode {
  const cell = autoFrame('field ' + label, 'VERTICAL')
  // resize는 해당 축의 sizing을 FIXED로 바꿀 수 있다 → hug 축(AUTO)은 resize '뒤'에 다시 세운다.
  // (출처: foundations.ts makeRoot가 같은 순서로 쓴다 — 순서를 바꾸면 높이가 0으로 얼어붙는다.)
  cell.counterAxisSizingMode = 'FIXED'
  cell.resize(w, cell.height)
  cell.primaryAxisSizingMode = 'AUTO'
  cell.itemSpacing = 6

  const lb = autoFrame('label row', 'HORIZONTAL')
  lb.counterAxisAlignItems = 'CENTER'
  lb.itemSpacing = 4
  lb.appendChild(boundText(ctx, label, 12, V_SUB, true))
  if (required) lb.appendChild(boundText(ctx, '*', 12, V_ERROR, true))
  cell.appendChild(lb)

  const ctrl = fixedFrame('control', 'HORIZONTAL', w, 40)
  ctrl.counterAxisAlignItems = 'CENTER'
  ctrl.paddingLeft = ctrl.paddingRight = 12
  ctrl.itemSpacing = 6
  ctrl.cornerRadius = 8
  fillV(ctx, ctrl, V_BG)
  strokeV(ctx, ctrl, V_BORDER)
  ctrl.strokeWeight = 1
  ctrl.strokeAlign = 'INSIDE'
  const ph = boundText(ctx, placeholder, 13, V_SUB)
  ph.layoutGrow = 1
  ctrl.appendChild(ph)
  if (iconKey) ctrl.appendChild(icon(ctx, iconKey, 'Field Icon', 15, V_SUB))
  cell.appendChild(ctrl)
  return cell
}

/** 체크박스(18px) — 체크되면 solid 면이므로 color/solid-primary + color/on-primary 체크. */
function checkBox(ctx: Ctx, checked: boolean, name = 'Checkbox'): FrameNode {
  const c = fixedFrame(name, 'HORIZONTAL', 18, 18)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 4
  if (checked) {
    fillV(ctx, c, 'color/solid-primary')
    c.appendChild(icon(ctx, '_Icon/Check', 'Check', 12, 'color/on-primary'))
  } else {
    fillV(ctx, c, V_BG)
    strokeV(ctx, c, V_BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  return c
}

// ══ DS/SiteHeader ════════════════════════════════════════════════════
// 축: transparent(false|true) · sticky(false|true) — 둘 다 React 유니온/불리언 prop 이름 그대로.
// 좌 브랜드 / 우 메뉴 5개(활성=굵게 + 그린 밑줄) / 우 [1:1 문의] / 햄버거(모바일).
const HEADER_W = 960

function renderSiteHeader(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const transparent = combo.transparent === 'true'
  // sticky는 position:sticky + z-index만 바꾼다(SiteHeader.module.css .sticky) — 정지 이미지에서
  // 시각차가 없다. 그래도 축으로 둔다: React prop이므로 규약상 축 이름이 있어야 하고,
  // 디자이너가 "이 헤더는 스크롤 고정"이라는 의도를 변형으로 선언할 수 있어야 한다.

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.resize(HEADER_W, 64)
  c.counterAxisSizingMode = 'AUTO' // 높이는 hug — resize 뒤에 세워야 FIXED로 얼지 않는다
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 16
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 20
  if (transparent) {
    // 히어로 위 — 배경/보더 없음(출처: SiteHeader.module.css .transparent). 글자색은 그대로 라이트.
    c.fills = []
  } else {
    fillV(ctx, c, V_BG)
    bottomBorder(ctx, c, V_BORDER)
  }

  const brand = boundText(ctx, BRAND, 19, V_TEXT, true)
  brand.name = 'brand'
  c.appendChild(brand)

  // 메뉴 — 우측으로 밀어 액션 앞에 붙인다(margin-left:auto와 같은 효과).
  const nav = autoFrame('nav', 'HORIZONTAL')
  nav.counterAxisAlignItems = 'CENTER'
  nav.itemSpacing = 20
  nav.primaryAxisAlignItems = 'MAX'
  c.appendChild(nav)
  nav.layoutGrow = 1

  // 활성 메뉴(현재 페이지) = 베리언트 축 active(1~5). 화면(19)은 자기 번호를 그대로 넘긴다.
  const activeIndex = Math.max(0, (parseInt(combo.active || '1', 10) || 1) - 1)
  MENU.forEach((label, i) => {
    const active = i === activeIndex
    const it = autoFrame('menu ' + (i + 1), 'VERTICAL')
    it.counterAxisAlignItems = 'CENTER'
    it.itemSpacing = 4
    const t = boundText(ctx, label, 13, active ? V_TEXT : V_SUB, active)
    t.name = 'Menu ' + (i + 1)
    it.appendChild(t)
    // 활성 밑줄 — 그린 강조(선이라 장식용 -500). 출처: SiteHeader.module.css .active::after
    const rule = figma.createRectangle()
    rule.name = 'Active Rule ' + (i + 1)
    rule.resize(Math.max(t.width, 8), 2)
    rule.cornerRadius = 4
    if (active) fillV(ctx, rule, V_ACCENT)
    else rule.fills = [] // 비활성도 자리를 지켜 행 높이가 흔들리지 않게(투명 유지)
    it.appendChild(rule)
    rule.layoutAlign = 'STRETCH'
    nav.appendChild(it)
  })

  // actions 슬롯(ReactNode) — 레퍼런스에서는 [1:1 문의] 버튼이 들어온다.
  // 레이어 이름은 CSS 클래스 그대로(.actions). 버튼 자체는 데모 내용이라 속성으로 열지 않는다
  // (React actions는 문자열이 아니라 노드 슬롯이다 — TEXT 속성으로 표현하면 거짓말이 된다).
  const actions = autoFrame('actions', 'HORIZONTAL')
  actions.counterAxisAlignItems = 'CENTER'
  actions.itemSpacing = 8
  actions.appendChild(siteBtn(ctx, '1:1 문의', 'Action Label'))
  c.appendChild(actions)

  // 햄버거(showMenuButton + menuIcon) — 출처: SiteHeader.module.css .hamburger
  // CSS가 max-width:767px에서만 .hamburger를 보여준다 → 이 세트의 프레임 폭(960)에서는 감춰진 상태가
  // 실제 렌더와 일치한다. 그래서 레이어를 visible=false로 만들고 BOOLEAN 기본값도 false다.
  // (React 기본값은 showMenuButton=true지만 그건 '모바일에서 보인다'는 뜻이지 데스크톱 바에 나온다는
  //  뜻이 아니다. 여기서 true로 두면 nav·actions·햄버거가 동시에 보이는, 실제로는 존재하지 않는 그림이 된다.)
  const hamburger = autoFrame('hamburger', 'HORIZONTAL')
  hamburger.counterAxisAlignItems = 'CENTER'
  hamburger.primaryAxisAlignItems = 'CENTER'
  hamburger.paddingTop = hamburger.paddingBottom = 8
  hamburger.paddingLeft = hamburger.paddingRight = 8
  hamburger.cornerRadius = 8
  fillV(ctx, hamburger, V_BG)
  strokeV(ctx, hamburger, V_BORDER)
  hamburger.strokeWeight = 1
  hamburger.strokeAlign = 'INSIDE'
  // 기본 아이콘은 lucide Menu — React의 `menuIcon ?? <Menu size={20} />`와 같은 기본값.
  hamburger.appendChild(icon(ctx, '_Icon/Menu', 'menuIcon', 20, V_TEXT))
  hamburger.visible = false
  c.appendChild(hamburger)
  return c
}

// ══ DS/SiteFooter ════════════════════════════════════════════════════
// 축 없음(단일). 본문과의 구분은 색 반전이 아니라 면 교차다 — 옅은 회색(bgSubtle) + 상단 보더.
// 출처: SiteFooter.module.css .inner / 회사정보는 SiteSuite.tsx FOOTER_COMPANY.
const FOOTER_COMPANY: Array<[string, string]> = [
  ['상호', '스페이스플래닝 주식회사'],
  ['대표', '홍성보'],
  ['사업자번호', '123-45-67890'],
  ['주소', '서울특별시 성동구 아차산로 111, 2층'],
  ['전화', '02-1234-5678'],
  ['이메일', 'hello@spaceplanning.ai'],
]
const FOOTER_SOCIAL = ['_Icon/Globe', '_Icon/Chat', '_Icon/Send']

function renderSiteFooter(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const W = 960

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.primaryAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.itemSpacing = 20
  c.paddingTop = c.paddingBottom = 24
  c.paddingLeft = c.paddingRight = 20
  fillV(ctx, c, V_SUBTLE)
  topBorder(ctx, c, V_BORDER)

  // 상단 — 브랜드 / 메뉴 링크 / SNS
  const top = autoFrame('top', 'HORIZONTAL')
  top.layoutAlign = 'STRETCH'
  top.primaryAxisSizingMode = 'FIXED'
  top.primaryAxisAlignItems = 'SPACE_BETWEEN'
  top.counterAxisAlignItems = 'CENTER'
  top.itemSpacing = 20
  const brand = boundText(ctx, BRAND, 22, V_TEXT, true)
  brand.name = 'brand'
  top.appendChild(brand)

  const links = autoFrame('Links', 'HORIZONTAL')
  links.counterAxisAlignItems = 'CENTER'
  links.itemSpacing = 16
  MENU.forEach((label, i) => {
    const t = boundText(ctx, label, 13, V_SUB)
    t.name = 'Link ' + (i + 1)
    links.appendChild(t)
  })
  top.appendChild(links)

  // SNS 슬롯 — React `social`은 아이콘 여러 개를 담는 ReactNode 슬롯이지만 Figma의 INSTANCE_SWAP은
  // 인스턴스 '하나'를 가리킨다. 그래서 첫 아이콘만 레이어 이름을 prop 이름('social')으로 주어 스왑
  // 속성을 열고, 나머지 둘은 데모 데이터로 남긴다(인스턴스 안에서 개별 스왑은 Figma가 기본 지원한다).
  const social = autoFrame('Social', 'HORIZONTAL')
  social.counterAxisAlignItems = 'CENTER'
  social.itemSpacing = 12
  FOOTER_SOCIAL.forEach((key, i) => {
    social.appendChild(icon(ctx, key, i === 0 ? 'social' : 'Social ' + (i + 1), 18, V_SUB))
  })
  top.appendChild(social)
  c.appendChild(top)

  // 회사 정보 — 상호·대표·사업자번호·주소·전화·이메일. 레이어 = CSS 클래스(.company),
  // showCompany BOOLEAN이 이 프레임 하나를 통째로 켜고 끈다.
  const company = autoFrame('company', 'HORIZONTAL')
  company.layoutAlign = 'STRETCH'
  company.primaryAxisSizingMode = 'FIXED'
  company.layoutWrap = 'WRAP'
  company.itemSpacing = 16
  company.counterAxisSpacing = 8
  FOOTER_COMPANY.forEach(([label, value], i) => {
    const row = autoFrame('company item', 'HORIZONTAL')
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 8
    row.appendChild(boundText(ctx, label, 11, V_SUB))
    const v = boundText(ctx, value, 13, V_TEXT)
    v.name = 'Company ' + (i + 1)
    row.appendChild(v)
    company.appendChild(row)
  })
  c.appendChild(company)

  // 카피라이트 — showDivider(기본 true)가 저작권 줄 '위 구분선'을 켜고 끈다.
  // BOOLEAN 속성은 '레이어의 표시/숨김'만 할 수 있다 → 프레임 stroke(border-top)로는 끌 수가 없어
  // 구분선을 실제 레이어(1px 사각형, 이름은 CSS 클래스 .bottomDivider)로 분리했다.
  // 세로 스택 + itemSpacing 16 = 기존 'border-top + paddingTop:16'과 같은 그림이다(모양 변화 없음).
  const bottom = autoFrame('bottom', 'VERTICAL')
  bottom.layoutAlign = 'STRETCH'
  bottom.counterAxisSizingMode = 'FIXED'
  bottom.primaryAxisSizingMode = 'AUTO'
  bottom.itemSpacing = 16
  const rule = figma.createRectangle()
  rule.name = 'bottomDivider'
  rule.resize(W - 40, 1) // 좌우 패딩 20*2를 뺀 폭 — STRETCH가 다시 잡아준다
  fillV(ctx, rule, V_BORDER)
  bottom.appendChild(rule)
  rule.layoutAlign = 'STRETCH'
  const cr = boundText(ctx, '© 2026 SPACE PLANNING Inc. All rights reserved.', 11, V_SUB)
  cr.name = 'copyright'
  bottom.appendChild(cr)
  c.appendChild(bottom)
  return c
}

// ══ DS/ProductCard ═══════════════════════════════════════════════════
// 축: ratio × soldOut × variant × currency = 4×2×2×2 = 32변형.
// ratio 값 4종은 React의 ProductCardRatio = Extract<MediaRatio, '3x4'|'1x1'|'4x3'|'16x9'> 그대로다
// (16x9가 빠져 있어 채웠다 — 축 값 집합은 코드 유니온과 정확히 같아야 한다).
// 카드는 흰 판이고 놓이는 면도 흰색이라 "라이트 아일랜드" 개념 자체가 없다 —
// 컴포넌트 루트가 곧 카드다(예전엔 다크 섹션 면을 흉내내는 바깥 프레임이 한 겹 더 있었다).
const CARD_W = 240
// 높이 = CARD_W(240) × 비율. 16x9 → 240 × 9/16 = 135.
const RATIO_H: Record<string, number> = { '3x4': 320, '1x1': 240, '4x3': 180, '16x9': 135 }

function renderProductCard(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const soldOut = combo.soldOut === 'true'
  // variant: card=흰 카드(보더+라운드, 기본) / plain=판 없음(누끼 상품컷 갤러리형 그리드용).
  const plain = combo.variant === 'plain'
  // currency: won="38,000원"(기본) / symbol="₩38,000"
  const symbol = combo.currency === 'symbol'
  const mediaH = RATIO_H[combo.ratio] ?? RATIO_H['3x4']

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(CARD_W, c.height)
  c.primaryAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.itemSpacing = 0
  c.clipsContent = true
  if (plain) {
    // 판 없음 — 배경·보더 모두 없앤다(상품컷이 누끼라 보더가 이중 테두리로 읽힌다).
    c.cornerRadius = 0
    c.fills = []
  } else {
    c.cornerRadius = 12
    fillV(ctx, c, V_BG)
    strokeV(ctx, c, V_BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }

  // 미디어 — 흰 판 + 플레이스홀더 심볼.
  const media = placeholderPlate(ctx, CARD_W, mediaH)
  c.appendChild(media)
  if (soldOut) {
    // 품절 = 흰 베일(어두운 딤이 아니다 — 라이트 전용이므로 카드 면을 반투명으로 덮는다).
    // 출처: ProductCard.module.css .veil = color-mix(bg 68%). Figma opacity 변수는 60이 최근접값이라
    // opacity/60에 바인딩한다(68% 변수는 존재하지 않는다 — 집합은 tokens.ts 소유).
    const veil = figma.createRectangle()
    veil.name = 'Veil'
    veil.resize(CARD_W, mediaH)
    fillV(ctx, veil, V_BG)
    media.appendChild(veil)
    veil.layoutPositioning = 'ABSOLUTE'
    veil.x = 0
    veil.y = 0
    veil.opacity = 0.6

    const bd = solidBadge(ctx, '품절', 'SoldOut Badge')
    media.appendChild(bd)
    bd.layoutPositioning = 'ABSOLUTE'
    bd.x = Math.round((CARD_W - bd.width) / 2)
    bd.y = Math.round((mediaH - bd.height) / 2)
  }

  // 본문 — 브랜드(작게) · 상품명(bold) · 설명 1줄 · 가격(그린 bold)
  // 판이 없으면(plain) 좌우 패딩도 없앤다 — 텍스트 왼쪽 선이 상품컷 왼쪽 선과 맞는다.
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'AUTO'
  body.itemSpacing = 4
  if (plain) {
    body.paddingTop = 12
    body.paddingBottom = 0
    body.paddingLeft = body.paddingRight = 0
  } else {
    body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16
  }
  const brand = boundText(ctx, '스페이스플래닝', 11, V_SUB)
  brand.name = 'brand'
  body.appendChild(brand)
  const name = boundText(ctx, '라운드 화분 · 라이트그레이', 16, V_TEXT, true)
  name.name = 'name'
  body.appendChild(name)
  const desc = boundText(ctx, '실내 식물에 맞춘 배수형 화분', 13, V_SUB)
  desc.name = 'description'
  body.appendChild(desc)

  const priceRow = autoFrame('price row', 'HORIZONTAL')
  priceRow.layoutAlign = 'STRETCH'
  priceRow.primaryAxisSizingMode = 'FIXED'
  priceRow.counterAxisAlignItems = 'CENTER'
  priceRow.itemSpacing = 8
  priceRow.paddingTop = 4
  // 흰 판 위 "글자"라 장식용 -500(2.1:1)이 아니라 --site-accent-text(-800)를 쓴다.
  // 레이어 이름 = CSS 클래스(.price). React `price`는 number라 Figma에 대응 속성 타입이 없다 —
  // 포맷된 문자열을 TEXT 속성으로 열되 이름은 코드 prop 그대로 'price'다(사유는 ALLOWLIST).
  const price = boundText(ctx, symbol ? '₩38,000' : '38,000원', 19, V_ACCENT_TEXT, true)
  price.name = 'price'
  priceRow.appendChild(price)
  body.appendChild(priceRow)

  c.appendChild(body)
  return c
}

// ══ DS/SortBar ═══════════════════════════════════════════════════════
// 축 없음(단일). 좌 '전체 6개' + 우 Select 2개(최신순 / 서비스별).
// 바 자체는 면을 깔지 않는다 — 섹션 면(흰색 또는 bgSubtle) 위에 그대로 얹힌다(출처: SortBar.module.css).
function renderSortBar(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const W = 720

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.resize(W, 60)
  c.counterAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.paddingTop = c.paddingBottom = 12
  c.fills = []

  // 좌측 "전체 6개…" — 출처: SortBar.tsx <p className={styles.total}>{totalLabel} <strong className={styles.count}>…</strong>{totalSuffix}</p>
  const total = autoFrame('total', 'HORIZONTAL')
  total.counterAxisAlignItems = 'CENTER'
  total.itemSpacing = 4
  const label = boundText(ctx, '전체', 13, V_SUB)
  label.name = 'totalLabel'
  total.appendChild(label)
  // 레이어는 CSS 클래스(.count), 속성 이름은 코드 prop(total: number) 그대로.
  const count = boundText(ctx, '6개', 13, V_TEXT, true)
  count.name = 'count'
  total.appendChild(count)
  // totalSuffix — 개수 뒤 문구(예: '의 상품이 있습니다.'). React 기본값이 ''이라 레이어도 빈 글자로 둔다
  // (기본 상태에서는 아무것도 그려지지 않아 지금 문서의 모양이 그대로 유지된다).
  const suffix = boundText(ctx, '', 13, V_SUB)
  suffix.name = 'totalSuffix'
  total.appendChild(suffix)
  c.appendChild(total)
  total.layoutGrow = 1 // 컨트롤을 우측으로 민다(margin-left:auto)

  const controls = autoFrame('Controls', 'HORIZONTAL')
  controls.counterAxisAlignItems = 'CENTER'
  controls.itemSpacing = 8
  controls.appendChild(selectBox(ctx, '최신순', 'Sort Select'))
  controls.appendChild(selectBox(ctx, '서비스별', 'Service Select'))
  c.appendChild(controls)
  return c
}

// ══ DS/SiteSection ═══════════════════════════════════════════════════
// 축: tone(plain|subtle) · align(start|center) · accent(success|primary) · divider(false|true).
// theme 축은 없다 — 다크 반전이 아니라 면 교차(tone)가 위계를 만든다.
// maxWidth·padding 축은 일부러 뺐다(사유는 아래 buildSet 주석 + verify-naming ALLOWLIST).
function renderSiteSection(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const subtle = combo.tone === 'subtle'
  // align: start=좌측(목록·어드민형 섹션·기본값) / center=가운데(페이지 히어로).
  const center = combo.align === 'center'
  // accent: 강조색 패밀리 선택(React 기본값 success = 레퍼런스의 그린).
  // 색은 여기서도 변수 이름으로만 고른다 — raw hex는 hexOf() 폴백에만 쓰인다.
  const accentTone = combo.accent === 'primary' ? 'primary' : TONE
  const vAccent = `color/${accentTone}/500` // 선·면(장식) — --site-accent
  // divider: 제목 아래 구분선 + 강조 세그먼트(React 기본값 false).
  const hasDivider = combo.divider === 'true'
  const W = 960
  const innerW = W - 48

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.primaryAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.itemSpacing = 24
  // padMd는 48/24이지만 space/48 변수가 없다 → 바인딩되는 최대값 40으로 내린다(space/40).
  c.paddingTop = c.paddingBottom = 40
  c.paddingLeft = c.paddingRight = 24
  fillV(ctx, c, subtle ? V_SUBTLE : V_BG)

  const header = autoFrame('header', 'VERTICAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'AUTO'
  header.itemSpacing = 8
  header.counterAxisAlignItems = center ? 'CENTER' : 'MIN'
  // 레이어 이름 = CSS Module 클래스 이름(.title/.subtitle) 그대로 — TEXT 속성이 여기에 바인딩된다.
  const title = boundText(ctx, 'PORTFOLIO', 40, V_TEXT, true)
  title.name = 'title'
  title.layoutAlign = 'STRETCH'
  title.textAutoResize = 'HEIGHT'
  if (center) title.textAlignHorizontal = 'CENTER'
  header.appendChild(title)
  const subtitle = boundText(ctx, '공간의 쓰임에서 출발한 프로젝트를 모았습니다.', 13, V_SUB)
  subtitle.name = 'subtitle'
  subtitle.layoutAlign = 'STRETCH'
  subtitle.textAutoResize = 'HEIGHT'
  if (center) subtitle.textAlignHorizontal = 'CENTER'
  header.appendChild(subtitle)
  c.appendChild(header)

  // 구분선 + 강조 세그먼트(출처: SiteSection.module.css .divider::after — 48×2 accent).
  // center에서는 세그먼트도 가운데에 선다 — 규칙선을 좌우 두 조각으로 나눠 세그먼트를 사이에 끼운다.
  if (hasDivider) {
    const divider = fixedFrame('divider', 'HORIZONTAL', innerW, 2)
    divider.counterAxisAlignItems = 'CENTER'
    divider.itemSpacing = 0
    const seg = figma.createRectangle()
    seg.name = 'Accent Segment'
    seg.resize(48, 2)
    fillV(ctx, seg, vAccent)
    if (center) {
      const lineLeft = figma.createRectangle()
      lineLeft.name = 'Rule Left'
      lineLeft.resize(1, 1)
      fillV(ctx, lineLeft, V_BORDER)
      divider.appendChild(lineLeft)
      lineLeft.layoutGrow = 1
      divider.appendChild(seg)
      const lineRight = figma.createRectangle()
      lineRight.name = 'Rule Right'
      lineRight.resize(1, 1)
      fillV(ctx, lineRight, V_BORDER)
      divider.appendChild(lineRight)
      lineRight.layoutGrow = 1
    } else {
      divider.appendChild(seg)
      const line = figma.createRectangle()
      line.name = 'Rule'
      line.resize(innerW - 48, 1)
      fillV(ctx, line, V_BORDER)
      divider.appendChild(line)
      line.layoutGrow = 1
    }
    c.appendChild(divider)
    divider.layoutAlign = 'STRETCH'
  }

  // children 슬롯 — 페이지 본문이 들어갈 빈 프레임(점선). 이름은 규약 §7의 'content'.
  const slot = fixedFrame('content', 'VERTICAL', innerW, 160)
  slot.primaryAxisAlignItems = 'CENTER'
  slot.counterAxisAlignItems = 'CENTER'
  slot.itemSpacing = 8
  slot.cornerRadius = 12
  slot.fills = []
  strokeV(ctx, slot, V_BORDER)
  slot.strokeWeight = 1
  slot.strokeAlign = 'INSIDE'
  slot.dashPattern = [6, 6]
  const slotLabel = boundText(ctx, 'Content Slot', 13, V_SUB)
  slotLabel.name = 'Slot Label'
  slot.appendChild(slotLabel)
  c.appendChild(slot)
  slot.layoutAlign = 'STRETCH'
  return c
}

// ══ DS/InquiryForm ═══════════════════════════════════════════════════
// 축 없음(단일). 이름·이메일·연락처·문의유형·제목·내용·파일첨부·동의·제출.
// 출처: ContactPage.tsx의 Project Inquiry 폼(InputBase·Select·Textarea·DropZone·Checkbox·Button).
function renderInquiryForm(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const W = 640
  const fullW = W - 48 // padding 24*2
  const halfW = (fullW - 16) / 2 // 2열 그리드(간격 16)

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.primaryAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.itemSpacing = 16
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 24
  // 폼은 섹션 면 위에 그대로 얹힌다(자체 카드 없음) → 흰 면만 깔아 준다.
  fillV(ctx, c, V_BG)

  const row = (a: FrameNode, b: FrameNode): FrameNode => {
    const r = autoFrame('row', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'MIN'
    r.itemSpacing = 16
    r.appendChild(a)
    r.appendChild(b)
    return r
  }
  c.appendChild(
    row(formField(ctx, '이름', '홍길동', halfW, true), formField(ctx, '이메일', 'you@example.com', halfW, true)),
  )
  c.appendChild(
    row(
      formField(ctx, '연락처', '010-1234-5678', halfW, true),
      formField(ctx, '문의 유형', '유형을 선택하세요', halfW, true, '_Icon/ChevronDown'),
    ),
  )
  c.appendChild(formField(ctx, '제목', '문의 제목을 입력해주세요', fullW, true))

  // 내용(Textarea) — 라벨 + 넓은 입력면 + 글자수 카운터
  const contentCell = autoFrame('field 내용', 'VERTICAL')
  contentCell.layoutAlign = 'STRETCH'
  contentCell.primaryAxisSizingMode = 'AUTO'
  contentCell.itemSpacing = 6
  const cLabel = autoFrame('label row', 'HORIZONTAL')
  cLabel.counterAxisAlignItems = 'CENTER'
  cLabel.itemSpacing = 4
  cLabel.appendChild(boundText(ctx, '내용', 12, V_SUB, true))
  cLabel.appendChild(boundText(ctx, '*', 12, V_ERROR, true))
  contentCell.appendChild(cLabel)
  const area = fixedFrame('textarea', 'VERTICAL', fullW, 120)
  area.primaryAxisAlignItems = 'MIN'
  area.paddingTop = area.paddingBottom = 12
  area.paddingLeft = area.paddingRight = 12
  area.cornerRadius = 8
  fillV(ctx, area, V_BG)
  strokeV(ctx, area, V_BORDER)
  area.strokeWeight = 1
  area.strokeAlign = 'INSIDE'
  area.appendChild(boundText(ctx, '프로젝트 개요, 희망 일정, 예산 범위를 적어주시면 상담이 빨라집니다.', 13, V_SUB))
  contentCell.appendChild(area)
  area.layoutAlign = 'STRETCH'
  const counter = boundText(ctx, '0 / 2000', 11, V_SUB)
  counter.name = 'Counter'
  contentCell.appendChild(counter)
  c.appendChild(contentCell)

  // 파일 첨부(DropZone) — 옅은 회색 면 + 점선
  const files = autoFrame('field 파일첨부', 'VERTICAL')
  files.layoutAlign = 'STRETCH'
  files.primaryAxisSizingMode = 'AUTO'
  files.itemSpacing = 6
  files.appendChild(boundText(ctx, '파일 첨부', 12, V_SUB, true))
  const drop = fixedFrame('DropZone', 'VERTICAL', fullW, 88)
  drop.primaryAxisAlignItems = 'CENTER'
  drop.counterAxisAlignItems = 'CENTER'
  drop.itemSpacing = 6
  drop.cornerRadius = 12
  fillV(ctx, drop, V_SUBTLE)
  strokeV(ctx, drop, V_BORDER)
  drop.strokeWeight = 1
  drop.strokeAlign = 'INSIDE'
  drop.dashPattern = [6, 6]
  drop.appendChild(icon(ctx, '_Icon/Upload', 'Upload Icon', 22, V_SUB))
  const dropHint = boundText(ctx, '현장 사진이나 도면이 있다면 첨부해주세요 (최대 20MB)', 12, V_SUB)
  dropHint.name = 'DropZone Hint'
  drop.appendChild(dropHint)
  files.appendChild(drop)
  drop.layoutAlign = 'STRETCH'
  c.appendChild(files)

  // 동의 — 체크박스 + 안내
  const consent = autoFrame('consent', 'VERTICAL')
  consent.layoutAlign = 'STRETCH'
  consent.primaryAxisSizingMode = 'AUTO'
  consent.itemSpacing = 6
  const agreeRow = autoFrame('agree', 'HORIZONTAL')
  agreeRow.counterAxisAlignItems = 'CENTER'
  agreeRow.itemSpacing = 8
  agreeRow.appendChild(checkBox(ctx, true, 'Consent Checkbox'))
  const agreeLabel = boundText(ctx, '개인정보 수집·이용에 동의합니다 (필수)', 13, V_TEXT)
  agreeLabel.name = 'Consent Label'
  agreeRow.appendChild(agreeLabel)
  consent.appendChild(agreeRow)
  const consentHint = boundText(ctx, '수집 항목: 이름·이메일·연락처 · 보유 기간: 문의 처리 후 3년', 11, V_SUB)
  consentHint.name = 'Consent Hint'
  consent.appendChild(consentHint)
  c.appendChild(consent)

  // 제출 — solid(Button variant="success" size="lg"): 면 solid-success + 글자 on-success
  const submit = autoFrame('submit', 'HORIZONTAL')
  submit.layoutAlign = 'STRETCH'
  submit.primaryAxisSizingMode = 'FIXED'
  submit.primaryAxisAlignItems = 'MAX'
  submit.counterAxisAlignItems = 'CENTER'
  submit.appendChild(siteBtn(ctx, '문의 보내기', 'Submit Label', 'lg'))
  c.appendChild(submit)
  return c
}

// ══ DS/InfoCard ══════════════════════════════════════════════════════
// 축 없음(단일). 오시는길의 Address/Phone/Email/Hours 카드 — 라벨(그린 bold) + 값 2줄.
// 라벨은 흰 면 위 13px 글자라 --site-accent-text(success-800). 출처: ContactPage.module.css .infoLabel
function renderInfoCard(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const W = 260

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.primaryAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 12
  fillV(ctx, c, V_BG)
  strokeV(ctx, c, V_BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const labelRow = autoFrame('label row', 'HORIZONTAL')
  labelRow.counterAxisAlignItems = 'CENTER'
  labelRow.itemSpacing = 8
  labelRow.appendChild(icon(ctx, '_Icon/MapPin', 'Info Icon', 16, V_ACCENT_TEXT))
  const label = boundText(ctx, 'Address', 13, V_ACCENT_TEXT, true)
  label.name = 'Label'
  labelRow.appendChild(label)
  c.appendChild(labelRow)

  const lines = autoFrame('lines', 'VERTICAL')
  lines.layoutAlign = 'STRETCH'
  lines.primaryAxisSizingMode = 'AUTO'
  lines.itemSpacing = 4
  const l1 = boundText(ctx, '서울특별시 성동구 아차산로 111', 13, V_TEXT)
  l1.name = 'Line 1'
  lines.appendChild(l1)
  // 둘째 줄부터는 보조 정보(출처: ContactPage.module.css .infoLine + .infoLine)
  const l2 = boundText(ctx, '성수 쇼룸 2층 (성수동2가)', 13, V_SUB)
  l2.name = 'Line 2'
  lines.appendChild(l2)
  c.appendChild(lines)
  return c
}

// ── 문서 정의 ────────────────────────────────────────────────────────
const SITE_CATEGORY: CategoryDef = {
  pageName: PAGE_SITE,
  title: 'Site',
  subtitle:
    '고객이 보는 프론트 화면의 컴포넌트 세트. 프론트는 라이트(흰색) 단일 테마입니다 — 다크 반전은 없고, 위계는 면 교차(흰색 ↔ color/bgSubtle)로 만듭니다. 강조는 그린(선·면은 success-500, 흰 면 위 글자는 success-800)이고, solid 버튼·배지·체크박스는 면 color/solid-<tone> + 글자 color/on-<tone>를 한 쌍으로 씁니다.',
  docs: [
    {
      key: 'SiteSection',
      setName: 'DS/SiteSection',
      eyebrow: 'ORGANISM · SITE',
      desc:
        '프론트 전 페이지의 뼈대. 영문 대형 헤드라인 + 한글 서브카피 + 구분선(그린 세그먼트) + 콘텐츠 슬롯. 다크 반전이 없어진 자리를 tone 축이 대신합니다 — ' +
        'plain(흰색)과 subtle(아주 옅은 회색)을 교차시켜 섹션 리듬을 만듭니다. align(start·center) 축은 목록형 섹션(좌측)과 페이지 히어로(가운데)를 구분합니다.',
      // 축 = React 유니온/불리언 prop 이름·값 그대로. 4축 = 2×2×2×2 = 16변형.
      // maxWidth(lg|xl|full)·padding(md|lg|none)은 일부러 축으로 만들지 않았다:
      //   넣는 순간 16 → 48 → 144변형으로 곱해져 세트가 문서로서 못 읽힌다(권장 상한 40).
      //   둘 다 '본문 폭·여백' 치수라 그림이 거의 같아 변형당 정보량이 0에 가깝다 → ALLOWLIST에 사유 등록.
      // accent 값 순서는 success 먼저 = React 기본값(=지금 문서의 그린). 값 '집합'만 코드와 같으면 되고
      // 순서는 검사에서 무시되므로, 기본 변형이 현재 모양을 유지하도록 골랐다.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SiteSection',
          [
            { name: 'tone', values: ['plain', 'subtle'] },
            { name: 'align', values: ['start', 'center'] },
            { name: 'accent', values: ['success', 'primary'] },
            { name: 'divider', values: ['false', 'true'] },
          ],
          (c) => renderSiteSection(ctx, c),
          {
            // title·subtitle은 React에서 ReactNode(<Highlight>로 일부 단어만 강조하려고)지만,
            // 세트에서 그려지는 실체는 텍스트 레이어 하나다 → TEXT 속성이 유일하게 쓸모 있는 표현이다.
            // (INSTANCE_SWAP은 아이콘 컴포넌트만 기본값으로 받을 수 있어 헤드라인을 표현할 수 없다.)
            texts: [
              { prop: 'title', layer: 'title', def: 'PORTFOLIO' },
              { prop: 'subtitle', layer: 'subtitle', def: '공간의 쓰임에서 출발한 프로젝트를 모았습니다.' },
            ],
          },
        ),
      // divider 기본값은 코드와 같은 false다 → 문서 3장은 divider='true'를 명시해 지금까지의 그림
      // (구분선 + 그린 세그먼트)을 그대로 유지한다.
      states: [
        { caption: 'Plain (흰 면)', props: { divider: 'true' } },
        { caption: 'Subtle (옅은 회색 면)', props: { tone: 'subtle', divider: 'true' } },
        { caption: 'Center (히어로)', props: { align: 'center', divider: 'true' } },
      ],
    },
    {
      key: 'SiteHeader',
      setName: 'DS/SiteHeader',
      eyebrow: 'ORGANISM · SITE',
      desc:
        '프론트 GNB. 좌 브랜드 / 우 메뉴 5개(활성 메뉴는 굵게 + 그린 밑줄) / 우 [1:1 문의]. ' +
        'transparent는 배경·보더 없이 히어로 위에 얹히는 변형이라 문서에서는 옅은 회색 면 위에 올려 배경이 비치는 것을 보여줍니다. ' +
        'active(1~5)는 현재 페이지 메뉴 — 19. Site Screens의 5화면이 이 축으로 자기 메뉴를 켭니다.',
      // 축: transparent · sticky(둘 다 React 불리언 prop) + active(아래 사유). 2×2×5 = 20변형.
      // active는 React prop이 아니다 — 대응물은 `value`(선택된 메뉴 값, string)인데 "어느 메뉴가
      // 굵고 밑줄인가"는 문자열이 아니라 시각 상태라 Figma에선 축으로만 표현된다. 19. Site Screens의
      // 5개 화면이 이 축으로 자기 메뉴를 켠다 → 지우면 화면 조립이 깨진다. ALLOWLIST에 사유 등록.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SiteHeader',
          [
            { name: 'transparent', values: ['false', 'true'] },
            { name: 'sticky', values: ['false', 'true'] },
            { name: 'active', values: ['1', '2', '3', '4', '5'] },
          ],
          (c) => renderSiteHeader(ctx, c),
          {
            // brand는 ReactNode(로고 슬롯)지만 세트에서 그려지는 실체는 워드마크 텍스트 하나다 → TEXT.
            // 예전의 'Action' TEXT 속성은 지웠다: 대응 prop인 `actions`는 문자열이 아니라 버튼이 들어오는
            // 노드 슬롯이고, 게다가 layer:'Action'은 존재하지 않는 레이어라 아무 데도 안 붙는 죽은 속성이었다.
            texts: [{ prop: 'brand', layer: 'brand', def: BRAND }],
            // showMenuButton — 레이어(.hamburger) 표시/숨김. 기본 false인 이유는 renderSiteHeader 주석 참고.
            bools: [{ prop: 'showMenuButton', layer: 'hamburger', def: false }],
            // menuIcon — 햄버거 아이콘 교체(React 기본값 lucide Menu와 같은 아이콘).
            swaps: [{ prop: 'menuIcon', layer: 'menuIcon', defKey: '_Icon/Menu' }],
          },
        ),
      states: [
        { caption: '기본(흰 면 + 하단 보더)', props: {} },
        { caption: '투명(히어로 위)', props: { transparent: 'true' }, backdrop: 'subtle' },
        { caption: '포트폴리오 활성', props: { active: '3' } },
      ],
    },
    {
      key: 'ProductCard',
      setName: 'DS/ProductCard',
      eyebrow: 'MOLECULE · SITE',
      desc:
        '고객용 상품 카드(어드민 AdminCard와 다른 물건). 3:4 세로 상품컷이 기본인 흰 카드. 가격은 흰 면 기준 그린(success-800) bold이고, ' +
        '품절이면 어두운 딤이 아니라 흰 베일 + 중앙 배지입니다(라이트 전용). variant(card·plain) × currency(won·symbol) 축이 추가됐습니다. ' +
        '텍스트 속성: brand · name · description · price(코드 prop 이름 그대로).',
      // 축 4개 = 4×2×2×2 = 32변형. accent(primary|success)는 다섯 번째 축이 되면 64변형이라 뺐다
      // (권장 상한 40 초과) — 기본값 success만 그린다. ALLOWLIST에 사유 등록.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ProductCard',
          [
            { name: 'ratio', values: ['3x4', '1x1', '4x3', '16x9'] },
            { name: 'soldOut', values: ['false', 'true'] },
            { name: 'variant', values: ['card', 'plain'] },
            { name: 'currency', values: ['won', 'symbol'] },
          ],
          (c) => renderProductCard(ctx, c),
          {
            texts: [
              { prop: 'brand', layer: 'brand', def: '스페이스플래닝' },
              { prop: 'name', layer: 'name', def: '라운드 화분 · 라이트그레이' },
              { prop: 'description', layer: 'description', def: '실내 식물에 맞춘 배수형 화분' },
              // price: number → Figma엔 숫자 속성 타입이 없어 '포맷된 문자열'을 TEXT로 연다.
              // 이름만은 코드 prop 그대로 'price'다(임의 이름 'Price' 금지).
              { prop: 'price', layer: 'price', def: '38,000원' },
            ],
          },
        ),
      states: [
        { caption: '3:4 · 기본', props: {} },
        { caption: '3:4 · 품절', props: { soldOut: 'true' } },
        { caption: '1:1', props: { ratio: '1x1' } },
        { caption: '1:1 · 품절', props: { ratio: '1x1', soldOut: 'true' } },
        { caption: '4:3', props: { ratio: '4x3' } },
        { caption: '4:3 · 품절', props: { ratio: '4x3', soldOut: 'true' } },
        { caption: 'Plain', props: { variant: 'plain' } },
        { caption: '₩ 기호', props: { currency: 'symbol' } },
      ],
    },
    {
      key: 'SortBar',
      setName: 'DS/SortBar',
      eyebrow: 'MOLECULE · SITE',
      desc: '목록 상단 정렬 바. 좌측 "전체 6개"(개수만 굵게), 우측 Select 2개(최신순 · 서비스별). 바 자체는 면을 깔지 않고 섹션 면 위에 그대로 얹힙니다.',
      // state=default는 React prop이 아니라 Figma의 구조적 요구다 — 컴포넌트 세트는 베리언트 속성이
      // 최소 1개 있어야 성립하는데 SortBar에는 유니온/불리언 prop이 하나도 없다. ALLOWLIST에 사유 등록.
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/SortBar', [{ name: 'state', values: ['default'] }], (c) => renderSortBar(ctx, c), {
          texts: [
            { prop: 'totalLabel', layer: 'totalLabel', def: '전체' },
            // total: number → price와 같은 이유로 TEXT. 레이어는 CSS 클래스(.count), 이름은 prop 그대로.
            { prop: 'total', layer: 'count', def: '6개' },
            { prop: 'totalSuffix', layer: 'totalSuffix', def: '' },
          ],
        }),
      states: [{ caption: '기본', props: {} }],
    },
    {
      key: 'SiteFooter',
      setName: 'DS/SiteFooter',
      eyebrow: 'ORGANISM · SITE',
      desc: '프론트 푸터. 본문과의 구분은 색 반전이 아니라 면 교차입니다 — 옅은 회색 면(color/bgSubtle) + 상단 보더. 브랜드 + 메뉴 링크 + SNS 3개 / 회사정보 6항목(상호·대표·사업자번호·주소·전화·이메일) / 카피라이트.',
      // state=default — SortBar와 같은 구조적 이유(축이 될 prop이 없다). ALLOWLIST에 사유 등록.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SiteFooter',
          [{ name: 'state', values: ['default'] }],
          (c) => renderSiteFooter(ctx, c),
          {
            texts: [
              // brand는 ReactNode 슬롯이지만 세트가 그리는 실체는 워드마크 텍스트 하나다(SiteHeader와 동일).
              { prop: 'brand', layer: 'brand', def: BRAND },
              { prop: 'copyright', layer: 'copyright', def: '© 2026 SPACE PLANNING Inc. All rights reserved.' },
            ],
            // show* 불리언 = 레이어 표시/숨김. 기본값은 React 기본값(둘 다 true)과 같다.
            bools: [
              { prop: 'showCompany', layer: 'company', def: true },
              { prop: 'showDivider', layer: 'bottomDivider', def: true },
            ],
            // social — SNS 아이콘 슬롯. 첫 아이콘이 스왑 대상이다(renderSiteFooter 주석 참고).
            swaps: [{ prop: 'social', layer: 'social', defKey: '_Icon/Globe' }],
          },
        ),
      states: [{ caption: '기본', props: {} }],
    },
    {
      key: 'InquiryForm',
      setName: 'DS/InquiryForm',
      eyebrow: 'ORGANISM · SITE',
      desc: '1:1 문의 폼. 이름·이메일·연락처·문의유형·제목·내용(카운터)·파일첨부(드롭존)·동의 체크·제출 버튼. 필수 표시(*)는 error 토큰이고, 제출 버튼은 면 color/solid-success + 글자 color/on-success라 어떤 프리셋에서도 면 위 글자가 AA를 넘습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/InquiryForm',
          [{ name: 'state', values: ['default'] }],
          (c) => renderInquiryForm(ctx, c),
          {
            texts: [
              { prop: 'Submit', layer: 'Submit Label', def: '문의 보내기' },
              { prop: 'Consent', layer: 'Consent Label', def: '개인정보 수집·이용에 동의합니다 (필수)' },
            ],
          },
        ),
      states: [{ caption: '기본', props: {} }],
    },
    {
      key: 'InfoCard',
      setName: 'DS/InfoCard',
      eyebrow: 'MOLECULE · SITE',
      desc: '오시는길의 정보 카드(Address · Phone · Email · Hours). 단일 컴포넌트이며 라벨/값 2줄과 아이콘은 인스턴스 속성으로 바꿉니다. 라벨은 흰 면 위 13px 글자라 그린 텍스트 셰이드(success-800)입니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/InfoCard', [{ name: 'state', values: ['default'] }], (c) => renderInfoCard(ctx, c), {
          texts: [
            { prop: 'Label', layer: 'Label', def: 'Address' },
            { prop: 'Line 1', layer: 'Line 1', def: '서울특별시 성동구 아차산로 111' },
            { prop: 'Line 2', layer: 'Line 2', def: '성수 쇼룸 2층 (성수동2가)' },
          ],
          swaps: [{ prop: 'Icon', layer: 'Info Icon', defKey: '_Icon/MapPin' }],
        }),
      states: [
        {
          caption: 'Address',
          props: {},
          texts: { Label: 'Address', 'Line 1': '서울특별시 성동구 아차산로 111', 'Line 2': '성수 쇼룸 2층 (성수동2가)' },
          swaps: { Icon: '_Icon/MapPin' },
        },
        {
          caption: 'Phone',
          props: {},
          texts: { Label: 'Phone', 'Line 1': '02-1234-5678', 'Line 2': '평일 상담 · 부재 시 콜백' },
          swaps: { Icon: '_Icon/Phone' },
        },
        {
          caption: 'Email',
          props: {},
          texts: { Label: 'Email', 'Line 1': 'hello@spaceplanning.ai', 'Line 2': '견적 문의는 24시간 접수' },
          swaps: { Icon: '_Icon/Envelope' },
        },
        {
          caption: 'Hours',
          props: {},
          texts: { Label: 'Hours', 'Line 1': '평일 09:00 - 18:00', 'Line 2': '점심 12:30 - 13:30 · 주말 휴무' },
          swaps: { Icon: '_Icon/Clock' },
        },
      ],
    },
  ],
}

// ── 사이트 페이지 생성 ───────────────────────────────────────────────
// 세트는 페이지 오른쪽(x=1360)에 세로로 쌓고, 문서(오토레이아웃)에는 인스턴스만 배치한다(admin.ts와 동일).
export async function generateSite(
  fontFamily: string,
  colors?: Record<string, string>,
  preset?: PresetName,
): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (!ctx.vars.get(V_ACCENT_SOLID) || !ctx.vars.get(V_ACCENT_TEXT)) {
    ctx.warnings.push(
      'color/solid-* · color/success 셰이드가 없어 그린 강조가 리터럴로 들어갑니다 — 토큰을 먼저 생성하세요.',
    )
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push(
      'Icon System 페이지가 없어 아이콘이 인라인 폴백됩니다 — 아이콘 스왑을 쓰려면 Icon System도 함께 생성하세요.',
    )
  }

  const cat = SITE_CATEGORY
  if (figma.root.children.some((p) => p.name === cat.pageName)) {
    // 페이지는 다시 만들지 않지만 이미 있는 세트를 레지스트리에 입양 → '프론트 화면'만 다시 돌려도 인스턴스 조립이 된다.
    const adopted = adoptSiteSets()
    ctx.warnings.push(
      `페이지 '${cat.pageName}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성'). 기존 컴포넌트 세트 ${adopted}개를 화면 조립에 재사용합니다.`,
    )
    return ctx.warnings
  }
  const page = figma.createPage()
  page.name = cat.pageName
  applyPageColorMode(ctx, page)

  SITE_SETS.clear() // 이전 실행의 유령 노드 제거
  const sets = SITE_SETS
  let sy = 200
  for (const doc of cat.docs) {
    try {
      const set = doc.build(ctx, page)
      set.x = 1360
      set.y = sy
      sy += set.height + 48
      bindTokens(ctx, set) // 보더·마진·라운드·불투명도 변수 바인딩
      sets.set(doc.setName, set) // = SITE_SETS — 화면(19)이 여기서 세트를 꺼낸다
    } catch (e) {
      ctx.warnings.push(`${doc.setName} 세트 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const root = makeRoot(cat.title)
  placeRoot(root, page)
  makeHeader(ctx, root, cat.title, cat.subtitle)
  for (const doc of cat.docs) {
    const render = makeSection(ctx, root, {
      eyebrow: doc.eyebrow,
      name: doc.key,
      desc: doc.desc,
      meta: [`Set: ${doc.setName}`, `상태 ${doc.states.length}개`, 'Platform: Web'],
      renderDir: 'WRAP',
    })
    const set = sets.get(doc.setName)
    if (!set) continue
    for (const st of doc.states) render.appendChild(variantItem(ctx, set, st))
  }
  return ctx.warnings
}
