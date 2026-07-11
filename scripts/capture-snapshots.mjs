// Storybook static build → 스토리별 PNG 스냅샷 + snapshots.json.
// "self-built story.to.design": 각 용도별 컴포넌트/문서를 스토리북 UI 그대로 캡처해
// Figma 플러그인이 이미지로 가져가 용도별 페이지에 배치한다(faithful 복사).
//
// 사용: pnpm snapshots            (전체 DS 섹션 캡처)
//       LIMIT=8 pnpm snapshots    (앞 8개만 — 스모크 테스트)
// 선행: pnpm build-storybook (storybook-static/ 필요)
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, stat, writeFile, mkdir, rm } from 'node:fs/promises'
import { resolve, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STATIC = resolve(ROOT, 'storybook-static')
const OUT_DIR = resolve(ROOT, 'packages', 'figma-story-tools', 'snapshots')
const PORT = 6011
const MAX_PX = 4096 // Figma createImage 한 변 최대 픽셀(초과 시 거부) → 이 안에서 최대 배율 사용
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity

// 캡처 대상 DS 섹션(사이드바 접두). Frameworks/Admin/Icons/Styling/Templates 등 비교·메타 섹션 제외.
const DS_SECTIONS = [
  '0. 시작하기',
  '1. 컬러',
  '2. 타이포그래피',
  '3. 컴포넌트',
  '4. 차트',
  '5. 소셜 로그인',
  '6. KR 컴포넌트',
  '7. 상태 & 검증',
  '8. Playground',
  '10. 접근성',
]
// 대표 스토리 선택 우선순위(가장 포괄적인 것)
const NAME_RANK = ['all variants', 'all', 'variants', 'overview', 'showcase', 'gallery', 'states', 'sizes', 'default']

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.map': 'application/json',
}

function sectionOf(title) {
  return title.split('/')[0].trim()
}
function componentOf(title) {
  const parts = title.split('/')
  return parts.length > 1 ? parts.slice(1).join(' / ').trim() : title.trim()
}
function rankName(name) {
  const i = NAME_RANK.indexOf((name || '').toLowerCase())
  return i < 0 ? NAME_RANK.length : i
}
// 파일명: 인덱스 접두로 유일성 보장(한글은 ASCII로 안 남아 충돌하므로) + 읽기 쉬운 슬러그.
function slug(s) {
  return (s || '').replace(/[^a-z0-9\-]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}
function fileNameFor(idx, e) {
  // component는 title에서 파생(원본 엔트리엔 없음). 영문 컴포넌트는 읽기 쉬운 접미, 한글은 인덱스만.
  const s = slug(componentOf(e.title)).slice(0, 32)
  return `${String(idx).padStart(3, '0')}${s ? '-' + s : ''}.png`
}

// 1) 스토리 인덱스 로드 + 대상 선정: title별 대표 1개(스토리 우선, 없으면 docs)
const index = JSON.parse(await readFile(resolve(STATIC, 'index.json'), 'utf8'))
const entries = Object.values(index.entries || {}).filter((e) => e.title && DS_SECTIONS.includes(sectionOf(e.title)))
const byTitle = new Map()
for (const e of entries) {
  if (!byTitle.has(e.title)) byTitle.set(e.title, [])
  byTitle.get(e.title).push(e)
}
const targets = []
for (const [title, list] of byTitle) {
  const stories = list.filter((e) => e.type === 'story').sort((a, b) => rankName(a.name) - rankName(b.name))
  const chosen = stories[0] || list.find((e) => e.type === 'docs') || list[0]
  targets.push(chosen)
}
// 섹션 순서 → 컴포넌트명 순으로 정렬(문서 배치 순서)
targets.sort((a, b) => {
  const sa = DS_SECTIONS.indexOf(sectionOf(a.title))
  const sb = DS_SECTIONS.indexOf(sectionOf(b.title))
  return sa !== sb ? sa - sb : a.title.localeCompare(b.title)
})
const selected = targets.slice(0, LIMIT)
console.log(`대상 ${selected.length}개 (전체 title ${byTitle.size})`)

// 2) 정적 서버
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const fp = resolve(STATIC, '.' + p)
    const s = await stat(fp).catch(() => null)
    if (!s || !s.isFile()) {
      res.writeHead(404)
      res.end('nf')
      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' })
    res.end(await readFile(fp))
  } catch (e) {
    res.writeHead(500)
    res.end(String(e))
  }
})
await new Promise((r) => server.listen(PORT, r))

// 3) 캡처
await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
// 2배(레티나) 페이지 + 1배 폴백 페이지 — 큰 문서 페이지가 4096px를 넘지 않도록 배율을 낮춘다.
const pageHi = await browser.newPage({ deviceScaleFactor: 2 })
const pageLo = await browser.newPage({ deviceScaleFactor: 1 })
const manifest = []
let ok = 0
let failed = 0
for (let idx = 0; idx < selected.length; idx++) {
  const e = selected[idx]
  const viewMode = e.type === 'docs' ? 'docs' : 'story'
  const url = `http://localhost:${PORT}/iframe.html?id=${encodeURIComponent(e.id)}&viewMode=${viewMode}`
  // docs 모드는 #storybook-root가 hidden이고 내용은 .sbdocs-wrapper에 렌더된다.
  const sel = viewMode === 'docs' ? '.sbdocs-wrapper' : '#storybook-root'
  const measure = async (pg) => {
    await pg.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await pg.waitForSelector(sel, { state: 'visible', timeout: 15000 })
    await pg.waitForTimeout(500)
    const el = (await pg.$(sel)) || (await pg.$('#storybook-root'))
    return { el, box: await el.boundingBox() }
  }
  try {
    const hi = await measure(pageHi)
    const box = hi.box
    if (!box || box.width < 2 || box.height < 2) throw new Error('빈 렌더')
    const maxCss = Math.max(box.width, box.height)
    let el = hi.el
    let scale = 2
    if (maxCss * 2 > MAX_PX) {
      if (maxCss > MAX_PX) throw new Error(`너무 큼(${Math.round(maxCss)}px > ${MAX_PX})`)
      const lo = await measure(pageLo) // 1배로 재캡처
      el = lo.el
      scale = 1
    }
    const file = fileNameFor(idx, e)
    const png = await el.screenshot({ type: 'png' })
    await writeFile(resolve(OUT_DIR, file), png)
    manifest.push({
      id: e.id,
      title: e.title,
      section: sectionOf(e.title),
      component: componentOf(e.title),
      name: e.name,
      viewMode,
      width: Math.round(box.width),
      height: Math.round(box.height),
      scale,
      file,
    })
    ok++
    process.stdout.write(`\r  캡처 ${ok}/${selected.length} — ${e.title}`.padEnd(80))
  } catch (err) {
    failed++
    console.log(`\n  ✗ ${e.title} (${e.id}): ${err.message}`)
  }
}
console.log('')

await browser.close()
server.close()

// 4) 매니페스트 기록(섹션 순서 유지)
const out = {
  generatedFrom: 'storybook-static',
  count: manifest.length,
  sections: DS_SECTIONS,
  snapshots: manifest,
}
await writeFile(resolve(OUT_DIR, 'snapshots.json'), JSON.stringify(out, null, 2))
console.log(`\n스냅샷 ${ok}개 저장 → packages/figma-story-tools/snapshots/ (실패 ${failed})`)
if (ok === 0) process.exit(1)
