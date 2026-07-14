// 색·텍스트·토큰 바인딩 원시 함수 — **유일한 정본**.
//
// 왜 여기 한 벌만 두는가: boundText·bindFillVar·bindStrokeVar·bindTokens가 admin·categories-shared·
// layout-guide·screens·site·site-screens에 각각 복붙돼 최대 6벌로 살아 있었다. site.ts는 이름만 다른
// 사본(`node.fills = [v ? boundPaint(v) : solid(hexOf(...))]`)까지 갖고 있었다. 오너가 지적한
// "버튼/탭 색이 플러그인 UI에서 안 바뀐다" 증상이 정확히 이 복제 때문이었다 — 사본 하나만 고치면
// 나머지 다섯은 계속 raw 색을 쓴다(verify-bindings.mjs B4).
//
// solid·txt·boundPaint도 여기로 옮겼다. foundations.ts 자신의 문서 크롬 텍스트도 boundText로 바꿔야
// 하는데(오너: 폰트도 전부 변수), boundText가 foundations.ts의 txt/boundPaint에 의존하는 예전 구조로는
// foundations.ts → lib/bind.ts → foundations.ts 순환 임포트가 생긴다. 그래서 저수준 원시 함수를
// 이 파일로 내리고 foundations.ts는 여기서 다시 가져다 쓴다(단방향: foundations → lib/bind).
// foundations.ts로의 유일한 역방향 의존은 `type Ctx`뿐이고, 타입 임포트는 컴파일 타임에 지워져
// 런타임 순환이 없다.
import { hexToRgb } from '../../presets'
import type { Ctx } from '../foundations'

export const solid = (hex: string): SolidPaint => ({ type: 'SOLID', color: hexToRgb(hex) })

export function boundPaint(v: Variable): SolidPaint {
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)
}

export function txt(ctx: Ctx, chars: string, size: number, hex: string, bold = false): TextNode {
  const t = figma.createText()
  t.fontName = bold ? ctx.fontBold : ctx.font
  t.characters = chars
  t.fontSize = size
  t.fills = [solid(hex)]
  t.textAutoResize = 'WIDTH_AND_HEIGHT'
  return t
}

/** 폭 제한 래핑 텍스트. */
export function txtWrap(ctx: Ctx, chars: string, size: number, hex: string, maxW: number, bold = false): TextNode {
  const t = txt(ctx, chars, size, hex, bold)
  t.textAutoResize = 'HEIGHT'
  t.resize(maxW, t.height)
  return t
}

/**
 * 크기·굵기·글씨체만 변수에 바인딩한다(색은 건드리지 않는다) — boundText의 색 없는 버전.
 * 브랜드 고정색 텍스트(카카오/네이버 버튼 라벨 등 — brand-logos.ts 참고)처럼 "색은 못 바꿔도
 * 폰트는 바꿀 수 있어야" 할 때 쓴다. 오너: 폰트는 전부 변수.
 */
export function bindFontVars(ctx: Ctx, t: TextNode, size: number, bold = false): TextNode {
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
  // ctx.fontFamilyVar가 null이면 절대 바인딩하지 않는다(미로드 폰트 바인딩 → 노드 생성 실패).
  if (ctx.fontFamilyVar) {
    try {
      bind.setBoundVariable('fontFamily', ctx.fontFamilyVar)
    } catch {
      /* skip */
    }
  }
  return t
}

/** 텍스트 — 색·크기·굵기·글씨체를 전부 변수에 바인딩한다(오너: 폰트도 전부 변수). */
export function boundText(ctx: Ctx, chars: string, size: number, varName: string, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, ctx.userColors[varName] ?? hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  return bindFontVars(ctx, t, size, bold)
}

export function bindFillVar(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)]
}

export function bindStrokeVar(ctx: Ctx, node: MinimalStrokesMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)]
}

export type BindTokensOpts = {
  /**
   * 인스턴스 내부는 건너뛴다 — 화면(screens.ts·site-screens.ts)이 인스턴스에 또 오버라이드를
   * 쌓으면 세트를 고쳐도 화면이 안 바뀌는 상태로 되돌아간다(오너 지적의 핵심 증상). 세트 소스
   * (categories·admin·layout-guide)는 인스턴스가 없는 컴포넌트 자체를 바인딩하므로 기본값(false)을 쓴다.
   */
  skipInstances?: boolean
}

/** 보더·패딩·간격·라운드·불투명도를 값이 맞는 변수에 후처리 바인딩. */
export function bindTokens(ctx: Ctx, root: SceneNode, opts: BindTokensOpts = {}) {
  const all: SceneNode[] = []
  const walk = (n: SceneNode) => {
    all.push(n)
    if (opts.skipInstances && n.type === 'INSTANCE') return
    const kids = (n as unknown as { children?: readonly SceneNode[] }).children
    if (kids) for (const k of kids) walk(k)
  }
  walk(root)
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
    // 개별 보더(행 하단선 등)는 strokeWeight가 figma.mixed(symbol) → 자동으로 건너뛴다.
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
