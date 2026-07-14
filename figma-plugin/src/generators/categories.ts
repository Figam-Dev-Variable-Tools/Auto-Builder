// 컴포넌트 카테고리 문서 — 오케스트레이터.
// 렌더러·카테고리 정의는 categories-{core,nav-overlay,data-kr-media}.ts로 분리했다(파일당 5천 줄은 못 읽는다).
// 이 파일은 페이지 목록·생성 루프만 들고 있는다. 공개 표면(generateCategories·CATEGORY_PAGE_NAMES)은 그대로다.
import { type PresetName } from '../presets'
import { ACTION_CATEGORY, FEEDBACK_CATEGORY, INPUT_CATEGORY, SELECTION_CATEGORY } from './categories-core'
import { DATA_CATEGORY, DATETIME_CATEGORY, ETC_CATEGORY, KR_CATEGORY, MEDIA_CATEGORY, TEMPLATES_CATEGORY } from './categories-data-kr-media'
import { LAYOUT_CATEGORY, NAVIGATION_CATEGORY, OVERLAY_CATEGORY, STRUCTURE_CATEGORY } from './categories-nav-overlay'
import { PAGE_ACTION, PAGE_DATA, PAGE_DATETIME, PAGE_ETC, PAGE_FEEDBACK, PAGE_INPUT, PAGE_KR, PAGE_LAYOUT, PAGE_MEDIA, PAGE_NAV, PAGE_OVERLAY, PAGE_SELECTION, PAGE_STRUCTURE, PAGE_TEMPLATES } from './categories-shared'
import { applyPageColorMode, bindTokens, makeHeader, makeRoot, makeSection, placeRoot, setup } from './foundations'
import { variantItem } from './lib/build-set'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 절취선은 하이픈 라인.
const DIVIDER_PAGE = '---------------------------'
// 컴포넌트 세트는 별도 소스 페이지 없이 각 카테고리 페이지에 함께 둔다.
// 레거시 이름들은 reset 정리용으로만 남긴다(생성하지 않음).
export const CATEGORY_PAGE_NAMES = [
  DIVIDER_PAGE,
  PAGE_INPUT,
  PAGE_SELECTION,
  PAGE_ACTION,
  PAGE_FEEDBACK,
  PAGE_NAV,
  PAGE_LAYOUT,
  PAGE_OVERLAY,
  PAGE_DATA,
  PAGE_STRUCTURE,
  PAGE_DATETIME,
  PAGE_KR,
  PAGE_TEMPLATES,
  PAGE_MEDIA,
  PAGE_ETC,
  // 레거시 페이지명(reset 정리용)
  '11. System - KR',
  '12. System - Templates',
  '13. System - Media',
  'DS · 컴포넌트 소스',
  'Input',
  'Selection',
  'Action',
  '1. Molecule - Input',
  '2. Atom - Selection',
  '3. Atom - Action',
  '✂ ─────────  컴포넌트  ─────────',
]
// 오너: 생성 컴포넌트의 보더·마진(패딩/간격)·라운드를 값이 맞는 변수에 후처리 바인딩.
// (정본은 lib/bind.ts — 예전엔 admin.ts·layout-guide.ts·screens.ts·site.ts·site-screens.ts와
// 합쳐 6벌로 복제돼 있었다. verify-bindings B4.)

const ALL_CATEGORIES = [
  INPUT_CATEGORY,
  SELECTION_CATEGORY,
  ACTION_CATEGORY,
  FEEDBACK_CATEGORY,
  NAVIGATION_CATEGORY,
  LAYOUT_CATEGORY,
  OVERLAY_CATEGORY,
  DATA_CATEGORY,
  STRUCTURE_CATEGORY,
  DATETIME_CATEGORY,
  KR_CATEGORY,
  MEDIA_CATEGORY,
  TEMPLATES_CATEGORY,
  ETC_CATEGORY,
]

// ── 카테고리 생성 ────────────────────────────────────────────────────
export async function generateCategories(fontFamily: string, colors?: Record<string, string>, preset?: PresetName): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push('Icon System 페이지가 없어 아이콘이 인라인 폴백됩니다 — 아이콘 스왑을 쓰려면 Icon System도 함께 생성하세요.')
  }

  // 절취선(구분) 페이지 — 파운데이션과 컴포넌트 카테고리 사이. 페이지 목록에서 시각적 구분자.
  if (!figma.root.children.some((p) => p.name === DIVIDER_PAGE)) {
    const div = figma.createPage()
    div.name = DIVIDER_PAGE
  }

  for (const cat of ALL_CATEGORIES) {
    if (figma.root.children.some((p) => p.name === cat.pageName)) {
      ctx.warnings.push(`페이지 '${cat.pageName}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
      continue
    }
    const page = figma.createPage()
    page.name = cat.pageName
    applyPageColorMode(ctx, page)

    // 컴포넌트 세트(편집 소스)를 페이지에 만든다(문서 오른쪽 x≥1360). 문서엔 인스턴스를 배치.
    const sets = new Map<string, ComponentSetNode>()
    let sy = 200
    for (const doc of cat.docs) {
      try {
        const set = doc.build(ctx, page)
        set.x = 1360
        set.y = sy
        sy += set.height + 48
        bindTokens(ctx, set) // 보더·마진·라운드 변수 바인딩
        sets.set(doc.setName, set)
      } catch (e) {
        ctx.warnings.push(`${doc.setName} 세트 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    const root = makeRoot(ctx, cat.title)
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
  }
  return ctx.warnings
}
