// P4 — docs-content.json → Figma 페이지 미러링
import { rgbToHex } from '../presets'

// 표 셀 본문 크기 — font/size/13 변수(tokens.ts)에 바인딩된다. 리터럴로 두면
// verify-bindings B3(하드코딩 폰트)에 걸린다 — 이름 있는 상수를 거쳐 변수 바인딩까지 잇는다.
const TABLE_CELL_SIZE = 13

export type DocBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; text: string }
  | { type: 'colorGrid'; tokens: string[] }
  | { type: 'typeScale'; sizes: string[] }
  | { type: 'componentDemo'; component: string }
  | { type: 'table'; id: string }
  | { type: string; [k: string]: unknown }

export type DocsContent = {
  sections: Array<{
    id: string
    order: number
    title: string
    figmaPage: string
    storybookTitle: string
    blocks: DocBlock[]
  }>
  tables: Record<string, { columns: string[]; rows: string[][] }>
}

type DocCtx = {
  font: FontName
  fontBold: FontName
  styles: Map<string, TextStyle>
  vars: Map<string, Variable>
  colorModeId: string | null
  skipped: string[]
}

function styledText(ctx: DocCtx, styleName: string, characters: string): TextNode {
  const t = figma.createText()
  t.fontName = ctx.font
  const style = ctx.styles.get(styleName)
  t.characters = characters
  if (style) t.textStyleId = style.id
  return t
}

