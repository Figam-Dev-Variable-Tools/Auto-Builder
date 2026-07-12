// 파운데이션 페이지 — 오너 "페이지 생성 규칙":
//   1) Design System : 컬러·배경·그라데이션·폰트색 / (선택 폰트)타이포·크기 / 패딩·마진·크기 / 보더
//   2) Icon System   : 스토리북 아이콘 전체(라인아트)
// TDS 문서 스타일(docs/spec/figma-tds-doc-style.md) + 겹침 방지 오토레이아웃(docs/spec/figma-category-layout.md).
import { hexToRgb } from '../presets'
import { ICON_PATHS } from '../icons-data'
import { strokeIcon } from './icon-vec'

// 오너 규칙: 생성되는 모든 페이지는 "순번. System - 이름". 페이지 탭에는 순번명, 내부 헤더엔 깔끔한 제목.
const PAGE_DS = '1. System - Design System'
const PAGE_ICON = '2. System - Icon System'
// 새 이름 + 정리용 레거시 이름(reset이 함께 삭제).
export const FOUNDATION_PAGE_NAMES = [PAGE_DS, PAGE_ICON, 'Design System', 'Icon System']

// TDS 문서 크롬 색(장식용 — 프리셋 재색 대상 아님)
const INK = '#191F28'
const SUB = '#4E5968'
const MUTED = '#8B95A1'
const BORDER = '#E5E8EB'
const SURFACE = '#F5F7FA'
const ACCENT = '#3D6BFF'
const WHITE = '#FFFFFF'

type Ctx = {
  font: FontName
  fontBold: FontName
  vars: Map<string, Variable>
  warnings: string[]
}

const solid = (hex: string): SolidPaint => ({ type: 'SOLID', color: hexToRgb(hex) })

function boundPaint(v: Variable): SolidPaint {
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)
}

/** 변수 있으면 바인딩(프리셋 재색), 없으면 리터럴 hex. */
function fillColor(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(hex)]
}
function strokeColor(ctx: Ctx, node: MinimalStrokesMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(hex)]
}

function autoFrame(name: string, dir: 'HORIZONTAL' | 'VERTICAL'): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'AUTO'
  f.counterAxisSizingMode = 'AUTO'
  f.fills = []
  return f
}

function txt(ctx: Ctx, chars: string, size: number, hex: string, bold = false): TextNode {
  const t = figma.createText()
  t.fontName = bold ? ctx.fontBold : ctx.font
  t.characters = chars
  t.fontSize = size
  t.fills = [solid(hex)]
  t.textAutoResize = 'WIDTH_AND_HEIGHT'
  return t
}
/** 폭 제한 래핑 텍스트. */
function txtWrap(ctx: Ctx, chars: string, size: number, hex: string, maxW: number, bold = false): TextNode {
  const t = txt(ctx, chars, size, hex, bold)
  t.textAutoResize = 'HEIGHT'
  t.resize(maxW, t.height)
  return t
}

// ── 페이지 루트 + 헤더 + 문서 섹션 (레이아웃 스펙 §3) ──────────────────
function makeRoot(name: string): FrameNode {
  const root = figma.createFrame()
  root.name = name
  root.layoutMode = 'VERTICAL'
  root.counterAxisSizingMode = 'FIXED'
  root.resize(1240, root.height)
  root.primaryAxisSizingMode = 'AUTO'
  root.counterAxisAlignItems = 'MIN'
  root.itemSpacing = 56
  root.paddingTop = root.paddingRight = root.paddingBottom = root.paddingLeft = 80
  root.fills = [solid(SURFACE)]
  return root
}

function makeHeader(ctx: Ctx, root: FrameNode, title: string, subtitle: string) {
  const header = autoFrame('Page Header', 'VERTICAL')
  header.layoutAlign = 'STRETCH'
  header.itemSpacing = 12
  root.appendChild(header)

  header.appendChild(txt(ctx, title, 40, INK, true))
  // 강조 밑줄(TDS 시그니처)
  const underline = figma.createRectangle()
  underline.resize(44, 3)
  underline.cornerRadius = 999
  underline.fills = [solid(ACCENT)]
  underline.layoutAlign = 'INHERIT'
  header.appendChild(underline)
  header.appendChild(txtWrap(ctx, subtitle, 18, SUB, 720))
}

