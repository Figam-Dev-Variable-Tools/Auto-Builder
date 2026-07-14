// 프론트(사이트) 화면 페이지 — 스토리북 프론트 5화면을 1920 폭 화면 프레임으로.
// 정본(읽기 전용 소스): src/ds/SiteSection · SiteHeader · SiteFooter · ProductCard · SortBar ·
//                       AboutPage · HistoryPage · PortfolioPage · ShopPage · ContactPage · templates/SiteSuite.
//
// 오너 확정(2026-07): 화면은 '18. System - Client Pages'가 만든 컴포넌트 세트의 **인스턴스로 조립**한다.
//   헤더·푸터·상품카드·정렬바·문의폼·정보카드는 SITE_SETS에서 세트를 꺼내 createInstance → setProperties
//   (정렬바·정보카드의 세트 자체는 오너 확정으로 '15. Admin Component'에 그려지지만, 조회는 그대로 SITE_SETS다).
//   텍스트는 컴포넌트 TEXT 속성으로만 덮어쓴다(인스턴스 안 레이어를 직접 찾지 않는다).
//   폴백: '프론트 컴포넌트' 스코프 없이 화면만 켜면 SITE_SETS가 비어 있다 → draw* 경로로 직접 그리고 warning.
//
// 오너 확정(2026-07 개편): 이 화면 5종은 더 이상 별도 페이지(19)를 만들지 않는다.
// site.ts가 만드는(또는 이미 있는) '18. System - Client Pages'에 이어 그린다.
//
// ── 규격: 프론트는 라이트(흰색) 단일 테마다. 다크 반전은 없다 ────────────────
//   정본이 라이트로 재작성되면서 토큰 반전(배경=color/text)도 SiteSurface(라이트 아일랜드)도 사라졌다.
//   섹션 위계는 색 반전이 아니라 **면 교차**로 만든다(출처: SiteSection .tonePlain / .toneSubtle):
//     plain  → color/bg        (흰색)
//     subtle → color/bgSubtle  (아주 옅은 회색)
//   히어로의 어두운 오버레이도 방향이 뒤집혀 **흰 스크림**이 됐다(출처: AboutPage.module.css .heroScrim).
//
// ── 그린 강조(출처: SiteSection.module.css .accentSuccess) ──────────────────
//   선·면(장식)      : color/success/500  — --site-accent
//   흰 면 위 텍스트  : color/success/800  — --site-accent-text (가격·연도·라벨·숫자)
//   solid 면 + 글자  : color/solid-success + color/on-success (버튼·활성 칩·현재 페이지)
//     → 면과 글자가 한 쌍으로 계산되므로 어떤 프리셋에서도 면 위 글자가 AA(4.5:1)를 넘는다.
//
// 색·타이포·간격·라운드는 전부 Variables 바인딩(폴백은 리터럴 hex).
import {
  type Ctx,
  solid,
  boundPaint,
  boundText as bindText,
  bindFillVar,
  bindStrokeVar,
  bindTokens,
  setup,
  applyPageColorMode,
  INK,
  SUB,
  BORDER,
  SURFACE,
  ACCENT,
  WHITE,
} from './foundations'
import { iconInstance, ICON_COMPONENTS } from './icon-vec'
import { SITE_SETS, siteSet, adoptSiteSets, propKeys, MENU, PAGE_SITE, maxBottom } from './site'
import { OVERLAY_DESC_ALPHA, overlayAlpha } from './categories-shared'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) · Admin(15) · Layout(16) · Admin Pages(17) 다음.
// 오너 확정(2026-07 개편): 예전엔 이 파일이 직접 '19. System - Site Screens' 페이지를 만들었지만,
// 이제 화면 5종은 site.ts의 PAGE_SITE('18. System - Client Pages')에 이어 그린다(생성기 자체는 남긴다).
// 옛 페이지 이름은 재생성 삭제 목록에만 남긴다 — 안 그러면 개명 전 파일의 유령 페이지가 영영 안 지워진다.
const OLD_PAGE_SITE_SCREENS = '19. System - Site Screens'
export const SITE_SCREEN_PAGE_NAMES = [OLD_PAGE_SITE_SCREENS]

// ── 컴포넌트 인스턴스 조립 ───────────────────────────────────────────
type InstOpts = {
  /** 베리언트 축(축 이름 그대로). 예: { transparent: 'false', active: '3' } */
  variant?: Record<string, string>
  /** TEXT·BOOLEAN 속성(표시 이름 기준). */
  props?: Record<string, string | boolean>
  /** INSTANCE_SWAP(표시 이름 → 아이콘 키). */
  swaps?: Record<string, string>
  name?: string
}
/** 세트가 없다고 이미 경고한 이름 — 5화면 × 같은 세트로 경고가 도배되는 걸 막는다. */
const warnedMissing = new Set<string>()

