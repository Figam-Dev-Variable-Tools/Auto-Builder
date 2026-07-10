// P3 — DS 컴포넌트 생성 (Variants·Text·Boolean·Instance Swap·Slot)
// 생성기는 "매니페스트 주도"로 설계한다: 내장 COMPONENT_MANIFEST(D1 props와 문자열까지 동일)
// 또는 원격 URL로 받은 동일 스키마 매니페스트를 입력으로 같은 생성 로직을 실행한다.
import { firstFontFamily, hexToRgb, type PresetName, PRESETS } from '../presets'

export type VariantAxis = { name: string; values: string[] }
export type TextProp = { name: string; default: string }
export type BooleanProp = { name: string; default: boolean }
export type SwapProp = { name: string; default: string; preferred: string[] }

export type ComponentSpec = {
  name: string
  kind: 'button' | 'textfield' | 'card' | 'alert' | 'badge'
  variants: VariantAxis[]
  text: TextProp[]
  booleans: BooleanProp[]
  swaps: SwapProp[]
  slot?: { name: string }
}

export type ComponentManifest = {
  components: ComponentSpec[]
  social: { name: string; providers: string[]; sizes: string[] }
  chart: { name: string; types: string[] }
}

// ── 내장 매니페스트 — D1~D3 props와 1:1 (§3 매핑 규약, verify-mapping.mjs 대조 대상) ──
export const COMPONENT_MANIFEST: ComponentManifest = {
  components: [
    {
      name: 'DS/Button',
      kind: 'button',
      variants: [
        { name: 'variant', values: ['primary', 'secondary', 'error', 'success'] },
        { name: 'size', values: ['sm', 'md', 'lg'] },
        { name: 'disabled', values: ['false', 'true'] },
      ],
      text: [{ name: 'label', default: 'Button' }],
      booleans: [{ name: 'showIcon', default: false }],
      swaps: [{ name: 'icon', default: '_Icon/Star', preferred: ['_Icon/Star', '_Icon/Heart', '_Icon/Bell'] }],
    },
    {
      name: 'DS/TextField',
      kind: 'textfield',
      variants: [
        { name: 'error', values: ['false', 'true'] },
        { name: 'disabled', values: ['false', 'true'] },
      ],
      text: [
        { name: 'label', default: 'Email' },
        { name: 'placeholder', default: 'name@example.com' },
        { name: 'description', default: '업무용 이메일을 입력하세요.' },
      ],
      booleans: [{ name: 'showDescription', default: false }],
      swaps: [],
    },
    {
      name: 'DS/Card',
      kind: 'card',
      variants: [],
      text: [{ name: 'title', default: 'Card title' }],
      booleans: [{ name: 'showFooter', default: false }],
      swaps: [],
      slot: { name: 'content' },
    },
    {
      name: 'DS/Alert',
      kind: 'alert',
      variants: [{ name: 'variant', values: ['error', 'success'] }],
      text: [{ name: 'label', default: 'This is a warning message.' }],
      booleans: [{ name: 'showIcon', default: false }],
      swaps: [],
    },
    {
      name: 'DS/Badge',
      kind: 'badge',
      variants: [
        { name: 'variant', values: ['primary', 'secondary', 'error', 'success'] },
        { name: 'size', values: ['sm', 'md'] },
      ],
      text: [{ name: 'label', default: 'Badge' }],
      booleans: [],
      swaps: [],
    },
  ],
  social: {
    name: 'DS/SocialLoginButton',
    providers: ['kakao', 'google', 'facebook', 'naver'],
    sizes: ['md', 'lg'],
  },
  chart: { name: 'DS/Chart', types: ['line', 'bar', 'doughnut'] },
}

// 부록 E 고정값 (브랜드 컬러는 Variables 미사용 — §0-14)
const SOCIAL_BRAND: Record<string, { bg: string; label: string; border?: string; text: string }> = {
  kakao: { bg: '#FEE500', label: '#191919', text: '카카오 로그인' },
  google: { bg: '#FFFFFF', label: '#1F1F1F', border: '#747775', text: 'Google로 로그인' },
  facebook: { bg: '#1877F2', label: '#FFFFFF', text: 'Facebook으로 로그인' },
  naver: { bg: '#03C75A', label: '#FFFFFF', text: '네이버 로그인' },
}