/** 문서 섹션(eyebrow·name·desc·meta·render container) 생성. render 컨테이너 반환. */
function makeSection(
  ctx: Ctx,
  root: FrameNode,
  opts: { eyebrow: string; name: string; desc: string; meta?: string[]; renderDir: 'WRAP' | 'VERTICAL' },
): FrameNode {
  const section = autoFrame('Doc / ' + opts.name, 'VERTICAL')
  section.layoutAlign = 'STRETCH'
  section.itemSpacing = 16
  root.appendChild(section)

  const head = autoFrame('Doc Head', 'VERTICAL')
  head.layoutAlign = 'STRETCH'
  head.itemSpacing = 8
  section.appendChild(head)

  // eyebrow pill
  const eyebrowRow = autoFrame('Eyebrow Row', 'HORIZONTAL')
  eyebrowRow.counterAxisAlignItems = 'CENTER'
  eyebrowRow.itemSpacing = 8
  head.appendChild(eyebrowRow)
  const tag = autoFrame('Eyebrow Tag', 'HORIZONTAL')
  tag.counterAxisAlignItems = 'CENTER'
  tag.paddingTop = tag.paddingBottom = 4
  tag.paddingLeft = tag.paddingRight = 8
  tag.cornerRadius = 6
  tag.fills = [solid('#EDF2FF')]
  tag.appendChild(txt(ctx, opts.eyebrow, 12, ACCENT, true))
  eyebrowRow.appendChild(tag)

  head.appendChild(txt(ctx, opts.name, 28, INK, true))
  head.appendChild(txtWrap(ctx, opts.desc, 16, SUB, 640))

  if (opts.meta && opts.meta.length) {
    const meta = autoFrame('Meta Row', 'HORIZONTAL')
    meta.counterAxisAlignItems = 'CENTER'
    meta.itemSpacing = 8
    head.appendChild(meta)
    opts.meta.forEach((m, i) => {
      if (i > 0) {
        const dot = figma.createEllipse()
        dot.resize(3, 3)
        dot.fills = [solid('#C5CCD3')]
        meta.appendChild(dot)
      }
      meta.appendChild(txt(ctx, m, 13, MUTED))
    })
  }

  // render container
  const render = figma.createFrame()
  render.name = 'render'
  render.layoutMode = opts.renderDir === 'WRAP' ? 'HORIZONTAL' : 'VERTICAL'
  if (opts.renderDir === 'WRAP') {
    render.layoutWrap = 'WRAP'
    render.primaryAxisSizingMode = 'FIXED'
    render.counterAxisSizingMode = 'AUTO'
    render.counterAxisSpacing = 24
  } else {
    render.primaryAxisSizingMode = 'AUTO'
    render.counterAxisSizingMode = 'FIXED'
  }
  render.layoutAlign = 'STRETCH'
  render.primaryAxisAlignItems = 'MIN'
  render.counterAxisAlignItems = 'MIN'
  render.itemSpacing = opts.renderDir === 'WRAP' ? 24 : 20
  render.paddingTop = render.paddingRight = render.paddingBottom = render.paddingLeft = 24
  render.cornerRadius = 12
  render.fills = [solid(WHITE)]
  render.strokes = [solid(BORDER)]
  render.strokeWeight = 1
  render.strokeAlign = 'INSIDE'
  section.appendChild(render)
  return render
}