async function renderBlock(ctx: DocCtx, block: DocBlock, docsContent: DocsContent): Promise<SceneNode | null> {
  switch (block.type) {
    case 'heading':
      return styledText(ctx, 'DS/Title', (block as { text: string }).text)
    case 'paragraph':
      return styledText(ctx, 'DS/Body', (block as { text: string }).text)
    case 'callout': {
      const f = figma.createFrame()
      f.name = 'callout'
      f.layoutMode = 'HORIZONTAL'
      f.primaryAxisSizingMode = 'AUTO'
      f.counterAxisSizingMode = 'AUTO'
      f.paddingLeft = 16
      f.paddingRight = 16
      f.paddingTop = 12
      f.paddingBottom = 12
      f.fills = []
      const primary = ctx.vars.get('color/primary')
      if (primary) {
        f.strokes = [
          figma.variables.setBoundVariableForPaint(
            { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
            'color',
            primary,
          ),
        ]
        f.strokeLeftWeight = 4
        f.strokeTopWeight = 0
        f.strokeRightWeight = 0
        f.strokeBottomWeight = 0
      }
      f.appendChild(styledText(ctx, 'DS/Body', (block as { text: string }).text))
      return f
    }
    case 'colorGrid': {
      const grid = figma.createFrame()
      grid.name = 'colorGrid'
      grid.layoutMode = 'HORIZONTAL'
      grid.layoutWrap = 'WRAP'
      grid.itemSpacing = 24
      grid.counterAxisSpacing = 24
      grid.primaryAxisSizingMode = 'AUTO'
      grid.counterAxisSizingMode = 'AUTO'
      grid.fills = []
      for (const token of (block as { tokens: string[] }).tokens) {
        const v = ctx.vars.get(`color/${token}`)
        const card = figma.createFrame()
        card.name = `color-${token}`
        card.layoutMode = 'VERTICAL'
        card.itemSpacing = 8
        card.primaryAxisSizingMode = 'AUTO'
        card.counterAxisSizingMode = 'AUTO'
        card.fills = []
        const swatch = figma.createRectangle()
        swatch.resize(120, 80)
        swatch.cornerRadius = 8
        let hex = ''
        if (v && ctx.colorModeId) {
          swatch.fills = [
            figma.variables.setBoundVariableForPaint(
              { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
              'color',
              v,
            ),
          ]
          const raw = v.valuesByMode[ctx.colorModeId]
          if (raw && typeof raw === 'object' && 'r' in (raw as RGB)) hex = rgbToHex(raw as RGB)
        }
        card.appendChild(swatch)
        card.appendChild(styledText(ctx, 'DS/Caption', `${token}${hex ? ` ${hex}` : ''}`))
        grid.appendChild(card)
      }
      return grid
    }
    case 'typeScale': {
      const wrap = figma.createFrame()
      wrap.name = 'typeScale'
      wrap.layoutMode = 'VERTICAL'
      wrap.itemSpacing = 12
      wrap.primaryAxisSizingMode = 'AUTO'
      wrap.counterAxisSizingMode = 'AUTO'
      wrap.fills = []
      for (const size of (block as { sizes: string[] }).sizes) {
        const v = ctx.vars.get(`font/size/${size}`)
        const t = figma.createText()
        t.fontName = ctx.font
        t.characters = `${size} — 가나다 ABC 123`
        if (v) t.setBoundVariable('fontSize', v)
        wrap.appendChild(t)
      }
      return wrap
    }
    case 'componentDemo': {
      const name = (block as { component: string }).component
      const target = figma.root.findOne(
        (n) =>
          (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === `DS/${name}`,
      )
      if (!target) {
        ctx.skipped.push(`componentDemo:${name}`)
        return null
      }
      const comp =
        target.type === 'COMPONENT_SET'
          ? (target as ComponentSetNode).defaultVariant
          : (target as ComponentNode)
      return comp.createInstance()
    }
    case 'table': {
      const def = docsContent.tables[(block as { id: string }).id]
      if (!def) {
        ctx.skipped.push(`table:${(block as { id: string }).id}`)
        return null
      }
      const table = figma.createFrame()
      table.name = 'table'
      table.layoutMode = 'VERTICAL'
      table.itemSpacing = 0
      table.primaryAxisSizingMode = 'AUTO'
      table.counterAxisSizingMode = 'AUTO'
      table.fills = []
      const addRow = (cells: string[], bold: boolean) => {
        const row = figma.createFrame()
        row.layoutMode = 'HORIZONTAL'
        row.itemSpacing = 0
        row.primaryAxisSizingMode = 'AUTO'
        row.counterAxisSizingMode = 'AUTO'
        row.fills = []
        for (const cell of cells) {
          const cellFrame = figma.createFrame()
          cellFrame.layoutMode = 'VERTICAL'
          cellFrame.primaryAxisSizingMode = 'AUTO'
          cellFrame.counterAxisSizingMode = 'FIXED'
          cellFrame.resize(320, cellFrame.height)
          cellFrame.paddingLeft = 12
          cellFrame.paddingRight = 12
          cellFrame.paddingTop = 8
          cellFrame.paddingBottom = 8
          cellFrame.fills = []
          const t = figma.createText()
          t.fontName = bold ? ctx.fontBold : ctx.font
          t.characters = cell
          t.fontSize = TABLE_CELL_SIZE
          // 오너: 폰트 크기도 전부 변수 — font/size/13(tokens.ts가 생성)이 있으면 바인딩.
          const sv = ctx.vars.get('font/size/' + TABLE_CELL_SIZE)
          if (sv) {
            try {
              t.setBoundVariable('fontSize', sv)
            } catch {
              /* skip */
            }
          }
          t.layoutAlign = 'STRETCH'
          cellFrame.appendChild(t)
          row.appendChild(cellFrame)
        }
        table.appendChild(row)
      }
      addRow(def.columns, true)
      for (const row of def.rows) addRow(row, false)
      return table
    }
    default:
      ctx.skipped.push(`unknown:${block.type}`)
      return null
  }
}

export async function generateDocs(docsContent: DocsContent): Promise<{ warnings: string[]; skipped: string[] }> {
  const warnings: string[] = []

  // §0-15 멱등: 동일 이름 페이지 존재 시 중단
  const wanted = docsContent.sections.map((s) => `${s.order}. ${s.title}`)
  const dup = figma.root.children.filter((p) => wanted.includes(p.name)).map((p) => p.name)
  if (dup.length > 0) {
    throw new Error(`이미 존재하는 페이지: ${dup.join(', ')} — 생성을 중단했습니다(§0-15).`)
  }

  const styles = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]))
  const vars = new Map((await figma.variables.getLocalVariablesAsync()).map((v) => [v.name, v]))
  const colorCol = (await figma.variables.getLocalVariableCollectionsAsync()).find(
    (c) => c.name === 'DS Color',
  )

  // 폰트 로드 (DS/Body 스타일 기준, 실패 시 Inter)
  let family = 'Inter'
  const body = styles.get('DS/Body')
  if (body) family = body.fontName.family
  try {
    await figma.loadFontAsync({ family, style: 'Regular' })
    await figma.loadFontAsync({ family, style: 'Bold' })
  } catch {
    warnings.push(`폰트 '${family}' 로드 실패 — Inter 폴백.`)
    family = 'Inter'
    await figma.loadFontAsync({ family, style: 'Regular' })
    await figma.loadFontAsync({ family, style: 'Bold' })
  }

  const ctx: DocCtx = {
    font: { family, style: 'Regular' },
    fontBold: { family, style: 'Bold' },
    styles,
    vars,
    colorModeId: colorCol ? colorCol.defaultModeId : null,
    skipped: [],
  }

  const ordered = [...docsContent.sections].sort((a, b) => a.order - b.order)
  const existing = new Set(figma.root.children.map((p) => p.name))
  for (const section of ordered) {
    const pageName = `${section.order}. ${section.title}`
    // 멱등: 같은 이름 페이지가 이미 있으면 중복 생성하지 않고 건너뛴다(재생성은 reset로).
    if (existing.has(pageName)) {
      ctx.skipped.push(`${pageName} (이미 존재)`)
      continue
    }
    const page = figma.createPage()
    page.name = pageName
    const frame = figma.createFrame()
    frame.name = section.figmaPage
    frame.layoutMode = 'VERTICAL'
    frame.primaryAxisSizingMode = 'AUTO'
    frame.counterAxisSizingMode = 'FIXED'
    frame.resize(1200, frame.height)
    frame.paddingLeft = frame.paddingRight = frame.paddingTop = frame.paddingBottom = 64
    frame.itemSpacing = 40
    page.appendChild(frame)
    for (const block of section.blocks) {
      const node = await renderBlock(ctx, block, docsContent)
      if (node) frame.appendChild(node)
    }
  }

  return { warnings, skipped: ctx.skipped }
}