const CHART_SAMPLE = {
  revenue: [12, 19, 8, 15, 22, 17],
  traffic: [30, 25, 40, 35, 50, 45],
  share: [45, 25, 20, 10],
}

export type GenerateComponentsOptions = {
  preset: PresetName
  social: string[]
  charts: boolean
  manifest?: ComponentManifest
}

type Ctx = {
  vars: Map<string, Variable>
  font: FontName
  fontBold: FontName
  warnings: string[]
  page: PageNode
  iconComponents: Map<string, ComponentNode>
  slotComponent: ComponentNode | null
  buttonSet: ComponentSetNode | null
}

const solid = (hex: string): SolidPaint => ({ type: 'SOLID', color: hexToRgb(hex) })

function boundPaint(v: Variable): SolidPaint {
  return figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    'color',
    v,
  )
}

function bindFill(node: GeometryMixin, v: Variable) {
  node.fills = [boundPaint(v)]
}

function bindStroke(node: MinimalStrokesMixin, v: Variable) {
  node.strokes = [boundPaint(v)]
}

function bindRadius(node: SceneNode & CornerMixin & RectangleCornerMixin, v: Variable) {
  node.setBoundVariable('topLeftRadius', v)
  node.setBoundVariable('topRightRadius', v)
  node.setBoundVariable('bottomLeftRadius', v)
  node.setBoundVariable('bottomRightRadius', v)
}

function getVar(ctx: Ctx, name: string): Variable {
  const v = ctx.vars.get(name)
  if (!v) throw new Error(`Variable '${name}'가 없습니다 — 먼저 토큰(Variables)을 생성하세요.`)
  return v
}

async function loadVariables(): Promise<Map<string, Variable>> {
  const all = await figma.variables.getLocalVariablesAsync()
  return new Map(all.map((v) => [v.name, v]))
}

