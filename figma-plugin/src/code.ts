// Design-System-Hub-Tools — 메인 스레드. UI 메시지 프로토콜(P1): generate / import-remote
import { guardExisting, generateTokens, type GenerateTokensPayload } from './generators/tokens'
import { generateDocs, type DocsContent } from './generators/docs'
import { generateSnapshots } from './generators/snapshots'
import { generateFoundations } from './generators/foundations'
import { generateCategories } from './generators/categories'
import { generateAdmin } from './generators/admin'
import { generateLayoutGuide } from './generators/layout-guide'
import { generateScreens } from './generators/screens'
import { generateSite } from './generators/site'
import { generateSiteScreens } from './generators/site-screens'
import { resetGenerated } from './generators/reset'
import { DOCS_CONTENT } from './docs-content-data'
import { importTokens, validateTokens } from './generators/sync'
import type { PresetName, TokensJson, ColorKey } from './presets'

figma.showUI(__html__, { width: 420, height: 680 })

// 실행 중인 빌드 식별자 — 옛 dist가 실행되는 사고를 눈으로 잡기 위해 시작 시 상태창에 찍는다.
const BUILD_TAG = 'build 2026-07-13 · site'

// 스냅샷(스토리북 복사) 기본 소스 — jsdelivr @gh (repo scripts/capture-snapshots.mjs 산출물).
const SNAPSHOT_BASE =
  'https://cdn.jsdelivr.net/gh/Figam-Dev-Variable-Tools/Design-System-Hub-Tools@main/packages/figma-story-tools/snapshots/'

type GenerateMsg = {
  type: 'generate'
  preset: PresetName
  colors: Record<ColorKey, string>
  typography: { fontFamily: string; baseSize: number; scale: number }
  reset: boolean
  scope: {
    tokens: boolean
    designSystem: boolean
    icons: boolean
    categories: boolean
    // 어드민 4종 — 옛 UI(체크박스 없는 dist)가 보낸 메시지도 undefined=false로 안전히 흘러가도록 optional.
    admin?: boolean
    screens?: boolean
    layout?: boolean
    // 프론트(사이트) 2종 — 위와 같은 이유로 optional.
    site?: boolean
    siteScreens?: boolean
    snapshots: boolean
    docs?: boolean
  }
}

type UiMsg = GenerateMsg | { type: 'import-remote'; url: string }

// 문서 선언은 소스에 임베드된 기본값(DOCS_CONTENT)을 쓴다 → 원격 로드 없이도 문서 페이지 생성.
// 원격 URL 로드 시 아래 값이 교체된다.
let loadedDocsContent: DocsContent = DOCS_CONTENT

const status = (level: 'info' | 'warn' | 'error', message: string) =>
  figma.ui.postMessage({ type: 'status', level, message })

