// 재생성(덮어쓰기) — 플러그인이 만든 Variable 컬렉션·DS Text Style·페이지를 삭제한다.
// UI '기존 삭제 후 재생성' 체크 시에만 실행되는 파괴적 작업(기본 off). §0-15 가드가 막던
// "이미 존재: DS Color …" 재실행 마찰을 오너 동의 하에 해소하는 유일한 경로.
import { COLLECTION_NAMES } from './tokens'
import { COMPONENT_PAGE_NAMES } from './components'
import { FOUNDATION_PAGE_NAMES } from './foundations'
import type { DocsContent } from './docs'

export async function resetGenerated(docsContent: DocsContent): Promise<string[]> {
  const notes: string[] = []

  // 1) Variable 컬렉션 (DS Color / DS Typography / DS Radius·Spacing)
  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  let colN = 0
  for (const c of cols) {
    if (COLLECTION_NAMES.indexOf(c.name) >= 0) {
      c.remove()
      colN++
    }
  }
  if (colN) notes.push(`Variable 컬렉션 ${colN}개 삭제`)

  // 2) DS/* Text Style
  const styles = await figma.getLocalTextStylesAsync()
  let stN = 0
  for (const s of styles) {
    if (s.name.indexOf('DS/') === 0) {
      s.remove()
      stN++
    }
  }
  if (stN) notes.push(`Text Style ${stN}개 삭제`)

  // 3) 페이지(컴포넌트 + 문서). Figma는 최소 1페이지 필요 → 마지막 페이지는 남긴다.
  const targets = new Set<string>([...COMPONENT_PAGE_NAMES, ...FOUNDATION_PAGE_NAMES])
  for (const s of docsContent.sections) targets.add(`${s.order}. ${s.title}`)
  let pgN = 0
  for (const p of [...figma.root.children]) {
    if (!targets.has(p.name)) continue
    if (figma.root.children.length <= 1) break // 마지막 페이지 보존
    // 현재 페이지는 바로 삭제 불가 → 다른 페이지로 전환 후 삭제
    if (p.id === figma.currentPage.id) {
      const other = figma.root.children.find((x) => x.id !== p.id)
      if (other) await figma.setCurrentPageAsync(other)
    }
    p.remove()
    pgN++
  }
  if (pgN) notes.push(`페이지 ${pgN}개 삭제`)

  return notes.length ? notes : ['삭제할 기존 결과 없음']
}