function makeText(ctx: Ctx, name: string, characters: string, sizeVar: Variable, bold = false): TextNode {
  const t = figma.createText()
  t.name = name
  t.fontName = bold ? ctx.fontBold : ctx.font
  t.characters = characters
  t.setBoundVariable('fontSize', sizeVar)
  return t
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

// ── _Slot/Placeholder + _Icon/* (§3-3) ─────────────────────────────
function makeSlotPlaceholder(ctx: Ctx): ComponentNode {
  const c = figma.createComponent()
  c.name = '_Slot/Placeholder'
  c.resize(200, 64)
  c.fills = []
  c.strokes = [solid('#E5E8EB')]
  c.dashPattern = [4, 4]
  c.strokeWeight = 1
  const t = figma.createText()
  t.fontName = ctx.font
  t.characters = 'Slot'
  t.fontSize = 12
  t.fills = [solid('#E5E8EB')]
  c.appendChild(t)
  t.x = (c.width - t.width) / 2
  t.y = (c.height - t.height) / 2
  ctx.page.appendChild(c)
  return c
}

const ICON_PATHS: Record<string, string> = {
  '_Icon/Star':
    'M 12 2 L 14.9 8.26 L 21.5 9.27 L 16.75 13.55 L 18.2 20 L 12 16.56 L 5.8 20 L 7.25 13.55 L 2.5 9.27 L 9.1 8.26 Z',
  '_Icon/Heart':
    'M 12 21 L 4 13 C 1 10 3 5 7 5 C 9 5 11 6 12 8 C 13 6 15 5 17 5 C 21 5 23 10 20 13 Z',
  '_Icon/Bell':
    'M 12 22 C 13.1 22 14 21.1 14 20 L 10 20 C 10 21.1 10.9 22 12 22 Z M 18 16 L 18 11 C 18 7.9 16.4 5.4 13.5 4.7 L 13.5 4 C 13.5 3.2 12.8 2.5 12 2.5 C 11.2 2.5 10.5 3.2 10.5 4 L 10.5 4.7 C 7.6 5.4 6 7.9 6 11 L 6 16 L 4 18 L 4 19 L 20 19 L 20 18 Z',
}

function makeIconComponents(ctx: Ctx) {
  const textVar = getVar(ctx, 'color/text')
  for (const [name, path] of Object.entries(ICON_PATHS)) {
    const c = figma.createComponent()
    c.name = name
    c.resize(24, 24)
    c.fills = []
    const v = figma.createVector()
    v.vectorPaths = [{ windingRule: 'NONZERO', data: path }]
    bindFill(v, textVar)
    v.strokes = []
    c.appendChild(v)
    v.x = 0
    v.y = 0
    v.resize(24, 24)
    ctx.page.appendChild(c)
    ctx.iconComponents.set(name, c)
  }
}

// ── DS/Button ───────────────────────────────────────────────────────
function makeButtonSet(ctx: Ctx, spec: ComponentSpec): ComponentSetNode {
  const sizePad: Record<string, { v: number; hVar: string; fontVar: string }> = {
    sm: { v: 6, hVar: 'spacing/3', fontVar: 'font/size/sm' },
    md: { v: 10, hVar: 'spacing/4', fontVar: 'font/size/md' },
    lg: { v: 14, hVar: 'spacing/5', fontVar: 'font/size/lg' },
  }
  const variants: ComponentNode[] = []
  const axes = spec.variants
  for (const variant of axes[0].values) {
    for (const size of axes[1].values) {
      for (const disabled of axes[2].values) {
        const c = figma.createComponent()
        c.name = `variant=${variant}, size=${size}, disabled=${disabled}`
        c.layoutMode = 'HORIZONTAL'
        c.primaryAxisSizingMode = 'AUTO'
        c.counterAxisSizingMode = 'AUTO'
        c.counterAxisAlignItems = 'CENTER'
        c.setBoundVariable('itemSpacing', getVar(ctx, 'spacing/2'))
        c.paddingTop = sizePad[size].v
        c.paddingBottom = sizePad[size].v
        c.setBoundVariable('paddingLeft', getVar(ctx, sizePad[size].hVar))
        c.setBoundVariable('paddingRight', getVar(ctx, sizePad[size].hVar))
        bindRadius(c, getVar(ctx, 'radius/md'))
        bindFill(c, getVar(ctx, `color/${variant}`))
        if (disabled === 'true') c.opacity = 0.45

        const icon = ctx.iconComponents.get('_Icon/Star')!.createInstance()
        icon.name = 'icon'
        icon.visible = false
        c.appendChild(icon)

        const label = makeText(ctx, 'label', 'Button', getVar(ctx, sizePad[size].fontVar))
        bindFill(label, getVar(ctx, 'color/bg'))
        c.appendChild(label)

        ctx.page.appendChild(c)
        variants.push(c)
      }
    }
  }
  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = spec.name
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 16
  set.counterAxisSpacing = 16
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24
  addSharedProps(ctx, set, spec)
  return set
}

// ── DS/TextField ────────────────────────────────────────────────────
function makeTextFieldSet(ctx: Ctx, spec: ComponentSpec): ComponentSetNode {
  const variants: ComponentNode[] = []
  for (const error of spec.variants[0].values) {
    for (const disabled of spec.variants[1].values) {
      const c = figma.createComponent()
      c.name = `error=${error}, disabled=${disabled}`
      c.layoutMode = 'VERTICAL'
      c.primaryAxisSizingMode = 'AUTO'
      c.counterAxisSizingMode = 'FIXED'
      c.resize(320, c.height)
      c.setBoundVariable('itemSpacing', getVar(ctx, 'spacing/1'))
      if (disabled === 'true') c.opacity = 0.45

      const label = makeText(ctx, 'label', 'Email', getVar(ctx, 'font/size/sm'))
      bindFill(label, getVar(ctx, 'color/text'))
      c.appendChild(label)

      const input = autoFrame('input', 'HORIZONTAL')
      input.counterAxisAlignItems = 'CENTER'
      input.layoutAlign = 'STRETCH'
      input.primaryAxisSizingMode = 'FIXED'
      input.paddingTop = input.paddingBottom = 10
      input.setBoundVariable('paddingLeft', getVar(ctx, 'spacing/3'))
      input.setBoundVariable('paddingRight', getVar(ctx, 'spacing/3'))
      bindRadius(input, getVar(ctx, 'radius/md'))
      bindFill(input, getVar(ctx, 'color/bg'))
      bindStroke(input, getVar(ctx, error === 'true' ? 'color/error' : 'color/secondary'))
      input.strokeWeight = 1

      const placeholder = makeText(ctx, 'placeholder', 'name@example.com', getVar(ctx, 'font/size/md'))
      bindFill(placeholder, getVar(ctx, 'color/secondary'))
      input.appendChild(placeholder)
      c.appendChild(input)

      const description = makeText(ctx, 'description', 'Description', getVar(ctx, 'font/size/xs'))
      bindFill(description, getVar(ctx, error === 'true' ? 'color/error' : 'color/secondary'))
      description.visible = false
      c.appendChild(description)

      ctx.page.appendChild(c)
      variants.push(c)
    }
  }
  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = spec.name
  set.layoutMode = 'VERTICAL'
  set.itemSpacing = 16
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24
  addSharedProps(ctx, set, spec)
  return set
}

// ── DS/Card (단일 컴포넌트 + Slot) ───────────────────────────────────
function makeCard(ctx: Ctx, spec: ComponentSpec): ComponentNode {
  const c = figma.createComponent()
  c.name = spec.name
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  bindFill(c, getVar(ctx, 'color/bg'))
  bindRadius(c, getVar(ctx, 'radius/lg'))
  c.effects = [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 },
      radius: 10,
      visible: true,
      blendMode: 'NORMAL',
    },
  ]

  const header = autoFrame('header', 'VERTICAL')
  header.layoutAlign = 'STRETCH'
  header.setBoundVariable('paddingLeft', getVar(ctx, 'spacing/4'))
  header.setBoundVariable('paddingRight', getVar(ctx, 'spacing/4'))
  header.setBoundVariable('paddingTop', getVar(ctx, 'spacing/4'))
  header.setBoundVariable('paddingBottom', getVar(ctx, 'spacing/4'))
  const title = makeText(ctx, 'title', 'Card title', getVar(ctx, 'font/size/lg'), true)
  bindFill(title, getVar(ctx, 'color/text'))
  header.appendChild(title)
  c.appendChild(header)

  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.setBoundVariable('paddingLeft', getVar(ctx, 'spacing/4'))
  body.setBoundVariable('paddingRight', getVar(ctx, 'spacing/4'))
  body.setBoundVariable('paddingBottom', getVar(ctx, 'spacing/4'))
  const slotInstance = ctx.slotComponent!.createInstance()
  slotInstance.name = 'slot'
  slotInstance.layoutAlign = 'STRETCH'
  body.appendChild(slotInstance)
  c.appendChild(body)

  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisAlignItems = 'MAX'
  footer.setBoundVariable('paddingLeft', getVar(ctx, 'spacing/4'))
  footer.setBoundVariable('paddingRight', getVar(ctx, 'spacing/4'))
  footer.setBoundVariable('paddingTop', getVar(ctx, 'spacing/3'))
  footer.setBoundVariable('paddingBottom', getVar(ctx, 'spacing/3'))
  footer.visible = false
  if (ctx.buttonSet) {
    const btnVariant = ctx.buttonSet.children.find(
      (n) => n.name === 'variant=primary, size=sm, disabled=false',
    ) as ComponentNode | undefined
    if (btnVariant) footer.appendChild(btnVariant.createInstance())
  }
  c.appendChild(footer)

  ctx.page.appendChild(c)

  const titleProp = c.addComponentProperty('title', 'TEXT', 'Card title')
  title.componentPropertyReferences = { characters: titleProp }
  const footerProp = c.addComponentProperty('showFooter', 'BOOLEAN', false)
  footer.componentPropertyReferences = { visible: footerProp }
  try {
    const contentProp = c.addComponentProperty('content', 'INSTANCE_SWAP', ctx.slotComponent!.id)
    slotInstance.componentPropertyReferences = { mainComponent: contentProp }
  } catch (e) {
    ctx.warnings.push(`Card content 스왑 속성 생성 실패: ${String(e)}`)
  }
  return c
}

