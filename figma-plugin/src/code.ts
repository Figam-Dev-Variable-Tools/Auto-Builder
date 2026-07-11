// Design-System-Hub-Tools — 메인 스레드. UI 메시지 프로토콜(P1): generate / import-remote
import { guardExisting, generateTokens, type GenerateTokensPayload } from './generators/tokens'
import {
  generateComponents,
  COMPONENT_MANIFEST,
  type ComponentManifest,
} from './generators/components'
import { generateDocs, type DocsContent } from './generators/docs'
import { importTokens, validateTokens } from './generators/sync'
import type { PresetName, TokensJson, ColorKey } from './presets'

figma.showUI(__html__, { width: 420, height: 680 })

type GenerateMsg = {
  type: 'generate'
  preset: PresetName
  colors: Record<ColorKey, string>
  typography: { fontFamily: string; baseSize: number; scale: number }
  social: string[]
  charts: boolean
  scope: { tokens: boolean; components: boolean; docs: boolean }
}

type UiMsg = GenerateMsg | { type: 'import-remote'; url: string }

// 원격/파일로 로드된 자산 (Stage C: 컴포넌트 매니페스트 URL 임포트 대비)
let loadedDocsContent: DocsContent | null = null
let loadedManifest: ComponentManifest | null = null

const status = (level: 'info' | 'warn' | 'error', message: string) =>
  figma.ui.postMessage({ type: 'status', level, message })

async function handleGenerate(msg: GenerateMsg) {
  // P1 완료 조건: 페이로드 콘솔 출력
  console.log('generate payload:', msg)

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

  if (msg.scope.docs) {
    if (!loadedDocsContent) {
      status(
        'warn',
        'docs-content.json이 로드되지 않아 문서 페이지를 건너뜁니다 — [가져오기]로 docs/docs-content.json을 로드한 뒤 다시 실행하세요.',
      )
    } else {
      try {
        const { warnings, skipped } = await generateDocs(loadedDocsContent)
        warnings.forEach((w) => status('warn', w))
        if (skipped.length > 0) status('warn', `skipped: ${skipped.join(', ')}`)
        status('info', '문서 페이지 생성 완료.')
      } catch (e) {
        status('error', e instanceof Error ? e.message : String(e))
      }
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