/** SITE_SETS에서 세트를 꺼내 인스턴스를 만들고 속성을 건다. 없으면 null → 호출부가 draw* 폴백. */
function inst(ctx: Ctx, setName: string, opts: InstOpts = {}): InstanceNode | null {
  const set = siteSet(setName)
  if (!set) {
    if (!warnedMissing.has(setName)) {
      warnedMissing.add(setName)
      ctx.warnings.push(
        `${setName} 세트가 없어 화면에 직접 그렸습니다 — '프론트 컴포넌트'를 함께 생성하면 인스턴스로 조립됩니다.`,
      )
    }
    return null
  }

  let node: InstanceNode
  try {
    node = set.defaultVariant.createInstance()
  } catch (e) {
    ctx.warnings.push(`${setName} 인스턴스 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
  if (opts.name) node.name = opts.name

  // TEXT·BOOLEAN·INSTANCE_SWAP은 전체 키('Title#12:3')가 필요하다(베리언트 축만 이름 그대로).
  const keys = propKeys(set)
  const props: Record<string, string | boolean> = { ...(opts.variant ?? {}) }
  const missing: string[] = []
  const given = opts.props ?? {}
  for (const name of Object.keys(given)) {
    const key = keys[name]
    if (key) props[key] = given[name]
    else missing.push(name)
  }
  const swaps = opts.swaps ?? {}
  for (const name of Object.keys(swaps)) {
    const key = keys[name]
    const comp = ICON_COMPONENTS.get(swaps[name])
    if (key && comp) props[key] = comp.id
  }
  if (missing.length) ctx.warnings.push(`${setName}: 없는 속성 ${missing.join(', ')} — 무시했습니다.`)
  try {
    node.setProperties(props)
  } catch (e) {
    ctx.warnings.push(`${setName} setProperties 실패: ${e instanceof Error ? e.message : String(e)}`)
  }
  return node
}
/** 세로 부모 안에서 폭을 꽉 채우는 인스턴스. */
function instFill(n: InstanceNode): InstanceNode {
  n.layoutAlign = 'STRETCH'
  return n
}
/** 가로 부모 안에서 남는 폭을 가져가는 인스턴스. */
function instGrow(n: InstanceNode): InstanceNode {
  n.layoutGrow = 1
  return n
}

// ── 규격(정본 CSS의 수치) ────────────────────────────────────────────
const SCREEN_W = 1920
const MAX_XL = 1440 // SiteSection maxWidth=xl
const MAX_LG = 1200 // SiteSection maxWidth=lg (연혁)
const PAD_MD = 48 // SiteSection padding=md  → spacing-6 * 2
const PAD_LG = 96 // SiteSection padding=lg  → spacing-6 * 4
const SCREEN_GAP = 120 // 화면 프레임 간 세로 간격

const F_HERO = 40 // 히어로 헤드라인 — font/size 변수의 최대치(40). 그 위는 변수가 없어 바인딩이 끊긴다.
const F_TITLE = 32 // 섹션 헤드라인(영문 대형)
const F_LEAD = 24 // 중간 제목
const F_STAT = 40 // 숫자 성과
const F_YEAR = 36 // 연혁 연도
const F_BODY = 16 // 본문 문단
const F_TEXT = 14 // 기본 텍스트·서브카피
const F_SM = 13 // 카드 설명·폼 라벨
const F_XS = 12 // 캡션·힌트
const F_MICRO = 11 // 회사정보 라벨·저작권

const R_CARD = 12 // radius/lg
const R_CTRL = 8 // 컨트롤(입력·버튼)
const CTRL_H = 44 // 폼 컨트롤 높이(프론트는 어드민보다 넉넉)
const BTN_H = 48 // CTA 버튼

const BRAND = 'SPACE PLANNING'
// MENU는 site.ts가 단일 출처다 — 여기서 배열을 다시 쓰지 않는다(위 import 참조).

// ── 팔레트 — 라이트 단일(표면별 갈아끼우기가 사라졌다) ────────────────
const V_BG = 'color/bg' // 섹션 면(plain) · 카드 · 컨트롤
const V_SUBTLE = 'color/bgSubtle' // 섹션 면(subtle) · 이미지 자리 · 드롭존 · 푸터
const V_TEXT = 'color/text' // 본문 글자
const V_SUB = 'color/secondary' // 보조 글자
const V_BORDER = 'color/border' // 보더·구분선
const V_ERROR = 'color/error' // 필수 표시(*)

const TONE = 'success' // 프론트 기본 강조색(레퍼런스의 그린)
const V_ACCENT = `color/${TONE}/500` // 선·면(장식) — --site-accent
const V_ACCENT_TEXT = `color/${TONE}/800` // 흰 면 위 글자 — --site-accent-text
const V_SOLID = `color/solid-${TONE}` // solid 면(버튼·활성 칩·현재 페이지)
const V_ON = `color/on-${TONE}` // 그 면 위 글자

/** 섹션 면 — plain(흰색) / subtle(옅은 회색). 다크 밴드를 대체하는 리듬 장치다. */
type Tone = 'plain' | 'subtle'
const toneVar = (t: Tone) => (t === 'subtle' ? V_SUBTLE : V_BG)

// ── 폴백 hex(변수가 없을 때만) ───────────────────────────────────────
// 셰이드·solid·on 폴백은 tokens.ts(= scripts/build-tokens.mjs)와 같은 계산이라 값이 어긋나지 않는다.
const BASE_HEX: Record<string, string> = {
  primary: ACCENT,
  secondary: SUB,
  success: '#00C471',
  error: '#F04452',
  warning: '#FF9F0A',
  bg: WHITE,
  bgSubtle: SURFACE,
  text: INK,
  border: BORDER,
}
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
function mixHex(hex: string, target: string, amt: number): string {
  const a = parseInt(hex.replace('#', ''), 16)
  const b = parseInt(target.replace('#', ''), 16)
  const ch = (n: number, s: number) => (n >> s) & 255
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * amt)
  return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')
}

// solid/on 폴백 — 출처: tokens.ts solidColorFor·onColorFor(같은 공식·같은 임계값).
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
/** solid 면 — 흰 글자가 AA를 넘는 첫 셰이드(base → -600 → -700 → -800). 전부 실패하면 base(hue 보존). */
function solidHexOf(base: string): string {
  for (const amt of [0, 0.12, 0.24, 0.36]) {
    const surface = amt === 0 ? base.toUpperCase() : mixHex(base, '#000000', amt)
    if (contrastRatio('#FFFFFF', surface) >= WCAG_AA) return surface
  }
  return base.toUpperCase()
}
/** solid 면 위 글자 — 원칙적으로 흰색. 흰 글자가 불가능한 극단적 톤에서만 어두운 글자. */
function onHexOf(base: string): string {
  const surface = solidHexOf(base)
  if (contrastRatio('#FFFFFF', surface) >= WCAG_AA) return '#FFFFFF'
  for (let i = 48; i <= 100; i++) {
    const darker = mixHex(base, '#000000', i / 100)
    if (contrastRatio(darker, surface) >= WCAG_AA) return darker
  }
  return '#000000'
}
/** 'color/success/400' · 'color/solid-success' · 'color/on-success' → 폴백 hex(프리셋 base에서 계산). */
function hexOf(ctx: Ctx, varName: string): string {
  const direct = ctx.userColors[varName]
  if (direct) return direct
  const parts = varName.split('/') // color / key / step?
  const key = parts[1] ?? ''
  const baseOf = (k: string) => ctx.userColors['color/' + k] ?? BASE_HEX[k] ?? INK
  if (key.indexOf('solid-') === 0) return solidHexOf(baseOf(key.slice(6)))
  if (key.indexOf('on-') === 0) return onHexOf(baseOf(key.slice(3)))
  const base = baseOf(key)
  if (parts.length < 3) return base
  const step = SHADE_MIX[parts[2]]
  if (!step) return base
  return mixHex(base, step[0], step[1])
}

// ── 색·토큰 바인딩 — 정본(boundText·bindFillVar·bindStrokeVar·bindTokens)은 lib/bind.ts다.
// 이 파일은 hexOf()로 계산한 폴백 hex를 물려야 해서 얇은 래퍼로 감싼다 — 예전엔 site.ts와 함께
// 완전한 사본 2벌이었다(verify-bindings B4). 인스턴스 스킵 동작은 bindTokens의 { skipInstances: true }
// 옵션으로 흡수했다(세트 18. Site에서 이미 바인딩된 인스턴스에 또 오버라이드를 쌓지 않는다).
function siteText(ctx: Ctx, chars: string, size: number, varName: string, bold = false): TextNode {
  return bindText(ctx, chars, size, varName, hexOf(ctx, varName), bold)
}
function fillV(ctx: Ctx, n: GeometryMixin, varName: string) {
  bindFillVar(ctx, n, varName, hexOf(ctx, varName))
}
function strokeV(ctx: Ctx, n: MinimalStrokesMixin, varName: string) {
  bindStrokeVar(ctx, n, varName, hexOf(ctx, varName))
}
const T = (ctx: Ctx, s: string, size: number, v: string, bold = false) => siteText(ctx, s, size, v, bold)

// ── 레이아웃 원시 헬퍼(출처: screens.ts와 동일 규약) ──────────────────
function box(name: string, dir: 'HORIZONTAL' | 'VERTICAL', gap = 0): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'AUTO'
  f.counterAxisSizingMode = 'AUTO'
  f.itemSpacing = gap
  f.fills = []
  return f
}
const vbox = (name: string, gap = 0) => box(name, 'VERTICAL', gap)
const hbox = (name: string, gap = 0) => box(name, 'HORIZONTAL', gap)

/** 부모 폭을 꽉 채운다(세로 부모 안). */
function fill(f: FrameNode): FrameNode {
  f.layoutAlign = 'STRETCH'
  if (f.layoutMode === 'HORIZONTAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
/** 가로 부모 안에서 남는 폭을 가져간다(= 그리드 균등 분할). */
function grow(f: FrameNode): FrameNode {
  f.layoutGrow = 1
  if (f.layoutMode === 'HORIZONTAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
/** 가로 부모 안에서 높이를 꽉 채운다. */
function fillH(f: FrameNode): FrameNode {
  f.layoutAlign = 'STRETCH'
  if (f.layoutMode === 'VERTICAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
function pad(f: FrameNode, v: number, h: number = v): FrameNode {
  f.paddingTop = f.paddingBottom = v
  f.paddingLeft = f.paddingRight = h
  return f
}
function fixed(name: string, dir: 'HORIZONTAL' | 'VERTICAL', w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.fills = []
  return f
}
/** 1px 보더 + radius. */
function outline(ctx: Ctx, f: FrameNode, radius = R_CARD) {
  strokeV(ctx, f, V_BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  f.cornerRadius = radius
}
/** 아래쪽 1px 구분선만. strokeWeight가 mixed가 되어 bindTokens는 건너뛴다. */
function bottomLine(ctx: Ctx, f: FrameNode, varName = V_BORDER, w = 1) {
  strokeV(ctx, f, varName)
  f.strokeAlign = 'INSIDE'
  f.strokeTopWeight = 0
  f.strokeLeftWeight = 0
  f.strokeRightWeight = 0
  f.strokeBottomWeight = w
}
/** 위쪽 보더만(숫자 성과 항목·연혁 그룹·푸터). */
function topLine(ctx: Ctx, f: FrameNode, varName = V_BORDER, w = 1) {
  strokeV(ctx, f, varName)
  f.strokeAlign = 'INSIDE'
  f.strokeBottomWeight = 0
  f.strokeLeftWeight = 0
  f.strokeRightWeight = 0
  f.strokeTopWeight = w
}
/** 텍스트를 부모 폭에 맞춰 줄바꿈(세로 오토레이아웃 안). */
function wrap(t: TextNode, lineHeightPct?: number): TextNode {
  t.textAutoResize = 'HEIGHT'
  t.layoutAlign = 'STRETCH'
  if (lineHeightPct) t.lineHeight = { unit: 'PERCENT', value: lineHeightPct }
  return t
}
/** 텍스트를 가로 오토레이아웃 안에서 세로 가운데로 두기 위한 래퍼. */
function tbox(t: TextNode): FrameNode {
  const f = hbox('Text', 0)
  f.counterAxisAlignItems = 'CENTER'
  f.appendChild(t)
  return f
}

// ── 원자 ─────────────────────────────────────────────────────────────
/** 아이콘 — Icon System 페이지의 컴포넌트 인스턴스(없으면 인라인 벡터 폴백). 색은 변수 바인딩. */
function icon(ctx: Ctx, key: string, size: number, varName: string): SceneNode {
  const ic = iconInstance(key, key.replace('_Icon/', ''), size)
  const v = ctx.vars.get(varName)
  const paint: Paint = v ? boundPaint(v) : solid(hexOf(ctx, varName))
  const target = ic as unknown as { findOne?: (cb: (n: SceneNode) => boolean) => SceneNode | null }
  if (typeof target.findOne === 'function') {
    const vec = target.findOne((n) => n.type === 'VECTOR')
    if (vec) (vec as VectorNode).strokes = [paint]
  }
  return ic
}

type BtnKind = 'accent' | 'outline'
/**
 * 버튼. accent(solid)는 면 color/solid-success + 글자 color/on-success다 —
 * 표면(라이트/다크)에 따라 라벨색을 바꾸던 규칙은 사라졌다. 두 변수가 한 쌍으로 계산되므로
 * 어떤 프리셋에서도 그린 면 위 글자가 AA를 넘는다.
 */
function btn(ctx: Ctx, label: string, kind: BtnKind, h = CTRL_H, iconKey?: string): FrameNode {
  const b = hbox('Button / ' + label, 8)
  b.counterAxisSizingMode = 'FIXED'
  b.resize(b.width, h)
  b.counterAxisAlignItems = 'CENTER'
  b.primaryAxisAlignItems = 'CENTER'
  pad(b, 0, 20)
  b.cornerRadius = R_CTRL
  let fg = V_TEXT
  if (kind === 'accent') {
    fillV(ctx, b, V_SOLID)
    fg = V_ON
  } else {
    fillV(ctx, b, V_BG)
    strokeV(ctx, b, V_BORDER)
    b.strokeWeight = 1
    b.strokeAlign = 'INSIDE'
  }
  b.appendChild(T(ctx, label, F_TEXT, fg, true))
  if (iconKey) b.appendChild(icon(ctx, iconKey, 16, fg))
  return b
}

/** 이미지 자리 — 옅은 회색 면 + Image 아이콘(+ 캡션). 사진이 들어갈 칸을 명시한다. */
function imageBox(ctx: Ctx, w: number, h: number, caption?: string, radius = R_CARD): FrameNode {
  const f = fixed('Image / 이미지 자리', 'VERTICAL', w, h)
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.itemSpacing = 8
  f.cornerRadius = radius
  fillV(ctx, f, V_SUBTLE)
  f.appendChild(icon(ctx, '_Icon/Image', Math.max(20, Math.round(Math.min(w, h) * 0.16)), V_SUB))
  if (caption) f.appendChild(T(ctx, caption, F_XS, V_SUB))
  return f
}

/** 흰 카드 — 옅은 회색 면 위에서 판을 띄우는 기본 단위(보더 1px + 라운드). */
function card(ctx: Ctx, name: string, gap = 12): FrameNode {
  const c = vbox('Card / ' + name, gap)
  fillV(ctx, c, V_BG)
  outline(ctx, c)
  return c
}

/** 밑줄 탭(Tab variant=underline) — 활성 탭만 2px 강조 밑줄 + 강조 라벨. */
function underlineTabs(ctx: Ctx, items: string[], activeIndex: number): FrameNode {
  const bar = hbox('Tabs', 0)
  fill(bar)
  bar.counterAxisAlignItems = 'CENTER'
  bottomLine(ctx, bar) // 밑줄 트랙 — 활성 탭 아래만 강조색이 덮는다
  items.forEach((label, i) => {
    const active = i === activeIndex
    const t = hbox('Tab / ' + label, 0)
    t.counterAxisSizingMode = 'FIXED'
    t.resize(t.width, 48)
    t.counterAxisAlignItems = 'CENTER'
    pad(t, 0, 20)
    t.fills = []
    if (active) {
      // 밑줄은 "선"이라 장식용 -500
      strokeV(ctx, t, V_ACCENT)
      t.strokeAlign = 'INSIDE'
      t.strokeTopWeight = 0
      t.strokeLeftWeight = 0
      t.strokeRightWeight = 0
      t.strokeBottomWeight = 2
    }
    // 활성 라벨은 "글자"라 흰 면에서 AA를 넘는 -800
    t.appendChild(T(ctx, label, F_TEXT, active ? V_ACCENT_TEXT : V_SUB, active))
    bar.appendChild(t)
  })
  return bar
}

/** 칩 탭(CategoryTabs) — 활성은 solid 면(+ on 글자), 비활성은 흰 면 + 보더. */
function chipTabs(ctx: Ctx, items: string[], activeIndex: number): FrameNode {
  const bar = hbox('Category Tabs', 8)
  bar.counterAxisAlignItems = 'CENTER'
  items.forEach((label, i) => {
    const active = i === activeIndex
    const c = hbox('Chip / ' + label, 0)
    c.counterAxisSizingMode = 'FIXED'
    c.resize(c.width, 40)
    c.counterAxisAlignItems = 'CENTER'
    c.primaryAxisAlignItems = 'CENTER'
    pad(c, 0, 18)
    c.cornerRadius = 999
    if (active) {
      fillV(ctx, c, V_SOLID)
      c.appendChild(T(ctx, label, F_TEXT, V_ON, true))
    } else {
      fillV(ctx, c, V_BG)
      strokeV(ctx, c, V_BORDER)
      c.strokeWeight = 1
      c.strokeAlign = 'INSIDE'
      c.appendChild(T(ctx, label, F_TEXT, V_SUB))
    }
    bar.appendChild(c)
  })
  return bar
}

/** 페이지네이션 — 현재 페이지만 solid 칩(면 solid + 글자 on). '…'은 생략 구간. */
function pagination(ctx: Ctx, pages: string[], activeIndex: number): FrameNode {
  const row = hbox('Pagination', 6)
  fill(row)
  row.primaryAxisAlignItems = 'CENTER'
  row.counterAxisAlignItems = 'CENTER'

  const navBtn = (key: string) => {
    const b = fixed('Nav', 'HORIZONTAL', 40, 40)
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.cornerRadius = R_CTRL
    fillV(ctx, b, V_BG)
    strokeV(ctx, b, V_BORDER)
    b.strokeWeight = 1
    b.strokeAlign = 'INSIDE'
    b.appendChild(icon(ctx, key, 16, V_SUB))
    return b
  }
  row.appendChild(navBtn('_Icon/ChevronLeft'))
  pages.forEach((p, i) => {
    const cell = fixed('Page / ' + p, 'HORIZONTAL', 40, 40)
    cell.primaryAxisAlignItems = 'CENTER'
    cell.counterAxisAlignItems = 'CENTER'
    cell.cornerRadius = R_CTRL
    if (p === '…') {
      cell.fills = []
      cell.appendChild(T(ctx, '…', F_TEXT, V_SUB))
    } else if (i === activeIndex) {
      fillV(ctx, cell, V_SOLID)
      cell.appendChild(T(ctx, p, F_TEXT, V_ON, true))
    } else {
      cell.fills = []
      cell.appendChild(T(ctx, p, F_TEXT, V_SUB))
    }
    row.appendChild(cell)
  })
  row.appendChild(navBtn('_Icon/ChevronRight'))
  return row
}

/** 입력/셀렉트 한 칸(라벨 + 컨트롤). 폭은 부모에서 grow/fill로 정한다. */
function field(
  ctx: Ctx,
  label: string,
  placeholder: string,
  opts?: { required?: boolean; select?: boolean; h?: number },
): FrameNode {
  const f = vbox('Field / ' + label, 8)
  fill(f)
  const lb = hbox('Label', 3)
  lb.counterAxisAlignItems = 'CENTER'
  lb.appendChild(T(ctx, label, F_SM, V_TEXT, true))
  if (opts?.required) lb.appendChild(T(ctx, '*', F_SM, V_ERROR, true))
  f.appendChild(lb)

  const ctrl = hbox('Control', 8)
  fill(ctrl)
  ctrl.counterAxisSizingMode = 'FIXED'
  ctrl.resize(ctrl.width, opts?.h ?? CTRL_H)
  ctrl.counterAxisAlignItems = 'CENTER'
  pad(ctrl, 0, 14)
  ctrl.cornerRadius = R_CTRL
  fillV(ctx, ctrl, V_BG)
  strokeV(ctx, ctrl, V_BORDER)
  ctrl.strokeWeight = 1
  ctrl.strokeAlign = 'INSIDE'
  ctrl.appendChild(grow(tbox(T(ctx, placeholder, F_TEXT, V_SUB))))
  if (opts?.select) ctrl.appendChild(icon(ctx, '_Icon/ChevronDown', 16, V_SUB))
  f.appendChild(ctrl)
  return f
}

/** 셀렉트(SortBar의 [최신순 ▾]) — 라벨 없는 단독 컨트롤. */
function selectBox(ctx: Ctx, value: string, w: number): FrameNode {
  const s = fixed('Select / ' + value, 'HORIZONTAL', w, 40)
  s.counterAxisAlignItems = 'CENTER'
  s.itemSpacing = 8
  pad(s, 0, 14)
  s.cornerRadius = R_CTRL
  fillV(ctx, s, V_BG)
  strokeV(ctx, s, V_BORDER)
  s.strokeWeight = 1
  s.strokeAlign = 'INSIDE'
  s.appendChild(grow(tbox(T(ctx, value, F_TEXT, V_TEXT))))
  s.appendChild(icon(ctx, '_Icon/ChevronDown', 16, V_SUB))
  return s
}

/** 체크박스(개인정보 동의) — 체크되면 solid 면(primary)이라 면/글자를 solid-·on- 쌍으로 쓴다. */
function checkbox(ctx: Ctx, label: string, checked = false): FrameNode {
  const row = hbox('Checkbox', 10)
  row.counterAxisAlignItems = 'CENTER'
  const b = fixed('Box', 'HORIZONTAL', 18, 18)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = 4
  if (checked) {
    fillV(ctx, b, 'color/solid-primary')
    b.appendChild(icon(ctx, '_Icon/Check', 13, 'color/on-primary'))
  } else {
    fillV(ctx, b, V_BG)
    strokeV(ctx, b, V_BORDER)
    b.strokeWeight = 1
    b.strokeAlign = 'INSIDE'
  }
  row.appendChild(b)
  row.appendChild(T(ctx, label, F_TEXT, V_TEXT))
  return row
}

/** 배지(상품 카드의 SALE·품절) — solid 면 + on 글자(Badge appearance="solid"와 같은 규칙). */
function badge(ctx: Ctx, label: string, tone: 'success' | 'secondary'): FrameNode {
  const c = hbox('Badge / ' + label, 0)
  c.counterAxisAlignItems = 'CENTER'
  pad(c, 5, 9)
  c.cornerRadius = 6
  fillV(ctx, c, `color/solid-${tone}`)
  c.appendChild(T(ctx, label, F_MICRO, `color/on-${tone}`, true))
  return c
}

// ── 섹션 골격(SiteSection) ───────────────────────────────────────────
/**
 * 1920 폭 섹션 = 배경(전폭) + 최대폭 본문(1440/1200 중앙 정렬).
 * 반환값은 본문 컨테이너(inner) — 호출부는 여기에 내용을 담는다.
 */
function siteSection(
  ctx: Ctx,
  screen: FrameNode,
  name: string,
  opts?: { tone?: Tone; padY?: number; maxW?: number; gap?: number },
): FrameNode {
  const padY = opts?.padY ?? PAD_MD
  const maxW = opts?.maxW ?? MAX_XL
  const sec = vbox('Section / ' + name, 0)
  fill(sec)
  sec.counterAxisAlignItems = 'CENTER'
  sec.paddingTop = sec.paddingBottom = padY
  sec.paddingLeft = sec.paddingRight = (SCREEN_W - maxW) / 2
  fillV(ctx, sec, toneVar(opts?.tone ?? 'plain'))
  screen.appendChild(sec)

  const inner = vbox('inner', opts?.gap ?? 24)
  inner.counterAxisSizingMode = 'FIXED'
  inner.resize(maxW, 10)
  sec.appendChild(inner)
  return inner
}

/**
 * 섹션 헤더 — 영문 대형 헤드라인 + 한글 서브카피 (+ 우측 액션) + 구분선.
 * divider는 정본에서 "얇은 룰 + 좌측 강조 세그먼트"다 → 48x2 강조 바 + 나머지 1px 선으로 재현한다.
 */
function sectionHead(
  ctx: Ctx,
  inner: FrameNode,
  title: string,
  subtitle: string,
  opts?: { size?: number; actions?: SceneNode; divider?: boolean },
) {
  const head = vbox('Header', 16)
  fill(head)

  const row = hbox('row', 24)
  fill(row)
  row.counterAxisAlignItems = 'MAX' // 헤드라인과 액션을 바닥선에 맞춘다(align-items: flex-end)
  const headings = vbox('headings', 8)
  grow(headings)
  const h = T(ctx, title, opts?.size ?? F_TITLE, V_TEXT, true)
  h.letterSpacing = { unit: 'PERCENT', value: -2 }
  headings.appendChild(wrap(h, 115))
  headings.appendChild(wrap(T(ctx, subtitle, F_TEXT, V_SUB), 160))
  row.appendChild(headings)
  if (opts?.actions) row.appendChild(opts.actions)
  head.appendChild(row)

  if (opts?.divider !== false) {
    const rule = hbox('Rule', 0)
    fill(rule)
    rule.counterAxisSizingMode = 'FIXED'
    rule.resize(rule.width, 2)
    rule.counterAxisAlignItems = 'MAX' // 1px 선은 아래에 붙고, 강조 세그먼트만 2px로 도드라진다
    const seg = fixed('Accent', 'HORIZONTAL', 48, 2)
    fillV(ctx, seg, V_ACCENT)
    rule.appendChild(seg)
    const line = fixed('Line', 'HORIZONTAL', 10, 1)
    grow(line)
    fillV(ctx, line, V_BORDER)
    rule.appendChild(line)
    head.appendChild(rule)
  }
  inner.appendChild(head)
}

// ── 사이트 크롬(헤더·푸터) ───────────────────────────────────────────
/**
 * GNB = DS/SiteHeader 인스턴스. 현재 페이지 메뉴는 베리언트 축 active(1~5)로 켠다.
 * 세트가 없으면 직접 그린다(drawSiteHeader).
 */
function siteHeader(ctx: Ctx, screen: FrameNode, activeIndex: number) {
  const node = inst(ctx, 'DS/SiteHeader', {
    name: 'Site Header',
    variant: { transparent: 'false', active: String(activeIndex + 1) },
    // 'Action' TEXT는 세트에서 제거됐다(actions는 문자열이 아니라 버튼 슬롯이다 — site.ts 참고).
    // 넘기던 값이 renderSiteHeader가 그리는 기본 라벨과 같아 그림은 그대로다.
    props: { brand: BRAND },
  })
  if (node) {
    screen.appendChild(instFill(node))
    return
  }
  drawSiteHeader(ctx, screen, activeIndex)
}

/** 폴백 — DS/SiteHeader 세트가 없을 때. */
function drawSiteHeader(ctx: Ctx, screen: FrameNode, activeIndex: number) {
  const bar = hbox('Site Header', 20)
  fill(bar)
  bar.counterAxisAlignItems = 'CENTER'
  pad(bar, 14, 24)
  fillV(ctx, bar, V_BG)
  bottomLine(ctx, bar)

  bar.appendChild(T(ctx, BRAND, 20, V_TEXT, true))

  const nav = hbox('nav', 24)
  nav.counterAxisAlignItems = 'CENTER'
  MENU.forEach((label, i) => {
    const active = i === activeIndex
    const it = hbox('Item / ' + label, 0)
    it.counterAxisSizingMode = 'FIXED'
    it.resize(it.width, 28)
    it.counterAxisAlignItems = 'CENTER'
    it.fills = []
    if (active) {
      // 활성 메뉴 밑줄 — 장식(선)이라 -500
      strokeV(ctx, it, V_ACCENT)
      it.strokeAlign = 'INSIDE'
      it.strokeTopWeight = 0
      it.strokeLeftWeight = 0
      it.strokeRightWeight = 0
      it.strokeBottomWeight = 2
    }
    it.appendChild(T(ctx, label, F_TEXT, active ? V_TEXT : V_SUB, active))
    nav.appendChild(it)
  })
  const spacer = hbox('spacer', 0)
  bar.appendChild(grow(spacer))
  bar.appendChild(nav)
  bar.appendChild(btn(ctx, '1:1 문의', 'accent', 36))
  screen.appendChild(bar)
}

/** 푸터 = DS/SiteFooter 인스턴스. 세트가 없으면 직접 그린다(drawSiteFooter). */
function siteFooter(ctx: Ctx, screen: FrameNode) {
  const node = inst(ctx, 'DS/SiteFooter', {
    name: 'Site Footer',
    props: { brand: BRAND, copyright: '© 2026 SPACE PLANNING Inc. All rights reserved.' },
  })
  if (node) {
    screen.appendChild(instFill(node))
    return
  }
  drawSiteFooter(ctx, screen)
}

/** 폴백 — 옅은 회색 면 + 상단 보더(색 반전이 아니라 면 교차로 본문과 구분한다). */
function drawSiteFooter(ctx: Ctx, screen: FrameNode) {
  const sec = vbox('Site Footer', 0)
  fill(sec)
  sec.counterAxisAlignItems = 'CENTER'
  pad(sec, 40, (SCREEN_W - MAX_XL) / 2)
  fillV(ctx, sec, V_SUBTLE)
  topLine(ctx, sec)

  const inner = vbox('inner', 24)
  inner.counterAxisSizingMode = 'FIXED'
  inner.resize(MAX_XL, 10)

  const top = hbox('top', 24)
  fill(top)
  top.counterAxisAlignItems = 'CENTER'
  top.appendChild(T(ctx, BRAND, F_LEAD, V_TEXT, true))
  const links = hbox('links', 20)
  links.counterAxisAlignItems = 'CENTER'
  MENU.forEach((l) => links.appendChild(T(ctx, l, F_SM, V_SUB)))
  top.appendChild(grow(hbox('sp', 0)))
  top.appendChild(links)
  const social = hbox('social', 12)
  social.counterAxisAlignItems = 'CENTER'
  ;['_Icon/Globe', '_Icon/MessageSquare', '_Icon/Send'].forEach((k) => social.appendChild(icon(ctx, k, 18, V_SUB)))
  top.appendChild(social)
  inner.appendChild(top)

  const company = hbox('company', 20)
  fill(company)
  company.layoutWrap = 'WRAP'
  company.counterAxisSpacing = 8
  const COMPANY: Array<[string, string]> = [
    ['상호', '스페이스플래닝 주식회사'],
    ['대표', '홍성보'],
    ['사업자번호', '123-45-67890'],
    ['주소', '서울특별시 성동구 아차산로 111, 2층'],
    ['전화', '02-1234-5678'],
    ['이메일', 'hello@spaceplanning.ai'],
  ]
  COMPANY.forEach(([k, v]) => {
    const it = hbox('c / ' + k, 8)
    it.counterAxisAlignItems = 'CENTER'
    it.appendChild(T(ctx, k, F_MICRO, V_SUB))
    it.appendChild(T(ctx, v, F_SM, V_TEXT))
    company.appendChild(it)
  })
  inner.appendChild(company)

  const bottom = hbox('bottom', 12)
  fill(bottom)
  bottom.counterAxisAlignItems = 'CENTER'
  bottom.paddingTop = 16
  topLine(ctx, bottom)
  bottom.appendChild(T(ctx, '© 2026 SPACE PLANNING Inc. All rights reserved.', F_MICRO, V_SUB))
  inner.appendChild(bottom)

  sec.appendChild(inner)
  screen.appendChild(sec)
}

/** 1920 화면 프레임 — 헤더/섹션/푸터가 세로로 쌓인다. */
function screenFrame(ctx: Ctx, name: string): FrameNode {
  const f = figma.createFrame()
  f.name = 'Screen/' + name
  f.layoutMode = 'VERTICAL'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(SCREEN_W, 900)
  f.primaryAxisSizingMode = 'AUTO'
  f.itemSpacing = 0
  fillV(ctx, f, V_BG)
  return f
}

// ══ 1. 회사 소개(AboutPage) ══════════════════════════════════════════
function screenAbout(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '회사 소개')
  siteHeader(ctx, s, 0)

  // ── 히어로(흰 면) — 사진 패널 + 흰 스크림 + 대형 영문 헤드라인 + CTA ──
  const heroSec = siteSection(ctx, s, '히어로', { padY: PAD_LG })
  const hero = vbox('Hero', 24)
  fill(hero)
  hero.counterAxisSizingMode = 'FIXED'
  hero.primaryAxisSizingMode = 'FIXED'
  hero.resize(MAX_XL, 460)
  hero.primaryAxisAlignItems = 'MAX' // 콘텐츠는 바닥 정렬(align-items: flex-end)
  pad(hero, 48)
  hero.cornerRadius = R_CARD
  hero.clipsContent = true
  fillV(ctx, hero, V_SUBTLE) // 배경 사진 자리

  // 흰 스크림 — 좌측을 거의 흰색으로 덮어 좌측 정렬 헤드라인의 대비를 확보하고, 우측으로 갈수록 사진을 드러낸다.
  // (출처: AboutPage.module.css .heroScrim — 다크 오버레이의 라이트 대응물이다.)
  // 그라데이션 스톱은 Figma 변수에 바인딩할 수 없어 알파 흰색 리터럴을 쓴다(포트폴리오 스크림과 같은 예외).
  const scrim = figma.createRectangle()
  scrim.name = 'Scrim / 흰 스크림'
  scrim.resize(MAX_XL, 460)
  scrim.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      gradientStops: [
        { position: 0, color: { r: 1, g: 1, b: 1, a: 0.94 } },
        { position: 0.45, color: { r: 1, g: 1, b: 1, a: 0.82 } },
        { position: 1, color: { r: 1, g: 1, b: 1, a: 0.3 } },
      ],
    },
  ]
  hero.appendChild(scrim)
  scrim.layoutPositioning = 'ABSOLUTE'
  scrim.x = 0
  scrim.y = 0

  const heroTop = hbox('배경 이미지 자리', 8)
  fill(heroTop)
  grow(heroTop)
  heroTop.primaryAxisAlignItems = 'MAX'
  heroTop.counterAxisAlignItems = 'MIN'
  heroTop.appendChild(icon(ctx, '_Icon/Image', 24, V_SUB))
  hero.appendChild(heroTop)

  const heroCopy = vbox('copy', 12)
  heroCopy.counterAxisSizingMode = 'FIXED'
  heroCopy.resize(760, 10)
  // 스크림이 흰 면을 깔아 둔 자리라 "흰 면 위 글자" 셰이드(-800)
  const eyebrow = T(ctx, 'ABOUT US', F_XS, V_ACCENT_TEXT, true)
  eyebrow.letterSpacing = { unit: 'PERCENT', value: 14 }
  heroCopy.appendChild(eyebrow)
  const heroTitle = T(ctx, 'We plan the space,\nnot the furniture.', F_HERO, V_TEXT, true)
  heroTitle.letterSpacing = { unit: 'PERCENT', value: -3 }
  heroCopy.appendChild(wrap(heroTitle, 108))
  heroCopy.appendChild(
    wrap(
      T(
        ctx,
        '가구를 채우기 전에 머무는 시간을 먼저 설계합니다. 공간의 쓰임에서 출발하는 인테리어 스튜디오입니다.',
        F_TEXT,
        V_SUB,
      ),
      170,
    ),
  )
  const heroCta = hbox('cta', 0)
  heroCta.paddingTop = 8
  heroCta.appendChild(btn(ctx, '프로젝트 문의하기', 'accent', BTN_H, '_Icon/ArrowRight'))
  heroCopy.appendChild(heroCta)
  hero.appendChild(heroCopy)
  heroSec.appendChild(hero)

  // ── 회사 개요(흰 면) — 좌 텍스트 / 우 이미지 ──
  const introSec = siteSection(ctx, s, '회사 개요', { gap: 40 })
  sectionHead(ctx, introSec, 'Who we are', '2022년 서울에서 시작한 공간 설계 스튜디오입니다.')
  const introGrid = hbox('grid', 48)
  fill(introGrid)
  introGrid.counterAxisAlignItems = 'CENTER'
  const introText = vbox('text', 16)
  grow(introText)
  ;[
    '스페이스플래닝은 카페와 리테일 매장에서 출발해 사무실, 주거, 상업 공간까지 다뤄왔습니다. 도면을 받는 순간부터 준공 후 하자 보수까지, 한 팀이 처음과 끝을 함께 책임집니다.',
    '좋은 공간은 자재 목록이 아니라 사람의 동선에서 나온다고 믿습니다. 누가 얼마나 오래 머무는지를 먼저 읽고, 그다음에 마감재를 고릅니다.',
    '2026년부터는 공간을 채우는 화분과 식물을 직접 골라 파는 온라인 스토어도 함께 운영합니다.',
  ].forEach((p) => introText.appendChild(wrap(T(ctx, p, F_BODY, V_TEXT), 180)))
  introGrid.appendChild(introText)
  introGrid.appendChild(imageBox(ctx, 620, 465, '스튜디오 내부 (4:3)')) // 4:3
  introSec.appendChild(introGrid)

  // ── 핵심 역량(옅은 회색 면) — 흰 카드 4장. 다크 밴드가 하던 "구간 나누기"를 면 교차가 대신한다. ──
  const capSec = siteSection(ctx, s, '핵심 역량', { tone: 'subtle', gap: 40 })
  sectionHead(ctx, capSec, 'What we do', '공간 기획부터 스타일링까지, 한 팀이 처음과 끝을 책임집니다.')
  const capGrid = hbox('grid', 20)
  fill(capGrid)
  capGrid.counterAxisAlignItems = 'MIN'
  const CAPS: Array<[string, string, string]> = [
    ['_Icon/Compass', '공간 기획', '브랜드와 운영 방식을 먼저 듣고, 평면을 그리기 전에 쓰임을 정리합니다.'],
    ['_Icon/PenLine', '설계·도면', '평면·입면·전기·조명 도면을 한 벌로 냅니다. 시공사와 같은 도면 위에서 일합니다.'],
    ['_Icon/Hammer', '시공 관리', '직영 반장이 현장에 상주해 공정과 품질을 관리하고 주 1회 사진으로 보고합니다.'],
    ['_Icon/Leaf', '스타일링·식재', '준공 후 화분과 식물, 소품까지 배치해 첫 손님을 맞을 수 있는 상태로 넘깁니다.'],
  ]
  for (const [key, title, desc] of CAPS) {
    const c = card(ctx, title, 12)
    grow(c)
    pad(c, 24)
    const iconWrap = fixed('icon', 'HORIZONTAL', 40, 40)
    iconWrap.primaryAxisAlignItems = 'CENTER'
    iconWrap.counterAxisAlignItems = 'CENTER'
    iconWrap.cornerRadius = R_CTRL
    fillV(ctx, iconWrap, V_SUBTLE)
    iconWrap.appendChild(icon(ctx, key, 22, V_ACCENT_TEXT)) // 흰 판 위 아이콘 → -800
    c.appendChild(iconWrap)
    c.appendChild(wrap(T(ctx, title, 18, V_TEXT, true), 140))
    c.appendChild(wrap(T(ctx, desc, F_SM, V_SUB), 170))
    capGrid.appendChild(c)
  }
  capSec.appendChild(capGrid)

  // ── 숫자 성과(흰 면) — 큰 숫자 + 라벨 ──
  const statSec = siteSection(ctx, s, '숫자 성과', { gap: 40 })
  sectionHead(ctx, statSec, 'By the numbers', '숫자로 보는 스튜디오의 기록입니다.')
  const statGrid = hbox('grid', 20)
  fill(statGrid)
  const STATS: Array<[string, string]> = [
    ['252', '누적 프로젝트'],
    ['104', '함께한 고객사'],
    ['5년', '업력'],
    ['78%', '재의뢰율'],
  ]
  for (const [value, label] of STATS) {
    const it = vbox('Stat / ' + label, 8)
    grow(it)
    it.paddingTop = it.paddingBottom = 20
    topLine(ctx, it, V_BORDER, 2) // border-top 2px(--ds-border-width-thick)
    const v = T(ctx, value, F_STAT, V_ACCENT_TEXT, true)
    v.letterSpacing = { unit: 'PERCENT', value: -2 }
    it.appendChild(v)
    it.appendChild(T(ctx, label, F_TEXT, V_SUB))
    statGrid.appendChild(it)
  }
  statSec.appendChild(statGrid)

  // ── CTA 밴드(옅은 회색 면) ──
  const ctaSec = siteSection(ctx, s, 'CTA', { tone: 'subtle', padY: PAD_LG })
  const band = hbox('CTA Band', 48)
  fill(band)
  band.counterAxisAlignItems = 'CENTER'
  const ctaText = vbox('text', 8)
  grow(ctaText)
  const ctaTitle = T(ctx, "Let's plan it together.", F_TITLE, V_TEXT, true)
  ctaTitle.letterSpacing = { unit: 'PERCENT', value: -2 }
  ctaText.appendChild(wrap(ctaTitle, 115))
  ctaText.appendChild(wrap(T(ctx, '공간과 예산만 알려주시면 3일 안에 제안서를 보내드립니다.', F_TEXT, V_SUB), 160))
  band.appendChild(ctaText)
  band.appendChild(btn(ctx, '프로젝트 문의하기', 'accent', BTN_H, '_Icon/ArrowRight'))
  ctaSec.appendChild(band)

  siteFooter(ctx, s)
  return s
}

// ══ 2. 연혁(HistoryPage) ═════════════════════════════════════════════
type HItem = { month: string; title: string; desc: string; image?: string }
type HGroup = { year: string; items: HItem[] }
const HISTORY: HGroup[] = [
  {
    year: '2026',
    items: [
      {
        month: '3월',
        title: '온라인 스토어 오픈',
        desc: '공간을 채우는 화분·식물·용토를 직접 골라 파는 스토어를 열었습니다.',
        image: '3월 · 온라인 스토어 오픈',
      },
      { month: '6월', title: '누적 프로젝트 250건 돌파', desc: '상업공간 비중이 절반을 넘었습니다.' },
    ],
  },
  {
    year: '2025',
    items: [
      {
        month: '2월',
        title: '성수 쇼룸 오픈',
        desc: '설계 사무실과 쇼룸을 합쳐 실제 마감재를 만져보고 고를 수 있게 했습니다.',
        image: '2월 · 성수 쇼룸 오픈',
      },
      { month: '7월', title: '굿디자인 어워드 공간부문 수상', desc: '연남동 로스터리 카페 프로젝트' },
      { month: '11월', title: '팀 30명 규모로 확대', desc: '설계·시공·스타일링 3개 팀 체제로 전환' },
    ],
  },
  {
    year: '2024',
    items: [
      { month: '4월', title: '법인 전환 및 사명 변경', desc: '스페이스플래닝 주식회사로 새로 출발했습니다.' },
      {
        month: '9월',
        title: '판교 IT기업 사옥 라운지 수주',
        desc: '단일 프로젝트로는 첫 1,000㎡ 규모.',
        image: '9월 · 판교 사옥 라운지',
      },
    ],
  },
  {
    year: '2023',
    items: [
      { month: '5월', title: '제주 세컨하우스 프로젝트 착수', desc: '주거 공간으로 영역을 넓혔습니다.' },
      { month: '10월', title: '시공 파트너십 체결', desc: '직영 시공팀을 두고 공정 관리를 내재화했습니다.' },
    ],
  },
  {
    year: '2022',
    items: [
      {
        month: '1월',
        title: '스페이스플래닝 설립',
        desc: '망원동 6평 사무실에서 두 명으로 시작했습니다.',
        image: '1월 · 망원동 6평 사무실',
      },
      { month: '8월', title: '첫 상업공간 프로젝트 완료', desc: '연희동 15평 베이커리' },
    ],
  },
]

function screenHistory(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '연혁')
  siteHeader(ctx, s, 1)

  // 연혁은 정본에서 maxWidth=lg(1200) · padding=lg
  const sec = siteSection(ctx, s, '연혁', { padY: PAD_LG, maxW: MAX_LG, gap: 24 })
  sectionHead(ctx, sec, 'History', '망원동 6평 사무실에서 시작해 지금까지 걸어온 길입니다.')

  const groups = vbox('groups', 0)
  fill(groups)
  HISTORY.forEach((g, gi) => {
    const row = hbox('Year / ' + g.year, 24)
    fill(row)
    row.counterAxisAlignItems = 'MIN'
    row.paddingTop = row.paddingBottom = 36 // spacing-6 * 1.5
    if (gi > 0) topLine(ctx, row) // 연도 그룹 사이 구분선(첫 그룹은 헤더 룰과 겹치지 않게 생략)

    // 좌 — 큰 연도(강조) + 건수
    const yearCol = vbox('year', 8)
    yearCol.counterAxisSizingMode = 'FIXED'
    yearCol.resize(200, 10)
    const y = T(ctx, g.year, F_YEAR, V_ACCENT_TEXT, true)
    y.letterSpacing = { unit: 'PERCENT', value: -2 }
    yearCol.appendChild(y)
    yearCol.appendChild(T(ctx, `${g.items.length}건`, F_XS, V_SUB))
    row.appendChild(yearCol)

    // 중 — 타임라인(점 + 연결선 + 월·제목·설명)
    const rail = vbox('rail', 20)
    grow(rail)
    g.items.forEach((item, ii) => {
      const line = hbox('Item / ' + item.title, 12)
      fill(line)
      line.counterAxisAlignItems = 'MIN'

      const marker = fixed('marker', 'VERTICAL', 16, 40)
      fillH(marker)
      marker.counterAxisAlignItems = 'CENTER'
      marker.itemSpacing = 4
      marker.paddingTop = 5
      const dot = figma.createEllipse()
      dot.resize(10, 10)
      const av = ctx.vars.get(V_ACCENT_TEXT)
      dot.fills = [av ? boundPaint(av) : solid(hexOf(ctx, V_ACCENT_TEXT))]
      marker.appendChild(dot)
      if (ii < g.items.length - 1) {
        const conn = fixed('connector', 'VERTICAL', 2, 10)
        conn.layoutGrow = 1 // 항목 높이만큼 늘어나는 연결선
        fillV(ctx, conn, V_BORDER)
        marker.appendChild(conn)
      }
      line.appendChild(marker)

      const body = vbox('body', 4)
      grow(body)
      body.appendChild(T(ctx, `${g.year} · ${item.month}`, F_XS, V_SUB))
      body.appendChild(wrap(T(ctx, item.title, F_BODY, V_TEXT, true), 140))
      body.appendChild(wrap(T(ctx, item.desc, F_SM, V_SUB), 160))
      line.appendChild(body)
      rail.appendChild(line)
    })
    row.appendChild(rail)

    // 우 — 사진(있는 항목만)
    const figures = g.items.filter((i) => i.image)
    if (figures.length > 0) {
      const media = vbox('media', 16)
      media.counterAxisSizingMode = 'FIXED'
      media.resize(280, 10)
      figures.forEach((f) => {
        const fig = vbox('figure', 8)
        fill(fig)
        fig.appendChild(imageBox(ctx, 280, 210)) // 4:3
        fig.appendChild(wrap(T(ctx, f.image ?? '', F_XS, V_SUB), 150))
        media.appendChild(fig)
      })
      row.appendChild(media)
    }
    groups.appendChild(row)
  })
  sec.appendChild(groups)

  siteFooter(ctx, s)
  return s
}

// ══ 3. 포트폴리오(PortfolioPage) ═════════════════════════════════════
const PORTFOLIO: Array<[string, string]> = [
  ['연남동 로스터리 카페', '카페'],
  ['반포 아파트 34평 리모델링', '주거'],
  ['가로수길 플래그십 스토어', '상업'],
  ['성수 공유오피스 리뉴얼', '사무실'],
  ['판교 IT기업 사옥 라운지', '사무실'],
  ['한남동 디저트 바', '카페'],
]

function screenPortfolio(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '포트폴리오')
  siteHeader(ctx, s, 2)

  const sec = siteSection(ctx, s, '포트폴리오', { padY: PAD_MD, gap: 24 })

  // 헤더 우측 액션 — "9 Projects"
  const count = hbox('count', 6)
  count.counterAxisAlignItems = 'CENTER'
  count.appendChild(T(ctx, '9', 20, V_ACCENT_TEXT, true))
  count.appendChild(T(ctx, 'Projects', F_TEXT, V_SUB))
  sectionHead(ctx, sec, 'Portfolio', '공간의 쓰임에서 출발한 설계 — 카페·사무실·주거·상업 프로젝트를 소개합니다.', {
    actions: count,
  })

  sec.appendChild(chipTabs(ctx, ['전체', '카페', '사무실', '주거', '상업'], 0))

  // 이미지 그리드 3열 — 오버레이 카드(이미지 위 제목/카테고리 + 하단 그라데이션 스크림)
  const grid = vbox('grid', 24)
  fill(grid)
  for (let r = 0; r < 2; r++) {
    const row = hbox('row', 24)
    fill(row)
    for (let c = 0; c < 3; c++) {
      const [title, cat] = PORTFOLIO[r * 3 + c]
      const tile = vbox('Tile / ' + title, 0)
      grow(tile)
      tile.primaryAxisSizingMode = 'FIXED'
      tile.resize(tile.width, 348) // 4:3 (464 × 348)
      tile.primaryAxisAlignItems = 'MAX' // 오버레이는 하단
      tile.cornerRadius = R_CARD
      tile.clipsContent = true
      fillV(ctx, tile, V_SUBTLE) // 사진 자리

      const ph = hbox('사진 자리', 0)
      fill(ph)
      grow(ph)
      ph.primaryAxisAlignItems = 'CENTER'
      ph.counterAxisAlignItems = 'CENTER'
      ph.appendChild(icon(ctx, '_Icon/Image', 48, V_SUB))
      tile.appendChild(ph)

      // 스크림 — 정본도 색 토큰이 아닌 알파 검정을 쓴다(오버레이 흰 글자는 '사진' 위에서만 읽히므로).
      // 라이트 전환과 무관하다: 이 막은 섹션 면이 아니라 사진 위에 얹히는 것이다(PortfolioPage .tile::after).
      const scrim = vbox('scrim', 4)
      fill(scrim)
      pad(scrim, 20)
      scrim.paddingTop = 56
      scrim.fills = [
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [
            [0, 1, 0],
            [-1, 0, 1],
          ],
          gradientStops: [
            { position: 0, color: { r: 0, g: 0, b: 0, a: 0 } },
            { position: 1, color: { r: 0, g: 0, b: 0, a: 0.78 } },
          ],
        },
      ]
      scrim.appendChild(wrap(T(ctx, title, 18, V_BG, true), 140)) // 스크림 위 글자는 항상 흰색
      // 카테고리 줄은 한 단계 흐리게 — React(ImageCard .overlayDescription)와 같이 노드 opacity가
      // 아니라 paint 알파로 낮춘다(오너: 폰트는 100%). 색은 변수(흰색) 그대로 유지.
      const catText = T(ctx, cat, F_SM, V_BG)
      overlayAlpha(catText, OVERLAY_DESC_ALPHA)
      scrim.appendChild(catText)
      tile.appendChild(scrim)
      row.appendChild(tile)
    }
    grid.appendChild(row)
  }
  sec.appendChild(grid)

  const pg = vbox('pagination', 0)
  fill(pg)
  pg.paddingTop = 16
  pg.appendChild(pagination(ctx, ['1', '2'], 0))
  sec.appendChild(pg)

  siteFooter(ctx, s)
  return s
}

// ══ 4. 상품 — 쇼핑몰(ShopPage · ProductCard) ═════════════════════════
type Product = {
  brand: string
  name: string
  desc: string
  price: string
  original?: string // 있으면 취소선 원가
  soldOut?: boolean
  sale?: boolean
}
const PRODUCTS: Product[] = [
  {
    brand: 'Space Planning',
    name: '이탈리아 토분 3종 세트',
    desc: '통기성이 좋은 테라코타 토분 — 소·중·대 한 세트',
    price: '43,500원',
    original: '58,000원',
    sale: true,
  },
  { brand: '클레이랩', name: '무광 세라믹 화분 (중형)', desc: '어떤 식물에도 무난하게 어울리는 무광 마감', price: '34,000원' },
  {
    brand: '클레이랩',
    name: '스톤웨어 원형 화분',
    desc: '손으로 성형해 개체마다 표면 질감이 다릅니다',
    price: '46,000원',
    soldOut: true,
  },
  { brand: 'Space Planning', name: '자기 화분 받침 4P', desc: '물받이 겸용 — 실리콘 패드 포함', price: '18,000원' },
  { brand: '그린하우스', name: '몬스테라 델리시오사', desc: '초보자도 키우기 쉬운 대형 관엽식물', price: '42,000원' },
  {
    brand: '그린하우스',
    name: '홍콩야자 대형 화분',
    desc: '빛이 적은 실내에서도 잘 버티는 공기정화 식물',
    price: '54,400원',
    original: '68,000원',
    sale: true,
  },
  { brand: '그린하우스', name: '스투키 중형 화분', desc: '물을 자주 주지 않아도 되는 다육 식물', price: '29,000원' },
  { brand: '플랜트키트', name: '아레카야자 150cm', desc: '사무실 로비용 대형 식물 — 월 단위 렌탈 가능', price: '89,000원' },
  { brand: '소일랩', name: '실내식물 전용 배양토 5L', desc: '펄라이트와 코코피트를 배합한 배양토', price: '12,000원' },
  { brand: '소일랩', name: '자연석 조경 자갈 5kg', desc: '화분 마감재 · 테라리움용 천연 자연석', price: '24,000원' },
]

/**
 * 상품 카드 = DS/ProductCard 인스턴스(ratio=3x4). 브랜드·이름·설명·가격은 TEXT 속성으로 덮어쓰고,
 * 품절은 soldOut 축으로 켠다. 세일 취소선 원가는 세트에 없는 슬롯이라 가격 문자열에 합쳐 넣는다.
 */
function productCard(ctx: Ctx, p: Product): SceneNode {
  const node = inst(ctx, 'DS/ProductCard', {
    name: 'Product / ' + p.name,
    variant: { ratio: '3x4', soldOut: p.soldOut ? 'true' : 'false' },
    props: {
      brand: p.brand,
      name: p.name,
      description: p.desc,
      price: p.original ? `${p.original} → ${p.price}` : p.price,
    },
  })
  if (node) return instGrow(node)
  return drawProductCard(ctx, p)
}

/** 폴백 — 흰 카드 + 3:4 세로 상품컷 + 그린 가격. 품절은 흰 베일 + 배지(어두운 딤이 아니다). */
function drawProductCard(ctx: Ctx, p: Product): FrameNode {
  const c = card(ctx, p.name, 0)
  grow(c)
  c.clipsContent = true

  // 미디어 — 3:4 세로(카드 폭 ≈ 268 → 높이 358). 배경은 카드와 같은 흰 판(누끼 상품컷 규격).
  const media = vbox('Media', 0)
  fill(media)
  media.primaryAxisSizingMode = 'FIXED'
  media.resize(media.width, 358)
  pad(media, 10)
  fillV(ctx, media, V_BG)
  const badges = hbox('badges', 6)
  fill(badges)
  if (p.sale) badges.appendChild(badge(ctx, 'SALE', 'success'))
  if (p.soldOut) badges.appendChild(badge(ctx, '품절', 'secondary'))
  media.appendChild(badges)
  const ph = hbox('사진 자리', 0)
  fill(ph)
  grow(ph)
  ph.primaryAxisAlignItems = 'CENTER'
  ph.counterAxisAlignItems = 'CENTER'
  ph.appendChild(icon(ctx, '_Icon/Image', 56, V_SUB))
  media.appendChild(ph)
  c.appendChild(media)

  // 본문
  const body = vbox('Body', 4)
  fill(body)
  pad(body, 16)
  body.appendChild(T(ctx, p.brand, F_XS, V_SUB))
  body.appendChild(wrap(T(ctx, p.name, F_BODY, V_TEXT, true), 140))
  body.appendChild(wrap(T(ctx, p.desc, F_SM, V_SUB), 150))
  const price = hbox('price', 8)
  fill(price)
  price.counterAxisAlignItems = 'CENTER'
  price.paddingTop = 4
  if (p.original) {
    const old = T(ctx, p.original, F_SM, V_SUB)
    old.textDecoration = 'STRIKETHROUGH'
    price.appendChild(old)
  }
  price.appendChild(T(ctx, p.price, 20, V_ACCENT_TEXT, true)) // 흰 판 위 그린 가격 → --site-accent-text
  body.appendChild(price)
  c.appendChild(body)
  return c
}

/** 폴백 — DS/SortBar 세트가 없을 때의 정렬 바. */
function drawSortBar(ctx: Ctx): FrameNode {
  const sortBar = hbox('Sort Bar', 12)
  fill(sortBar)
  sortBar.counterAxisAlignItems = 'CENTER'
  sortBar.paddingTop = sortBar.paddingBottom = 4
  const total = hbox('total', 5)
  total.counterAxisAlignItems = 'CENTER'
  total.appendChild(T(ctx, '전체', F_TEXT, V_SUB))
  total.appendChild(T(ctx, '10개', F_TEXT, V_TEXT, true))
  sortBar.appendChild(grow(total))
  sortBar.appendChild(selectBox(ctx, '최신순', 150))
  sortBar.appendChild(selectBox(ctx, '서비스별', 150))
  return sortBar
}

function screenShop(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '상품')
  siteHeader(ctx, s, 3)

  // 정본(ShopPage.tsx): SiteSection padding="lg" · tone 기본(흰 면). 흰 면 위 흰 카드는 보더로 구분된다.
  const sec = siteSection(ctx, s, '상품 목록', { padY: PAD_LG, gap: 24 })
  sectionHead(ctx, sec, 'SHOP', '화분부터 식물, 흙까지 — 공간을 채우는 제품을 한자리에서.', { divider: false })

  // 카테고리 탭(활성 밑줄)
  sec.appendChild(underlineTabs(ctx, ['전체', '화분', '식물', '흙·용토'], 0))

  // 정렬 바 = DS/SortBar 인스턴스(개수만 TEXT 속성으로 갈아 끼운다).
  // total은 세트 기본이 '6개'다 — 이 화면은 상품을 10장 그리므로 반드시 덮어써야 한다.
  const sortInst = inst(ctx, 'DS/SortBar', {
    name: 'Sort Bar',
    props: { totalLabel: '전체', total: '10개' },
  })
  sec.appendChild(sortInst ? instFill(sortInst) : drawSortBar(ctx))

  // 상품 그리드 — 5열 × 2행
  const grid = vbox('grid', 24)
  fill(grid)
  for (let r = 0; r < 2; r++) {
    const row = hbox('row', 24)
    fill(row)
    row.counterAxisAlignItems = 'MIN'
    for (let c = 0; c < 5; c++) row.appendChild(productCard(ctx, PRODUCTS[r * 5 + c]))
    grid.appendChild(row)
  }
  sec.appendChild(grid)

  const pg = vbox('pagination', 0)
  fill(pg)
  pg.paddingTop = 24
  pg.appendChild(pagination(ctx, ['1', '2', '3', '…', '10'], 0))
  sec.appendChild(pg)

  siteFooter(ctx, s)
  return s
}

// ══ 5. 오시는길 + 문의(ContactPage) ══════════════════════════════════
/** 폴백 — DS/InfoCard 세트가 없을 때의 정보 카드. */
function drawInfoCard(ctx: Ctx, key: string, label: string, l1: string, l2: string): FrameNode {
  const c = card(ctx, label, 8)
  grow(c)
  pad(c, 20)
  const lb = hbox('label', 8)
  lb.counterAxisAlignItems = 'CENTER'
  lb.appendChild(icon(ctx, key, 16, V_ACCENT_TEXT))
  const lt = T(ctx, label, F_SM, V_ACCENT_TEXT, true) // 흰 판 위 13px 라벨 → --site-accent-text
  lt.letterSpacing = { unit: 'PERCENT', value: 2 }
  lb.appendChild(lt)
  c.appendChild(lb)
  const lines = vbox('lines', 4)
  fill(lines)
  lines.appendChild(wrap(T(ctx, l1, F_SM, V_TEXT), 160))
  lines.appendChild(wrap(T(ctx, l2, F_SM, V_SUB), 160))
  c.appendChild(lines)
  return c
}

function screenContact(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '오시는길')
  siteHeader(ctx, s, 4)

  // ── Location — 정본(ContactPage.tsx)은 tone="subtle": 옅은 회색 면 위의 흰 카드들 ──
  const loc = siteSection(ctx, s, '오시는 길', { tone: 'subtle', padY: PAD_MD, gap: 24 })
  sectionHead(ctx, loc, 'Location', '스페이스플래닝으로 오시는 길입니다.')

  // 지도 자리 — 외부 지도 API 없이 16:9 흰 판
  const map = card(ctx, '지도', 0)
  fill(map)
  map.primaryAxisSizingMode = 'FIXED'
  map.resize(MAX_XL, 810) // 16:9
  map.primaryAxisAlignItems = 'CENTER'
  map.counterAxisAlignItems = 'CENTER'
  map.itemSpacing = 12
  map.appendChild(icon(ctx, '_Icon/Map', 56, V_SUB))
  map.appendChild(T(ctx, '지도 준비 중', F_TEXT, V_SUB))
  loc.appendChild(map)

  // 정보 카드 4장(흰 카드) — 라벨은 강조색 bold
  const infoGrid = hbox('info', 16)
  fill(infoGrid)
  infoGrid.counterAxisAlignItems = 'MIN'
  const INFO: Array<[string, string, string, string]> = [
    ['_Icon/MapPin', 'Address', '서울특별시 성동구 아차산로 111', '성수 쇼룸 2층 (성수동2가)'],
    ['_Icon/Phone', 'Phone', '02-1234-5678', '평일 상담 · 부재 시 콜백'],
    ['_Icon/Envelope', 'Email', 'hello@spaceplanning.ai', '견적 문의는 24시간 접수'],
    ['_Icon/Clock', 'Hours', '평일 09:00 - 18:00', '점심 12:30 - 13:30 · 주말·공휴일 휴무'],
  ]
  // 정보 카드 4장 = DS/InfoCard 인스턴스. 라벨·2줄 텍스트는 TEXT 속성, 아이콘은 INSTANCE_SWAP.
  for (const [key, label, l1, l2] of INFO) {
    const node = inst(ctx, 'DS/InfoCard', {
      name: 'Info / ' + label,
      props: { Label: label, 'Line 1': l1, 'Line 2': l2 },
      swaps: { Icon: key },
    })
    infoGrid.appendChild(node ? instGrow(node) : drawInfoCard(ctx, key, label, l1, l2))
  }
  loc.appendChild(infoGrid)

  // ── Project Inquiry(흰 면) — 좌 헤드라인 / 우 폼 ──
  const inq = siteSection(ctx, s, '문의', { padY: PAD_LG, gap: 0 })
  const grid = hbox('grid', 48)
  fill(grid)
  grid.counterAxisAlignItems = 'MIN'

  // 좌 — 헤드라인 + 안내(정본은 5fr, 1440-48 기준 580)
  const aside = vbox('aside', 16)
  aside.counterAxisSizingMode = 'FIXED'
  aside.resize(580, 10)
  const asideTitle = vbox('title', 0)
  asideTitle.paddingBottom = 16
  bottomLine(ctx, asideTitle, V_ACCENT, 2) // 제목 아래 강조 룰(선이라 -500)
  const at = T(ctx, 'Project Inquiry', F_TITLE, V_TEXT, true)
  at.letterSpacing = { unit: 'PERCENT', value: -2 }
  asideTitle.appendChild(at)
  aside.appendChild(asideTitle)
  aside.appendChild(
    wrap(
      T(
        ctx,
        '프로젝트 규모와 일정, 예산을 남겨주시면 담당자가 영업일 기준 1~2일 안에 회신드립니다. 현장 사진이나 도면을 함께 보내주시면 더 정확한 안내가 가능합니다.',
        F_TEXT,
        V_SUB,
      ),
      170,
    ),
  )
  grid.appendChild(aside)

  // 우 — 폼(7fr → 812) = DS/InquiryForm 인스턴스. 필드·드롭존·동의·제출이 모두 세트 안에 있다.
  const formInst = inst(ctx, 'DS/InquiryForm', {
    name: 'Inquiry Form',
    props: { Submit: '문의 보내기', Consent: '개인정보 수집·이용에 동의합니다 (필수)' },
  })
  if (formInst) {
    // 세트 기본 폭 640 → 화면 그리드의 7fr(812). 실패해도 화면 전체가 죽지 않게 감싼다.
    try {
      formInst.resize(812, formInst.height)
    } catch {
      /* 폭 조정 실패 — 기본 폭으로 둔다 */
    }
    grid.appendChild(formInst)
    inq.appendChild(grid)
    siteFooter(ctx, s)
    return s
  }

  // 폴백 — 세트가 없을 때만 폼을 직접 그린다.
  const form = vbox('form', 20)
  form.counterAxisSizingMode = 'FIXED'
  form.resize(812, 10)

  const row1 = hbox('row', 16)
  fill(row1)
  row1.appendChild(grow(field(ctx, '이름', '홍길동', { required: true })))
  row1.appendChild(grow(field(ctx, '이메일', 'you@example.com', { required: true })))
  form.appendChild(row1)

  const row2 = hbox('row', 16)
  fill(row2)
  row2.appendChild(grow(field(ctx, '연락처', '010-1234-5678', { required: true })))
  row2.appendChild(grow(field(ctx, '문의 유형', '유형을 선택하세요', { required: true, select: true })))
  form.appendChild(row2)

  form.appendChild(field(ctx, '제목', '문의 제목을 입력해주세요', { required: true }))

  // 내용 — 여러 줄 + 글자수 카운터
  const content = vbox('Field / 내용', 8)
  fill(content)
  const clb = hbox('Label', 3)
  clb.counterAxisAlignItems = 'CENTER'
  clb.appendChild(T(ctx, '내용', F_SM, V_TEXT, true))
  clb.appendChild(T(ctx, '*', F_SM, V_ERROR, true))
  content.appendChild(clb)
  const ta = vbox('Textarea', 0)
  fill(ta)
  ta.primaryAxisSizingMode = 'FIXED'
  ta.resize(ta.width, 150)
  pad(ta, 14)
  ta.cornerRadius = R_CTRL
  fillV(ctx, ta, V_BG)
  strokeV(ctx, ta, V_BORDER)
  ta.strokeWeight = 1
  ta.strokeAlign = 'INSIDE'
  ta.appendChild(wrap(T(ctx, '프로젝트 개요, 희망 일정, 예산 범위를 적어주시면 상담이 빨라집니다.', F_TEXT, V_SUB), 160))
  content.appendChild(ta)
  const counter = hbox('counter', 0)
  fill(counter)
  counter.primaryAxisAlignItems = 'MAX'
  counter.appendChild(T(ctx, '0 / 2,000', F_XS, V_SUB))
  content.appendChild(counter)
  form.appendChild(content)

  // 파일 첨부 — 드롭존(점선 + 옅은 회색 면)
  const files = vbox('Files', 8)
  fill(files)
  files.appendChild(T(ctx, '파일 첨부', F_SM, V_TEXT, true))
  const zone = vbox('DropZone', 6)
  fill(zone)
  zone.primaryAxisSizingMode = 'FIXED'
  zone.resize(zone.width, 130)
  zone.primaryAxisAlignItems = 'CENTER'
  zone.counterAxisAlignItems = 'CENTER'
  pad(zone, 20)
  zone.cornerRadius = R_CTRL
  fillV(ctx, zone, V_SUBTLE)
  strokeV(ctx, zone, V_BORDER)
  zone.strokeWeight = 1
  zone.strokeAlign = 'INSIDE'
  zone.dashPattern = [6, 4]
  zone.appendChild(icon(ctx, '_Icon/Upload', 22, V_SUB))
  zone.appendChild(T(ctx, '클릭하거나 파일을 끌어다 놓으세요', F_TEXT, V_TEXT))
  zone.appendChild(T(ctx, '현장 사진이나 도면이 있다면 첨부해주세요 (최대 20MB)', F_XS, V_SUB))
  files.appendChild(zone)
  form.appendChild(files)

  // 개인정보 동의
  const consent = vbox('Consent', 8)
  fill(consent)
  consent.appendChild(checkbox(ctx, '개인정보 수집·이용에 동의합니다 (필수)', true))
  consent.appendChild(
    wrap(
      T(
        ctx,
        '수집 항목: 이름·이메일·연락처 · 보유 기간: 문의 처리 후 3년 · 동의해야 문의를 접수할 수 있습니다.',
        F_XS,
        V_SUB,
      ),
      160,
    ),
  )
  form.appendChild(consent)

  // 전폭 제출 버튼
  const submit = btn(ctx, '문의 보내기', 'accent', 52)
  fill(submit)
  submit.primaryAxisAlignItems = 'CENTER'
  form.appendChild(submit)

  grid.appendChild(form)
  inq.appendChild(grid)

  siteFooter(ctx, s)
  return s
}

// ── 생성 ─────────────────────────────────────────────────────────────
const SITE_SCREEN_BUILDERS: Array<[string, (ctx: Ctx) => FrameNode]> = [
  ['회사 소개', screenAbout],
  ['연혁', screenHistory],
  ['포트폴리오', screenPortfolio],
  ['상품', screenShop],
  ['오시는길', screenContact],
]

/** 프론트 화면 5종을 1920 폭 프레임으로 생성한다(세로 나열, 간격 120). */
export async function generateSiteScreens(
  fontFamily: string,
  colors?: Record<string, string>,
  preset?: PresetName,
): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  warnedMissing.clear() // 실행마다 세트 누락 경고를 새로 낸다
  if (!ctx.vars.get('color/success')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(화면 색이 프리셋과 연결되지 않습니다).")
  }
  // 세트가 없으면 파일에 이미 있는 PAGE_SITE 페이지에서 입양해 본다(SortBar·InfoCard는 그 안에서
  // Admin Component 페이지까지 함께 확인한다 — adoptSiteSets 참고).
  // 그것도 없으면 5화면 전부 직접 그리기 — 그 상태에서는 컴포넌트를 고쳐도 화면이 안 바뀐다.
  if (SITE_SETS.size === 0) {
    const adopted = adoptSiteSets()
    if (adopted > 0) {
      ctx.warnings.push(`'${PAGE_SITE}'의 기존 컴포넌트 세트 ${adopted}개로 화면을 조립합니다.`)
    } else {
      ctx.warnings.push(
        `'${PAGE_SITE}' 컴포넌트 세트가 없습니다 — 화면을 직접 그립니다. ` +
          "'프론트 컴포넌트' 스코프를 함께 켜면 화면이 컴포넌트 인스턴스로 조립됩니다.",
      )
    }
  }
  if (!ctx.vars.get(V_SOLID) || !ctx.vars.get(V_ON)) {
    ctx.warnings.push('color/solid-* · color/on-* 변수가 없어 solid 버튼 색이 리터럴로 들어갑니다 — 토큰을 먼저 생성하세요.')
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push('Icon System 페이지가 없어 화면 아이콘이 인라인 폴백됩니다 — 함께 생성하는 것을 권장합니다.')
  }

  // 오너 확정(2026-07 개편): 화면은 더 이상 19번 페이지를 만들지 않고, site.ts가 만든(또는 이미 있는)
  // PAGE_SITE('18. System - Client Pages')에 이어 그린다. 그 페이지조차 없으면(예: '프론트 컴포넌트'도
  // 이번이 처음) 여기서 새로 만든다.
  let page = figma.root.children.find((p) => p.name === PAGE_SITE)
  const firstScreenName = 'Screen/' + SITE_SCREEN_BUILDERS[0][0]
  if (page && page.children.some((n) => n.name === firstScreenName)) {
    ctx.warnings.push(`'${PAGE_SITE}'에 프론트 화면이 이미 있습니다 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
    return ctx.warnings
  }
  if (!page) {
    page = figma.createPage()
    page.name = PAGE_SITE
    applyPageColorMode(ctx, page)
  }

  // 이미 있는 컴포넌트 세트 문서(오토레이아웃 root)·세트 컬럼 아래로 이어 그린다 — 겹치지 않게.
  let y = maxBottom(page) + (page.children.length ? SCREEN_GAP : 0)
  for (const [name, build] of SITE_SCREEN_BUILDERS) {
    try {
      const frame = build(ctx)
      page.appendChild(frame)
      frame.x = 0
      frame.y = y
      // 인스턴스 내부는 건너뛴다 — 세트(18. Site)에서 이미 바인딩됐다(위 주석 참고).
      bindTokens(ctx, frame, { skipInstances: true }) // 보더·패딩·간격·라운드·불투명도 변수 바인딩(화면당 1회)
      y += frame.height + SCREEN_GAP
    } catch (e) {
      ctx.warnings.push(`Screen/${name} 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return ctx.warnings
}