// ── DS/Alert ────────────────────────────────────────────────────────
function makeAlertSet(ctx: Ctx, spec: ComponentSpec): ComponentSetNode {
  const variants: ComponentNode[] = []
  for (const variant of spec.variants[0].values) {
    const c = figma.createComponent()
    c.name = `variant=${variant}`
    c.layoutMode = 'HORIZONTAL'
    c.primaryAxisSizingMode = 'AUTO'
    c.counterAxisSizingMode = 'AUTO'
    c.counterAxisAlignItems = 'CENTER'
    c.setBoundVariable('itemSpacing', getVar(ctx, 'spacing/2'))
    c.setBoundVariable('paddingLeft', getVar(ctx, 'spacing/4'))
    c.setBoundVariable('paddingRight', getVar(ctx, 'spacing/4'))
    c.setBoundVariable('paddingTop', getVar(ctx, 'spacing/3'))
    c.setBoundVariable('paddingBottom', getVar(ctx, 'spacing/3'))
    bindRadius(c, getVar(ctx, 'radius/md'))
    bindFill(c, getVar(ctx, 'color/bg'))
    bindStroke(c, getVar(ctx, `color/${variant}`))
    c.strokeWeight = 1
    c.strokeLeftWeight = 4

    const icon = figma.createEllipse()
    icon.name = 'icon'
    icon.resize(20, 20)
    bindFill(icon, getVar(ctx, `color/${variant}`))
    icon.visible = false
    c.appendChild(icon)

    const label = makeText(ctx, 'label', 'This is a warning message.', getVar(ctx, 'font/size/md'))
    bindFill(label, getVar(ctx, 'color/text'))
    c.appendChild(label)

    ctx.page.appendChild(c)
    variants.push(c)
  }
  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = spec.name
  set.layoutMode = 'VERTICAL'
  set.itemSpacing = 16
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24
  addSharedProps(ctx, set, spec)
  return set
}

