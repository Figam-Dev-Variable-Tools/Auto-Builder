// Design-System-Hub-Tools — 메인 스레드. UI 메시지 프로토콜(P1): generate / import-remote
import { guardExisting, generateTokens, type GenerateTokensPayload } from './generators/tokens'
import {
  generateComponents,
  COMPONENT_MANIFEST,
  type ComponentManifest,
} from './generators/components'
import { generateDocs, type DocsContent } from './generators/docs'
import { generateSnapshots } from './generators/snapshots'
import { generateFoundations } from './generators/foundations'
import { resetGenerated } from './generators/reset'
import { DOCS_CONTENT } from './docs-content-data'
import { importTokens, validateTokens } from './generators/sync'
import type { PresetName, TokensJson, ColorKey } from './presets'

figma.showUI(__html__, { width: 420, height: 680 })

// 스냅샷(스토리북 복사) 기본 소스 — jsdelivr @gh (repo scripts/capture-snapshots.mjs 산출물).
const SNAPSHOT_BASE =
  'https://cdn.jsdelivr.net/gh/Figam-Dev-Variable-Tools/Design-System-Hub-Tools@main/packages/figma-story-tools/snapshots/'

type GenerateMsg = {
  type: 'generate'
  preset: PresetName
  colors: Record<ColorKey, string>
  typography: { fontFamily: string; baseSize: number; scale: number }
  social: string[]
  charts: boolean
  reset: boolean
  scope: {
    tokens: boolean
    designSystem: boolean
    icons: boolean
    components: boolean
    snapshots: boolean
    docs?: boolean
  }
}

type UiMsg = GenerateMsg | { type: 'import-remote'; url: string }

// 문서 선언은 소스에 임베드된 기본값(DOCS_CONTENT)을 쓴다 → 원격 로드 없이도 문서 페이지 생성.
// 원격 URL 로드 시 아래 값이 교체된다.
let loadedDocsContent: DocsContent = DOCS_CONTENT
let loadedManifest: ComponentManifest | null = null

const status = (level: 'info' | 'warn' | 'error', message: string) =>
  figma.ui.postMessage({ type: 'status', level, message })

async function handleGenerate(msg: GenerateMsg) {
  // P1 완료 조건: 페이로드 콘솔 출력
  console.log('generate payload:', msg)

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
    const result = await generateTokens(payload)
    result.warnings.forEach((w) => status('warn', w))
    status('info', 'Variables 컬렉션 3개 + Text Styles 4종 생성 완료.')
  }

  if (msg.scope.designSystem || msg.scope.icons) {
    try {
      const warnings = await generateFoundations({
        fontFamily: msg.typography.fontFamily,
        designSystem: msg.scope.designSystem,
        icons: msg.scope.icons,
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

  if (msg.scope.components) {
    try {
      const warnings = await generateComponents({
        preset: msg.preset,
        social: msg.social,
        charts: msg.charts,
        manifest: loadedManifest ?? COMPONENT_MANIFEST,
      })
      warnings.forEach((w) => status('warn', w))
      status('info', "'2. 컴포넌트' 페이지에 DS 컴포넌트 생성 완료.")
    } catch (e) {
      status('error', e instanceof Error ? e.message : String(e))
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
  if (obj && Array.isArray(obj.components)) {
    loadedManifest = parsed as ComponentManifest
    status('info', `${sourceLabel}: 컴포넌트 매니페스트 로드 완료 (컴포넌트 생성에 사용).`)
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
