// 스냅샷(스토리북 복사) — snapshots.json + PNG를 원격에서 받아 Figma에 이미지로 배치한다.
// "self-built story.to.design": Storybook UI를 그대로 캡처한 이미지를 섹션별 페이지에 세로로
// 쌓아, 각 용도별 컴포넌트/문서가 스토리북과 동일하게 보이도록 한다(faithful 복사).
// 캡처 파이프라인: repo scripts/capture-snapshots.mjs (Playwright).

import { boundPaint, solid } from './lib/bind'
import { SUB } from './foundations'

// 섹션 제목·컴포넌트 라벨 크기 — font/size/<px> 변수(tokens.ts)에 바인딩된다.
const HEADING_SIZE = 28
const LABEL_SIZE = 15

export type SnapshotEntry = {
  id: string
  title: string
  section: string
  component: string
  name: string
  viewMode: string
  width: number
  height: number
  scale: number
  file: string
}
export type SnapshotManifest = {
  count: number
  sections: string[]
  snapshots: SnapshotEntry[]
}

async function loadLabelFont(): Promise<FontName | null> {
  for (const family of ['Inter', 'Roboto']) {
    try {
      await figma.loadFontAsync({ family, style: 'Bold' })
      await figma.loadFontAsync({ family, style: 'Regular' })
      return { family, style: 'Bold' }
    } catch {
      // 다음 후보
    }
  }
  return null
}

export async function generateSnapshots(baseUrl: string): Promise<string[]> {
  const warnings: string[] = []
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'

  const res = await fetch(base + 'snapshots.json')
  if (!res.ok) throw new Error(`snapshots.json HTTP ${res.status} — capture 후 커밋했는지 확인하세요.`)
  const manifest = (await res.json()) as SnapshotManifest
  if (!manifest || !Array.isArray(manifest.snapshots) || manifest.snapshots.length === 0) {
    throw new Error('snapshots.json에 스냅샷이 없습니다.')
  }

  const boldFont = await loadLabelFont()
  const regularFont: FontName | null = boldFont ? { family: boldFont.family, style: 'Regular' } : null
  // 오너: 폰트 크기도 전부 변수 — 토큰이 생성돼 있으면 섹션 제목·라벨 크기를 font/size/* 에 바인딩.
  const vars = new Map((await figma.variables.getLocalVariablesAsync()).map((v) => [v.name, v]))
  const bindFontSize = (node: TextNode, px: number) => {
    const v = vars.get('font/size/' + px)
    if (!v) return
    try {
      node.setBoundVariable('fontSize', v)
    } catch {
      /* skip */
    }
  }

  // 섹션별 그룹화
  const bySection = new Map<string, SnapshotEntry[]>()
  for (const s of manifest.snapshots) {
    if (!bySection.has(s.section)) bySection.set(s.section, [])
    bySection.get(s.section)!.push(s)
  }

  const existing = new Set(figma.root.children.map((p) => p.name))
  let placed = 0

  for (const section of manifest.sections) {
    const items = bySection.get(section)
    if (!items || items.length === 0) continue

    // 페이지 이름은 스토리북 사이드바 섹션과 동일. 멱등: 있으면 건너뜀(재생성은 reset로).
    if (existing.has(section)) {
      warnings.push(`페이지 '${section}' 이미 존재 — 스냅샷 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
      continue
    }
    const page = figma.createPage()
    page.name = section
    existing.add(section)

    const X = 80
    let y = 96

    // 섹션 제목
    if (boldFont) {
      const h = figma.createText()
      h.fontName = boldFont
      h.characters = section
      h.fontSize = HEADING_SIZE
      bindFontSize(h, HEADING_SIZE)
      h.x = X
      h.y = 40
      page.appendChild(h)
    }

    for (const s of items) {
      let bytes: Uint8Array
      try {
        const imgRes = await fetch(base + s.file)
        if (!imgRes.ok) {
          warnings.push(`${s.component}: 이미지 HTTP ${imgRes.status} (${s.file})`)
          continue
        }
        bytes = new Uint8Array(await imgRes.arrayBuffer())
      } catch (e) {
        warnings.push(`${s.component}: 이미지 fetch 실패 (${e instanceof Error ? e.message : String(e)})`)
        continue
      }

      // 컴포넌트 라벨
      if (regularFont) {
        const label = figma.createText()
        label.fontName = regularFont
        const suffix = s.name && s.name.toLowerCase() !== 'default' ? ` · ${s.name}` : ''
        label.characters = `${s.component}${suffix}`
        label.fontSize = LABEL_SIZE
        bindFontSize(label, LABEL_SIZE)
        // color/secondary — 다른 생성기의 캡션류 라벨과 같은 변수(categories-data-kr-media.ts:68 등).
        // ctx 없이도 vars 맵(위에서 이미 로드)으로 바인딩 가능 — bindFillVar와 동일한 관용구.
        const secondaryVar = vars.get('color/secondary')
        label.fills = [secondaryVar ? boundPaint(secondaryVar) : solid(SUB)]
        label.x = X
        label.y = y
        page.appendChild(label)
        y += label.height + 10
      }

      // 이미지 배치(자연 CSS 크기 rect + IMAGE fill)
      try {
        const image = figma.createImage(bytes)
        const rect = figma.createRectangle()
        rect.resize(s.width, s.height)
        rect.x = X
        rect.y = y
        rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }]
        rect.name = `${s.component}${s.name && s.name.toLowerCase() !== 'default' ? ' / ' + s.name : ''}`
        page.appendChild(rect)
        y += s.height + 56
        placed++
      } catch (e) {
        warnings.push(`${s.component}: createImage 실패 (${e instanceof Error ? e.message : String(e)})`)
      }
    }
  }

  if (placed === 0) warnings.push('배치된 스냅샷이 없습니다 — 네트워크/URL을 확인하세요.')
  return warnings
}