// ── DS/Badge ────────────────────────────────────────────────────────
function makeBadgeSet(ctx: Ctx, spec: ComponentSpec): ComponentSetNode {
  const pad: Record<string, { v: number; h: number; fontVar: string }> = {
    sm: { v: 2, h: 8, fontVar: 'font/size/xs' },
    md: { v: 4, h: 10, fontVar: 'font/size/sm' },
  }
  const variants: ComponentNode[] = []
  for (const variant of spec.variants[0].values) {
    for (const size of spec.variants[1].values) {
      const c = figma.createComponent()
      c.name = `variant=${variant}, size=${size}`
      c.layoutMode = 'HORIZONTAL'
      c.primaryAxisSizingMode = 'AUTO'
      c.counterAxisSizingMode = 'AUTO'
      c.paddingTop = c.paddingBottom = pad[size].v
      c.paddingLeft = c.paddingRight = pad[size].h
      bindRadius(c, getVar(ctx, 'radius/sm'))
      bindFill(c, getVar(ctx, `color/${variant}`))
      const label = makeText(ctx, 'label', 'Badge', getVar(ctx, pad[size].fontVar))
      bindFill(label, getVar(ctx, 'color/bg'))
      c.appendChild(label)
      ctx.page.appendChild(c)
      variants.push(c)
    }
  }
  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = spec.name
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 16
  set.counterAxisSpacing = 16
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24
  addSharedProps(ctx, set, spec)
  return set
}