// ── 개별 샘플 아이템 ──────────────────────────────────────────────────
function swatchItem(ctx: Ctx, roleKR: string, varName: string, hex: string): FrameNode {
  const item = autoFrame('swatch / ' + roleKR, 'VERTICAL')
  item.itemSpacing = 8
  const chip = figma.createFrame()
  chip.name = 'chip'
  chip.resize(132, 72)
  chip.cornerRadius = 10
  fillColor(ctx, chip, varName, hex)
  chip.strokes = [solid(BORDER)]
  chip.strokeWeight = 1
  chip.strokeAlign = 'INSIDE'
  item.appendChild(chip)
  const label = autoFrame('label', 'VERTICAL')
  label.itemSpacing = 2
  label.appendChild(txt(ctx, roleKR, 13, INK, true))
  label.appendChild(txt(ctx, `${varName.replace('color/', '--ds-color-')}`, 11, MUTED))
  label.appendChild(txt(ctx, hex.toUpperCase(), 11, SUB))
  item.appendChild(label)
  return item
}

function typeRow(ctx: Ctx, roleKR: string, sizeVarName: string, px: number): FrameNode {
  const item = autoFrame('type / ' + roleKR, 'VERTICAL')
  item.itemSpacing = 4
  item.layoutAlign = 'STRETCH'
  const sample = txt(ctx, '다람쥐 헌 쳇바퀴에 타고파 · Aa Bb Gg 0123', px >= 23 ? px : px, INK, px >= 23)
  const v = ctx.vars.get(sizeVarName)
  if (v) sample.setBoundVariable('fontSize', v)
  item.appendChild(sample)
  item.appendChild(txt(ctx, `${roleKR} · ${sizeVarName.replace('font/size/', 'font-size-')} · ${px}px`, 12, MUTED))
  return item
}

function spacingBar(ctx: Ctx, name: string, px: number): FrameNode {
  const item = autoFrame('space / ' + name, 'VERTICAL')
  item.itemSpacing = 8
  const bar = figma.createFrame()
  bar.name = 'bar'
  bar.resize(Math.max(px, 4), 16)
  bar.cornerRadius = 3
  fillColor(ctx, bar, 'color/primary', ACCENT)
  item.appendChild(bar)
  const cap = autoFrame('cap', 'VERTICAL')
  cap.itemSpacing = 2
  cap.appendChild(txt(ctx, name, 13, INK, true))
  cap.appendChild(txt(ctx, `${px}px`, 11, MUTED))
  item.appendChild(cap)
  return item
}

function radiusItem(ctx: Ctx, name: string, r: number): FrameNode {
  const item = autoFrame('radius / ' + name, 'VERTICAL')
  item.itemSpacing = 8
  const box = figma.createFrame()
  box.name = 'box'
  box.resize(96, 72)
  box.cornerRadius = r
  box.fills = [solid(WHITE)]
  strokeColor(ctx, box, 'color/border', BORDER)
  box.strokeWeight = 1
  box.strokeAlign = 'INSIDE'
  item.appendChild(box)
  const cap = autoFrame('cap', 'VERTICAL')
  cap.itemSpacing = 2
  cap.appendChild(txt(ctx, name, 13, INK, true))
  cap.appendChild(txt(ctx, `${r}px`, 11, MUTED))
  item.appendChild(cap)
  return item
}

function iconItem(ctx: Ctx, fullKey: string): FrameNode {
  const name = fullKey.replace('_Icon/', '')
  const item = autoFrame('icon / ' + name, 'VERTICAL')
  item.counterAxisAlignItems = 'CENTER'
  item.itemSpacing = 8
  item.paddingTop = item.paddingBottom = 16
  item.paddingLeft = item.paddingRight = 8
  item.counterAxisSizingMode = 'FIXED' // 폭 고정 먼저, 그다음 resize
  item.resize(112, item.height)
  // 아이콘 자리(48px)를 일정하게 — stroke 아이콘을 감싸는 고정 박스
  const box = figma.createFrame()
  box.name = 'box'
  box.layoutMode = 'HORIZONTAL'
  box.primaryAxisAlignItems = 'CENTER'
  box.counterAxisAlignItems = 'CENTER'
  box.primaryAxisSizingMode = 'FIXED'
  box.counterAxisSizingMode = 'FIXED'
  box.resize(48, 48)
  box.fills = []
  const tv = ctx.vars.get('color/text')
  const ic = strokeIcon(fullKey, 28, tv ? boundPaint(tv) : solid(INK))
  if (ic) box.appendChild(ic)
  item.appendChild(box)
  item.appendChild(txt(ctx, name, 11, SUB))
  return item
}