async function handleGenerate(msg: GenerateMsg) {
  // P1 완료 조건: 페이로드 콘솔 출력
  console.log('generate payload:', msg)
  status('info', BUILD_TAG)

  // 재생성: 기존 DS 결과(컬렉션·스타일·페이지)를 먼저 삭제해 §0-15 가드 충돌 없이 덮어쓴다.
  if (msg.reset) {
    try {
      const notes = await resetGenerated(loadedDocsContent)
      notes.forEach((n) => status('info', `재생성: ${n}`))
    } catch (e) {
      status('error', `재생성 실패: ${e instanceof Error ? e.message : String(e)}`)
      return
    }
  }

  if (msg.scope.tokens) {
    const guard = await guardExisting()
    if (guard) {
      status('error', guard)
      return
    }
    const payload: GenerateTokensPayload = {
      preset: msg.preset,
      colors: msg.colors,
      typography: msg.typography,
    }
    try {
      const result = await generateTokens(payload)
      result.warnings.forEach((w) => status('warn', w))
      status('info', 'Variables 3컬렉션(색+팔레트 10단 셰이드·타이포·간격/보더) + Text Styles 생성 완료.')
    } catch (e) {
      // 토큰 실패는 치명적이지 않게 — 뒤의 파운데이션/컴포넌트 페이지는 계속 생성한다.
      status('error', `토큰 생성 실패(페이지는 계속 진행): ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (msg.scope.designSystem || msg.scope.icons) {
    try {
      const warnings = await generateFoundations({
        fontFamily: msg.typography.fontFamily,
        colors: msg.colors,
        designSystem: msg.scope.designSystem,
        icons: msg.scope.icons,
        preset: msg.preset,
      })
      warnings.forEach((w) => status('warn', w))
      const made = [msg.scope.designSystem && 'Design System', msg.scope.icons && 'Icon System']
        .filter(Boolean)
        .join(' · ')
      status('info', `파운데이션 페이지 생성 완료 (${made}).`)
    } catch (e) {
      status('error', `파운데이션 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (msg.scope.categories) {
    try {
      status('info', '컴포넌트 카테고리 — 네이티브 컴포넌트 세트(베리언트) + 문서 생성 중…')
      const warnings = await generateCategories(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', '카테고리 페이지 생성 완료 (Input~Date & Time · Korea Templates · Media · Templates · ETC(소셜/OAuth)).')
    } catch (e) {
      status('error', `카테고리 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // ── 생성 순서 계약 ────────────────────────────────────────────────
  // 화면(17 Admin Pages · siteScreens)은 컴포넌트 세트(15 Admin Component · 18 Client Pages)의
  // **인스턴스로 조립**된다. 오너 확정(2026-07 개편)으로 siteScreens는 더 이상 별도 페이지(옛 19번)를
  // 만들지 않고 18에 이어 그린다 — 그래도 site(18) 블록 뒤에 돌아야 하는 건 그대로다.
  // 따라서 반드시 컴포넌트 → 화면 순으로 돌려야 한다(아래 블록 순서 = 15 → 16 → 17 → 18 → siteScreens).
  // 순서를 바꾸면 세트가 아직 없어 화면이 직접 그리기로 내려가고, 컴포넌트 수정이 화면에 전파되지 않는다.
  // 화면 스코프만 켠 경우엔 기존 페이지에서 세트를 입양하지만, 그것도 없으면 직접 그리므로 미리 알린다.
  if (msg.scope.screens && !msg.scope.admin) {
    status(
      'warn',
      "'어드민 화면'만 선택됐습니다 — '어드민 컴포넌트'를 함께 켜면 화면이 컴포넌트 인스턴스로 조립됩니다(세트가 없으면 직접 그립니다).",
    )
  }
  if (msg.scope.siteScreens && !msg.scope.site) {
    status(
      'warn',
      "'프론트 화면'만 선택됐습니다 — '프론트 컴포넌트'를 함께 켜면 화면이 컴포넌트 인스턴스로 조립됩니다(세트가 없으면 직접 그립니다).",
    )
  }

  // 어드민 3종. 페이지 번호 순(Admin Component 15 → Layout 16 → Admin Pages 17)으로 돌려 탭이 순번대로 쌓이게 한다.
  // 각각 독립 try/catch — 하나가 죽어도 나머지 스코프는 계속 생성한다.
  if (msg.scope.admin) {
    try {
      status('info', '어드민 컴포넌트 — 컴포넌트 세트(베리언트) + 문서 생성 중…')
      const warnings = await generateAdmin(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', "'15. System - Admin Component' 페이지 생성 완료.")
    } catch (e) {
      status('error', `어드민 컴포넌트 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (msg.scope.layout) {
    try {
      status('info', '레이아웃 가이드 — 화면 골격 치수 가이드 생성 중…')
      const warnings = await generateLayoutGuide(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', "'16. System - Layout' 페이지 생성 완료.")
    } catch (e) {
      status('error', `레이아웃 가이드 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 17은 15의 세트를 인스턴스로 조립한다 → 위 admin 블록 뒤에 와야 한다.
  if (msg.scope.screens) {
    try {
      status('info', '어드민 화면 14종 — 컴포넌트 인스턴스로 조립 중… 시간이 걸립니다.')
      const warnings = await generateScreens(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', "'17. System - Admin Pages' 페이지 생성 완료 (14화면).")
    } catch (e) {
      status('error', `어드민 화면 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 프론트(사이트) 2종. 오너 확정(2026-07 개편)으로 SortBar·InfoCard 세트는 15(Admin Component)에,
  // 화면 5종은 별도 페이지 없이 18에 이어 그린다 — 그래도 site → siteScreens 순서는 그대로 지킨다.
  // 각각 독립 try/catch — 하나가 죽어도 나머지 스코프는 계속 생성한다.
  if (msg.scope.site) {
    try {
      status('info', '프론트 컴포넌트 — 컴포넌트 세트(베리언트) + 문서 생성 중…')
      const warnings = await generateSite(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', "'18. System - Client Pages' 페이지 생성 완료.")
    } catch (e) {
      status('error', `프론트 컴포넌트 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 화면은 18의 세트를 인스턴스로 조립하고, 18페이지에 바로 이어 그린다 → 위 site 블록 뒤에 와야 한다.
  if (msg.scope.siteScreens) {
    try {
      status('info', '프론트 화면 5종 — 컴포넌트 인스턴스로 조립 중… 시간이 걸립니다.')
      const warnings = await generateSiteScreens(msg.typography.fontFamily, msg.colors, msg.preset)
      warnings.forEach((w) => status('warn', w))
      status('info', "'18. System - Client Pages'에 프론트 화면 5종 추가 완료.")
    } catch (e) {
      status('error', `프론트 화면 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (msg.scope.snapshots) {
    try {
      status('info', '스냅샷(스토리북 복사) 가져오는 중… 이미지 수십 개 다운로드로 시간이 걸립니다.')
      const warnings = await generateSnapshots(SNAPSHOT_BASE)
      warnings.forEach((w) => status('warn', w))
      status('info', '스냅샷 페이지 생성 완료 — 섹션별로 스토리북 UI가 이미지로 배치됩니다.')
    } catch (e) {
      status('error', `스냅샷 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // (레거시) 하드코딩 문서 미러 — 기본 UI에서는 스냅샷으로 대체됨. scope.docs가 명시될 때만 실행.
  if (msg.scope.docs) {
    try {
      const { warnings, skipped } = await generateDocs(loadedDocsContent)
      warnings.forEach((w) => status('warn', w))
      if (skipped.length > 0) status('warn', `skipped: ${skipped.join(', ')}`)
      status('info', '문서 페이지 생성 완료.')
    } catch (e) {
      status('error', e instanceof Error ? e.message : String(e))
    }
  }
  status('info', '생성 작업 종료.')
}

function handleLoadedJson(parsed: unknown, sourceLabel: string) {
  const obj = parsed as Record<string, unknown>
  if (obj && Array.isArray(obj.sections)) {
    loadedDocsContent = parsed as DocsContent
    status('info', `${sourceLabel}: docs-content.json 로드 완료 (문서 페이지 생성에 사용).`)
    return
  }
  // 컴포넌트 매니페스트(components[])는 더 이상 받지 않는다 — 그 매니페스트로 그리던 생성기가 삭제됐다.
  // 예전엔 로드해 두고 "생성에 사용"이라 알렸지만 실제로는 아무 데도 쓰이지 않는 거짓 안내였다.
  if (obj && Array.isArray(obj.components)) {
    status('warn', `${sourceLabel}: 컴포넌트 매니페스트는 더 이상 쓰이지 않습니다 — Figma 컴포넌트의 정본은 '컴포넌트' 스코프(카테고리 페이지)입니다.`)
    return
  }
  const errors = validateTokens(parsed)
  if (errors.length > 0) {
    status('error', `${sourceLabel}: 스키마 검증 실패 —\n${errors.join('\n')}`)
    return
  }
  importTokens(parsed as TokensJson)
    .then((notes) => notes.forEach((n) => status('info', `${sourceLabel}: ${n}`)))
    .catch((e) => status('error', `${sourceLabel}: ${e instanceof Error ? e.message : String(e)}`))
}

figma.ui.onmessage = async (msg: UiMsg) => {
  try {
    switch (msg.type) {
      case 'generate':
        await handleGenerate(msg)
        break
      case 'import-remote': {
        try {
          const res = await fetch(msg.url)
          if (!res.ok) {
            status('error', `원격: HTTP ${res.status}`)
            return
          }
          handleLoadedJson(await res.json(), '원격')
        } catch (e) {
          status('error', `원격 fetch 실패: ${e instanceof Error ? e.message : String(e)}`)
        }
        break
      }
    }
  } catch (e) {
    status('error', e instanceof Error ? e.message : String(e))
  }
}