// 공용: TEXT/BOOLEAN/INSTANCE_SWAP 속성 추가 + 노드 바인딩 (§3 순서: text → boolean → swap)
function addSharedProps(ctx: Ctx, set: ComponentSetNode, spec: ComponentSpec) {
  const findAll = (name: string) =>
    set.findAll((n) => n.name === name) as (TextNode | InstanceNode | SceneNode)[]

  for (const tp of spec.text) {
    const propId = set.addComponentProperty(tp.name, 'TEXT', tp.default)
    for (const node of findAll(tp.name)) {
      ;(node as TextNode).componentPropertyReferences = {
        ...(node as TextNode).componentPropertyReferences,
        characters: propId,
      }
    }
  }
  for (const bp of spec.booleans) {
    // boolean 표시/숨김 속성이 바인딩될 레이어 이름 규약: show<X> → <x> 레이어
    const layer = bp.name.replace(/^show/, '')
    const layerName = layer.charAt(0).toLowerCase() + layer.slice(1)
    const propId = set.addComponentProperty(bp.name, 'BOOLEAN', bp.default)
    for (const node of findAll(layerName)) {
      node.componentPropertyReferences = { ...node.componentPropertyReferences, visible: propId }
    }
  }
  for (const sp of spec.swaps) {
    const defaultComp = ctx.iconComponents.get(sp.default)
    if (!defaultComp) {
      ctx.warnings.push(`스왑 기본 컴포넌트 '${sp.default}' 없음 — '${sp.name}' 속성 생략`)
      continue
    }
    // 보정 #6: 로컬 컴포넌트는 node.id 사용. preferredValues는 실패해도 무시(1회 경고).
    let propId: string
    try {
      propId = set.addComponentProperty(sp.name, 'INSTANCE_SWAP', defaultComp.id, {
        preferredValues: sp.preferred
          .map((n) => ctx.iconComponents.get(n))
          .filter((c): c is ComponentNode => !!c)
          .map((c) => ({ type: 'COMPONENT' as const, key: c.key })),
      })
    } catch {
      ctx.warnings.push(
        `'${sp.name}' preferredValues 설정 실패(미발행 라이브러리) — 기본값만 적용. 라이브러리 발행 시 활성화됩니다.`,
      )
      propId = set.addComponentProperty(sp.name, 'INSTANCE_SWAP', defaultComp.id)
    }
    for (const node of findAll(sp.name)) {
      node.componentPropertyReferences = { ...node.componentPropertyReferences, mainComponent: propId }
    }
  }
}

// ── DS/SocialLoginButton (선택) ─────────────────────────────────────
function makeSocialSet(ctx: Ctx, providers: string[], sizes: string[]): ComponentSetNode {
  const sizePad: Record<string, { v: number; fontVar: string }> = {
    md: { v: 10, fontVar: 'font/size/md' },
    lg: { v: 14, fontVar: 'font/size/lg' },
  }
  const variants: ComponentNode[] = []
  for (const provider of providers) {
    const brand = SOCIAL_BRAND[provider]
    for (const size of sizes) {
      const c = figma.createComponent()
      c.name = `provider=${provider}, size=${size}`
      c.layoutMode = 'HORIZONTAL'
      c.primaryAxisSizingMode = 'FIXED'
      c.counterAxisSizingMode = 'AUTO'
      c.primaryAxisAlignItems = 'CENTER'
      c.counterAxisAlignItems = 'CENTER'
      c.itemSpacing = 8
      c.paddingTop = c.paddingBottom = sizePad[size].v
      c.paddingLeft = c.paddingRight = 16
      bindRadius(c, getVar(ctx, 'radius/md'))
      c.fills = [solid(brand.bg)]
      if (brand.border) {
        c.strokes = [solid(brand.border)]
        c.strokeWeight = 1
      }
      const logo = makeText(ctx, 'logo', provider.charAt(0).toUpperCase(), getVar(ctx, sizePad[size].fontVar), true)
      logo.fills = [solid(brand.label)]
      c.appendChild(logo)
      const label = makeText(ctx, 'label', brand.text, getVar(ctx, sizePad[size].fontVar))
      label.fills = [solid(brand.label)]
      c.appendChild(label)
      c.resize(320, c.height)
      ctx.page.appendChild(c)
      variants.push(c)
    }
  }
  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = 'DS/SocialLoginButton'
  set.layoutMode = 'VERTICAL'
  set.itemSpacing = 12
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24

  const labelProp = set.addComponentProperty('label', 'TEXT', SOCIAL_BRAND[providers[0]].text)
  for (const node of set.findAll((n) => n.name === 'label')) {
    ;(node as TextNode).componentPropertyReferences = { characters: labelProp }
  }
  const logoProp = set.addComponentProperty('showLogo', 'BOOLEAN', true)
  for (const node of set.findAll((n) => n.name === 'logo')) {
    node.componentPropertyReferences = { visible: logoProp }
  }
  return set
}