// ── 폰트/변수 셋업 ────────────────────────────────────────────────────
async function setup(fontFamily: string): Promise<Ctx> {
  const warnings: string[] = []
  const all = await figma.variables.getLocalVariablesAsync()
  const vars = new Map(all.map((v) => [v.name, v]))

  let family = firstFamily(fontFamily)
  try {
    await figma.loadFontAsync({ family, style: 'Regular' })
    await figma.loadFontAsync({ family, style: 'Bold' })
  } catch {
    warnings.push(`폰트 '${family}' 로드 실패 — Inter로 폴백(문서 텍스트).`)
    family = 'Inter'
    await figma.loadFontAsync({ family, style: 'Regular' })
    await figma.loadFontAsync({ family, style: 'Bold' })
  }
  return { font: { family, style: 'Regular' }, fontBold: { family, style: 'Bold' }, vars, warnings }
}

function firstFamily(fontFamily: string): string {
  const first = (fontFamily || 'Inter').split(',')[0].trim()
  return first.replace(/^['"]|['"]$/g, '')
}

function placeRoot(root: FrameNode, page: PageNode) {
  page.appendChild(root)
  root.x = 0
  root.y = 0
}

// ── 1) Design System 페이지 ──────────────────────────────────────────
export async function generateDesignSystemPage(fontFamily: string): Promise<string[]> {
  const ctx = await setup(fontFamily)
  if (figma.root.children.some((p) => p.name === PAGE_DS)) {
    ctx.warnings.push(`페이지 '${PAGE_DS}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
    return ctx.warnings
  }
  const page = figma.createPage()
  page.name = PAGE_DS
  const root = makeRoot('Design System')
  placeRoot(root, page)

  makeHeader(
    ctx,
    root,
    'Design System',
    '선택한 프리셋·폰트가 만드는 토큰의 단일 출처. 컬러·타이포·간격·보더가 실제 Variables/스타일과 연결됩니다.',
  )

  // 1. 컬러
  const colors: Array<[string, string, string]> = [
    ['메인', 'color/primary', ACCENT],
    ['서브', 'color/secondary', SUB],
    ['에러', 'color/error', '#F04452'],
    ['성공', 'color/success', '#00C471'],
    ['경고', 'color/warning', '#FF9F0A'],
    ['배경', 'color/bg', WHITE],
    ['옅은 배경', 'color/bgSubtle', SURFACE],
    ['텍스트', 'color/text', INK],
    ['보더', 'color/border', BORDER],
  ]
  const cSec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · COLOR',
    name: '컬러',
    desc: '의미 색 9종. 각 스와치는 color/* Variable에 바인딩되어 프리셋을 바꾸면 함께 바뀝니다.',
    meta: ['Tokens: 9', 'Bound: color/*'],
    renderDir: 'WRAP',
  })
  colors.forEach(([kr, v, hex]) => cSec.appendChild(swatchItem(ctx, kr, v, hex)))

  // 2. 배경 · 그라데이션 · 폰트색
  const bgSec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · SURFACE',
    name: '배경 · 그라데이션 · 폰트색',
    desc: '표면 색과 그라데이션, 배경 위 폰트 색 대비를 정의합니다.',
    renderDir: 'WRAP',
  })
  bgSec.appendChild(surfaceItem(ctx, '기본 배경', 'color/bg', WHITE))
  bgSec.appendChild(surfaceItem(ctx, '옅은 배경', 'color/bgSubtle', SURFACE))
  bgSec.appendChild(gradientItem(ctx, '메인 그라데이션'))
  bgSec.appendChild(fontColorItem(ctx, '폰트색 · 본문', 'color/text', INK))
  bgSec.appendChild(fontColorItem(ctx, '폰트색 · 보조', 'color/secondary', SUB))

  // 3. 타이포그래피 (선택 폰트)
  const tSec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · TYPOGRAPHY',
    name: '타이포그래피',
    desc: `선택 폰트 '${ctx.font.family}' 기준 크기 램프. 각 크기는 font/size/* Variable 값입니다.`,
    meta: [`Font: ${ctx.font.family}`, 'Scale: 6단'],
    renderDir: 'VERTICAL',
  })
  ;([
    ['Display', 'font/size/xxl', 28],
    ['Title', 'font/size/xl', 23],
    ['Heading', 'font/size/lg', 19],
    ['Body', 'font/size/md', 16],
    ['Caption', 'font/size/sm', 13],
    ['Small', 'font/size/xs', 11],
  ] as Array<[string, string, number]>).forEach(([n, v, px]) => tSec.appendChild(typeRow(ctx, n, v, px)))

  // 4. 간격 · 크기
  const sSec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · SPACING',
    name: '간격 · 패딩 · 크기',
    desc: '패딩·마진·요소 간격에 쓰는 간격 스케일(spacing/1..6).',
    meta: ['Steps: 6', '4 · 8 · 12 · 16 · 20 · 24'],
    renderDir: 'WRAP',
  })
  ;([
    ['spacing-1', 4],
    ['spacing-2', 8],
    ['spacing-3', 12],
    ['spacing-4', 16],
    ['spacing-5', 20],
    ['spacing-6', 24],
  ] as Array<[string, number]>).forEach(([n, px]) => sSec.appendChild(spacingBar(ctx, n, px)))

  // 5. 보더 · 외곽선 · 라운드
  const rSec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · BORDER',
    name: '보더 · 외곽선 · 라운드',
    desc: '테두리 색·두께와 모서리 반경(radius sm/md/lg).',
    meta: ['Radius: 4 · 8 · 12', 'Border: 1px #E5E8EB'],
    renderDir: 'WRAP',
  })
  ;([
    ['radius-sm', 4],
    ['radius-md', 8],
    ['radius-lg', 12],
  ] as Array<[string, number]>).forEach(([n, r]) => rSec.appendChild(radiusItem(ctx, n, r)))
  rSec.appendChild(borderWeightItem(ctx, '1px', 1))
  rSec.appendChild(borderWeightItem(ctx, '2px', 2))

  return ctx.warnings
}

function surfaceItem(ctx: Ctx, kr: string, varName: string, hex: string): FrameNode {
  const item = autoFrame('surface / ' + kr, 'VERTICAL')
  item.itemSpacing = 8
  const box = figma.createFrame()
  box.name = 'box'
  box.resize(200, 96)
  box.cornerRadius = 12
  fillColor(ctx, box, varName, hex)
  strokeColor(ctx, box, 'color/border', BORDER)
  box.strokeWeight = 1
  box.strokeAlign = 'INSIDE'
  item.appendChild(box)
  item.appendChild(txt(ctx, `${kr} · ${hex.toUpperCase()}`, 12, SUB))
  return item
}

function gradientItem(ctx: Ctx, kr: string): FrameNode {
  const item = autoFrame('gradient / ' + kr, 'VERTICAL')
  item.itemSpacing = 8
  const box = figma.createRectangle()
  box.resize(200, 96)
  box.cornerRadius = 12
  const c = hexToRgb(ACCENT)
  box.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      gradientStops: [
        { position: 0, color: { r: c.r, g: c.g, b: c.b, a: 1 } },
        { position: 1, color: { r: c.r, g: c.g, b: c.b, a: 0 } },
      ],
    },
  ]
  item.appendChild(box)
  item.appendChild(txt(ctx, `${kr} · primary → 투명`, 12, SUB))
  return item
}

function fontColorItem(ctx: Ctx, kr: string, varName: string, hex: string): FrameNode {
  const item = autoFrame('fontcolor / ' + kr, 'VERTICAL')
  item.itemSpacing = 8
  const box = figma.createFrame()
  box.name = 'box'
  box.layoutMode = 'HORIZONTAL'
  box.primaryAxisAlignItems = 'CENTER'
  box.counterAxisAlignItems = 'CENTER'
  box.primaryAxisSizingMode = 'FIXED'
  box.counterAxisSizingMode = 'FIXED'
  box.resize(200, 96)
  box.cornerRadius = 12
  box.fills = [solid(WHITE)]
  strokeColor(ctx, box, 'color/border', BORDER)
  box.strokeWeight = 1
  box.strokeAlign = 'INSIDE'
  const sample = txt(ctx, '가나다 Aa', 24, hex, true)
  const v = ctx.vars.get(varName)
  if (v) sample.fills = [boundPaint(v)]
  box.appendChild(sample)
  item.appendChild(box)
  item.appendChild(txt(ctx, `${kr} · ${hex.toUpperCase()}`, 12, SUB))
  return item
}

function borderWeightItem(ctx: Ctx, kr: string, w: number): FrameNode {
  const item = autoFrame('border / ' + kr, 'VERTICAL')
  item.itemSpacing = 8
  const box = figma.createFrame()
  box.name = 'box'
  box.resize(96, 72)
  box.cornerRadius = 8
  box.fills = [solid(WHITE)]
  strokeColor(ctx, box, 'color/border', BORDER)
  box.strokeWeight = w
  box.strokeAlign = 'INSIDE'
  item.appendChild(box)
  const cap = autoFrame('cap', 'VERTICAL')
  cap.itemSpacing = 2
  cap.appendChild(txt(ctx, `보더 ${kr}`, 13, INK, true))
  cap.appendChild(txt(ctx, '#E5E8EB', 11, MUTED))
  item.appendChild(cap)
  return item
}

// ── 2) Icon System 페이지 ────────────────────────────────────────────
export async function generateIconSystemPage(fontFamily: string): Promise<string[]> {
  const ctx = await setup(fontFamily)
  if (figma.root.children.some((p) => p.name === PAGE_ICON)) {
    ctx.warnings.push(`페이지 '${PAGE_ICON}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
    return ctx.warnings
  }
  const page = figma.createPage()
  page.name = PAGE_ICON
  const root = makeRoot('Icon System')
  placeRoot(root, page)

  const keys = Object.keys(ICON_PATHS)
  makeHeader(
    ctx,
    root,
    'Icon System',
    `스토리북 아이콘 세트 · 라인아트(아웃라인) · ${keys.length}개. currentColor 기반이라 어떤 색에도 얹힙니다.`,
  )

  const sec = makeSection(ctx, root, {
    eyebrow: 'FOUNDATION · ICON',
    name: '아이콘',
    desc: '라인아트 아이콘 전체. 각 아이콘은 24px 그리드 벡터이며 텍스트 색(color/text)에 맞춰 표시됩니다.',
    meta: [`Icons: ${keys.length}`, 'Style: Line', 'Grid: 24'],
    renderDir: 'WRAP',
  })
  keys.forEach((key) => sec.appendChild(iconItem(ctx, key)))

  return ctx.warnings
}

export async function generateFoundations(opts: {
  fontFamily: string
  designSystem: boolean
  icons: boolean
}): Promise<string[]> {
  const warnings: string[] = []
  if (opts.designSystem) warnings.push(...(await generateDesignSystemPage(opts.fontFamily)))
  if (opts.icons) warnings.push(...(await generateIconSystemPage(opts.fontFamily)))
  return warnings
}

// 카테고리 문서 페이지(categories.ts)가 재사용하는 문서 크롬/헬퍼.
export type { Ctx }
export {
  solid,
  boundPaint,
  fillColor,
  strokeColor,
  autoFrame,
  txt,
  txtWrap,
  makeRoot,
  makeHeader,
  makeSection,
  setup,
  placeRoot,
  INK,
  SUB,
  MUTED,
  BORDER,
  SURFACE,
  ACCENT,
  WHITE,
}
