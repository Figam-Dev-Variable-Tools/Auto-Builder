// 베리언트 세트 빌더 + 컴포넌트 속성 헬퍼 — **유일한 정본**.
//
// 왜 여기 한 벌만 두는가: 이 헬퍼들은 categories.ts·admin.ts·site.ts에 각각 복붙돼 3벌로 살아 있었다.
// 그래서 네이밍 규약 위반(대표적으로 `Show <prop>` 유령 불리언 자동생성)을 한 파일에서 고쳐도
// 나머지 두 벌이 계속 재생산했다. 규칙을 한 번만 강제하려면 선언도 한 곳에만 있어야 한다.
//
// 5번째 사본 금지: generators/ 안에서 이 파일 밖의 `buildSet|addTextProp|addBoolProp|addSwapProp|propKeys`
// 최상위 함수 선언은 verify-naming이 E-HELPER-COPY로 실패시킨다
// (구현: scripts/lib/figma-sets.mjs의 assertNoHelperCopies).
// 생성기별로 다른 동작이 필요하면 사본을 만들지 말고 옵션 파라미터로 흡수하라.
import { type Ctx, solid } from '../foundations'
import { ICON_COMPONENTS } from '../icon-vec'

export type Axis = { name: string; values: string[] }
export type TextProp = { prop: string; layer: string; def: string }
/**
 * 문서에 배치할 변형 하나(인스턴스 + 캡션). categories/admin이 글자 단위로 같은 선언을 갖고 있었다.
 * categories가 4개 파일로 쪼개지면서 진짜로 공유가 필요해졌다 — 그래서 여기로 올린다.
 * (site.ts는 texts/swaps/backdrop이 붙은 확장판을 쓰므로 그쪽은 로컬 유지한다.)
 */
export type State = { caption: string; props: Record<string, string> }
export type PropSpec = {
  texts?: TextProp[]
  bools?: Array<{ prop: string; layer: string; def: boolean }>
  swaps?: Array<{ prop: string; layer: string; defKey: string }>
}

// ── 컴포넌트 속성(속성 만들기) 헬퍼 ──────────────────────────────────
// 레이어 name과 layer가 정확히 같아야 붙는다. 실패는 조용히 무시된다.
export function addTextProp(set: ComponentSetNode, prop: string, layer: string, def: string) {
  try {
    const id = set.addComponentProperty(prop, 'TEXT', def)
    for (const n of set.findAll((x) => x.type === 'TEXT' && x.name === layer)) {
      ;(n as TextNode).componentPropertyReferences = { ...(n.componentPropertyReferences || {}), characters: id }
    }
  } catch {
    /* 이미 있거나 대상 없음 */
  }
}

export function addBoolProp(set: ComponentSetNode, prop: string, layer: string, def: boolean) {
  try {
    const id = set.addComponentProperty(prop, 'BOOLEAN', def)
    for (const n of set.findAll((x) => x.name === layer)) {
      n.componentPropertyReferences = { ...(n.componentPropertyReferences || {}), visible: id }
    }
  } catch {
    /* skip */
  }
}

export function addSwapProp(set: ComponentSetNode, prop: string, layer: string, defKey: string) {
  const comp = ICON_COMPONENTS.get(defKey)
  if (!comp) return
  try {
    const id = set.addComponentProperty(prop, 'INSTANCE_SWAP', comp.id)
    for (const n of set.findAll((x) => x.type === 'INSTANCE' && x.name === layer)) {
      ;(n as InstanceNode).componentPropertyReferences = { ...(n.componentPropertyReferences || {}), mainComponent: id }
    }
  } catch {
    /* skip */
  }
}

/**
 * 표시 이름 → setProperties가 요구하는 전체 키('Title#12:3').
 * TEXT·BOOLEAN·INSTANCE_SWAP 속성은 이 전체 키가 있어야 먹는다(베리언트 축만 이름 그대로).
 */
export function propKeys(set: ComponentSetNode): Record<string, string> {
  const map: Record<string, string> = {}
  try {
    for (const key of Object.keys(set.componentPropertyDefinitions)) map[key.split('#')[0]] = key
  } catch {
    /* 세트가 없거나 속성 없음 */
  }
  return map
}

// ── 제네릭 베리언트 세트 빌더 ────────────────────────────────────────
// 세트는 페이지에 만들고(소스), 문서에는 인스턴스를 배치한다
// (오토레이아웃 안에 세트를 직접 배치하면 Figma에서 오작동한다).
export function buildSet(
  ctx: Ctx,
  page: PageNode,
  setName: string,
  axes: Axis[],
  render: (combo: Record<string, string>) => ComponentNode,
  props?: PropSpec,
): ComponentSetNode {
  let combos: Record<string, string>[] = [{}]
  for (const axis of axes) {
    const next: Record<string, string>[] = []
    for (const c of combos) for (const v of axis.values) next.push({ ...c, [axis.name]: v })
    combos = next
  }
  const variants = combos.map((combo) => {
    const comp = render(combo)
    comp.name = axes.map((a) => `${a.name}=${combo[a.name]}`).join(', ')
    page.appendChild(comp)
    return comp
  })
  const set = figma.combineAsVariants(variants, page)
  set.name = setName
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 20
  set.counterAxisSpacing = 20
  set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24
  set.fills = [solid('#FBFCFE')]

  // 속성 만들기: 텍스트·불리언·인스턴스 스왑
  if (props) {
    // TEXT마다 `Show <prop>` 불리언을 자동 생성하지 않는다 — 대응하는 React prop이 없는 "유령 속성"이라
    // 규약 §3(BOOLEAN 이름 = show* prop 이름 그대로)을 기계적으로 위반한다. 텍스트 on/off가 필요하면
    // 코드에 show* prop을 만들고 props.bools에 명시적으로 선언하라.
    // 정본이 한 곳뿐이므로 이 규칙도 이제 한 번만 강제하면 된다.
    props.texts?.forEach((t) => addTextProp(set, t.prop, t.layer, t.def))
    props.bools?.forEach((b) => addBoolProp(set, b.prop, b.layer, b.def))
    props.swaps?.forEach((s) => addSwapProp(set, s.prop, s.layer, s.defKey))
  }
  return set
}