// ── DS/Chart (선택) — 단순 벡터 근사 ─────────────────────────────────
function makeChartSet(ctx: Ctx, types: string[]): ComponentSetNode {
  const paletteVars = ['primary', 'secondary', 'error', 'success'].map((k) => getVar(ctx, `color/${k}`))
  const W = 480
  const H = 260
  const variants: ComponentNode[] = []

  for (const type of types) {
    const c = figma.createComponent()
    c.name = `type=${type}`
    c.resize(W, H + 72)
    bindFill(c, getVar(ctx, 'color/bg'))

    const title = makeText(ctx, 'title', 'Chart', getVar(ctx, 'font/size/lg'), true)
    bindFill(title, getVar(ctx, 'color/text'))
    c.appendChild(title)
    title.x = 16
    title.y = 12

    const plot = figma.createFrame()
    plot.name = 'plot'
    plot.resize(W - 32, H - 40)
    plot.x = 16
    plot.y = 48
    plot.fills = []
    c.appendChild(plot)

    if (type === 'line') {
      const data = CHART_SAMPLE.revenue
      const max = Math.max(...data)
      const stepX = plot.width / (data.length - 1)
      const pts = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${plot.height - (v / max) * plot.height}`)
      const vec = figma.createVector()
      vec.vectorPaths = [{ windingRule: 'NONE', data: pts.join(' ') }]
      vec.strokes = [boundPaint(paletteVars[0])]
      vec.strokeWeight = 2
      vec.fills = []
      plot.appendChild(vec)
    } else if (type === 'bar') {
      const data = CHART_SAMPLE.traffic
      const max = Math.max(...data)
      const barW = plot.width / data.length - 12
      data.forEach((v, i) => {
        const r = figma.createRectangle()
        const h = (v / max) * plot.height
        r.resize(barW, h)
        r.x = i * (barW + 12)
        r.y = plot.height - h
        r.fills = [boundPaint(paletteVars[i % paletteVars.length])]
        plot.appendChild(r)
      })
    } else {
      const data = CHART_SAMPLE.share
      const total = data.reduce((a, b) => a + b, 0)
      let angle = -Math.PI / 2
      data.forEach((v, i) => {
        const sweep = (v / total) * Math.PI * 2
        const e = figma.createEllipse()
        e.resize(200, 200)
        e.x = (plot.width - 200) / 2
        e.y = (plot.height - 200) / 2
        e.arcData = { startingAngle: angle, endingAngle: angle + sweep, innerRadius: 0.6 }
        e.fills = [boundPaint(paletteVars[i % paletteVars.length])]
        plot.appendChild(e)
        angle += sweep
      })
    }

    // legend (4색 칩)
    const legend = autoFrame('legend', 'HORIZONTAL')
    legend.itemSpacing = 12
    paletteVars.forEach((pv, i) => {
      const chipRow = autoFrame(`chip-${i}`, 'HORIZONTAL')
      chipRow.itemSpacing = 4
      chipRow.counterAxisAlignItems = 'CENTER'
      const chip = figma.createRectangle()
      chip.resize(10, 10)
      chip.fills = [boundPaint(pv)]
      chipRow.appendChild(chip)
      const t = makeText(ctx, `legend-label-${i}`, ['primary', 'secondary', 'error', 'success'][i], getVar(ctx, 'font/size/xs'))
      bindFill(t, getVar(ctx, 'color/secondary'))
      chipRow.appendChild(t)
      legend.appendChild(chipRow)
    })
    c.appendChild(legend)
    legend.x = 16
    legend.y = H + 40

    ctx.page.appendChild(c)
    variants.push(c)
  }

  const set = figma.combineAsVariants(variants, ctx.page)
  set.name = 'DS/Chart'
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 24
  set.counterAxisSpacing = 24
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24

  const titleProp = set.addComponentProperty('title', 'TEXT', 'Chart')
  for (const node of set.findAll((n) => n.name === 'title')) {
    ;(node as TextNode).componentPropertyReferences = { characters: titleProp }
  }
  const legendProp = set.addComponentProperty('showLegend', 'BOOLEAN', true)
  for (const node of set.findAll((n) => n.name === 'legend')) {
    node.componentPropertyReferences = { visible: legendProp }
  }
  return set
}

// ── 엔트리 ──────────────────────────────────────────────────────────
export async function generateComponents(opts: GenerateComponentsOptions): Promise<string[]> {
  const manifest = opts.manifest ?? COMPONENT_MANIFEST
  const warnings: string[] = []

  // §0-15 멱등: "2. 컴포넌트" 페이지가 이미 있으면 중단
  const existing = figma.root.children.find((p) => p.name === '2. 컴포넌트')
  if (existing) {
    throw new Error("페이지 '2. 컴포넌트'가 이미 존재합니다 — 생성을 중단했습니다(§0-15).")
  }
  const page = figma.createPage()
  page.name = '2. 컴포넌트'

  const vars = await loadVariables()
  if (!vars.has('color/primary')) {
    throw new Error("Variables가 없습니다 — 생성 범위에서 '토큰'을 먼저 실행하세요.")
  }

  // 폰트: font/family 변수값 → 실패 시 Inter 폴백
  const typoCol = (await figma.variables.getLocalVariableCollectionsAsync()).find(
    (col) => col.name === 'DS Typography',
  )
  let familyName = 'Inter'
  const familyVar = vars.get('font/family')
  if (familyVar && typoCol) {
    const raw = familyVar.valuesByMode[typoCol.modes[0].modeId]
    if (typeof raw === 'string') familyName = firstFontFamily(raw)
  }
  try {
    await figma.loadFontAsync({ family: familyName, style: 'Regular' })
    await figma.loadFontAsync({ family: familyName, style: 'Bold' })
  } catch {
    warnings.push(`폰트 '${familyName}' 로드 실패 — Inter로 폴백.`)
    familyName = 'Inter'
    await figma.loadFontAsync({ family: familyName, style: 'Regular' })
    await figma.loadFontAsync({ family: familyName, style: 'Bold' })
  }

  const ctx: Ctx = {
    vars,
    font: { family: familyName, style: 'Regular' },
    fontBold: { family: familyName, style: 'Bold' },
    warnings,
    page,
    iconComponents: new Map(),
    slotComponent: null,
    buttonSet: null,
  }

  // 0. 슬롯/아이콘 → 1~5. 코어 → 6~7. 선택
  ctx.slotComponent = makeSlotPlaceholder(ctx)
  makeIconComponents(ctx)

  let y = 200
  const place = (node: SceneNode) => {
    node.x = 0
    node.y = y
    y += node.height + 80
  }

  for (const spec of manifest.components) {
    let node: SceneNode
    if (spec.kind === 'button') {
      const set = makeButtonSet(ctx, spec)
      ctx.buttonSet = set
      node = set
    } else if (spec.kind === 'textfield') node = makeTextFieldSet(ctx, spec)
    else if (spec.kind === 'card') node = makeCard(ctx, spec)
    else if (spec.kind === 'alert') node = makeAlertSet(ctx, spec)
    else if (spec.kind === 'badge') node = makeBadgeSet(ctx, spec)
    else {
      warnings.push(`알 수 없는 kind '${spec.kind}' — '${spec.name}' 생략`)
      continue
    }
    place(node)
  }

  if (opts.social.length > 0) place(makeSocialSet(ctx, opts.social, manifest.social.sizes))
  if (opts.charts) place(makeChartSet(ctx, manifest.chart.types))

  return warnings
}
