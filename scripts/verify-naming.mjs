// verify-naming — 네이밍 파리티 게이트. **코드가 단일 출처**, Figma가 그대로 따른다.
//
// 원칙 3개(설계서 §0):
//  1. 변환하지 않는다. camelCase→"Title Case" 정규화 함수를 넣지 않는다. 비교는 문자열 정확 일치다.
//     (이름 짝을 "추측"하는 건 오직 리포트 문구를 친절하게 만들 때뿐 — 통과 판정에는 쓰지 않는다.)
//  2. 검사 대상은 실물이다. components.ts의 COMPONENT_MANIFEST는 generateComponents가 호출되지
//     않는 그림자 선언이므로 보지 않는다. 정본 생성기의 buildSet 선언만 본다.
//  3. 못 읽으면 실패다. 파싱 실패를 continue로 넘기지 않는다(E-UNPARSED / E-COVERAGE).
//
// 규약 N1~N7은 docs/naming-parity.md 참조.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFigmaSets } from './lib/figma-sets.mjs'
import { indexComponents, parsePropsAt, classifyProps } from './lib/ds-props.mjs'
import { legalLayers, STRUCTURAL_LAYERS } from './lib/css-classes.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE_PATH = join(root, 'scripts', '.naming-baseline.json')

// ── 예외 선언 ────────────────────────────────────────────────────────
// 예외는 여기만. 사유·소유자 없이 추가 금지. 항목이 더 이상 위반이 아니면 CI가 stale로 실패시킨다.
// 매칭 키: component | kind | figma (+code 선택). 와일드카드 금지 — 정확 일치만.
const ALLOWLIST = [
  // 코드 짝이 없는 Figma 전용 합성 세트 — React 컴포넌트가 아니라 문서/화면용 조립 샘플이다.
  // 이름 규약은 "코드 이름을 따른다"인데 따를 코드가 없으므로 N1(no-code)만 면제하고,
  // 나머지 규칙(N3 유령 불리언 등)은 그대로 적용된다.
  // 주의: 여기에 컴포넌트를 만들면 이 예외는 자동으로 stale이 되어 CI가 지우라고 실패시킨다.
  ...['DS/AdminSidebar', 'DS/InquiryForm', 'DS/InfoCard'].map((set) => ({
    component: set.replace(/^DS\//, ''),
    kind: 'no-code',
    figma: set,
    reason: 'Figma 전용 합성 세트 — 대응 React 컴포넌트가 없다(문서/화면 샘플용).',
    owner: 'sb.hong',
  })),

  // 접근성 이름(aria-label) — Figma TEXT 속성은 **텍스트 레이어에 바인딩**되어야 존재할 수 있는데
  // (buildSet의 texts: { prop, layer, def }), 접근성 이름은 화면에 글자로 그려지지 않아 바인딩할
  // 레이어 자체가 없다. 그래서 이 string prop들은 Figma 속성으로 표현이 **불가능**하다.
  // 문구를 하드코딩으로 되돌리는 것이 유일한 대안이므로(§0-1 위반) 예외로 둔다.
  ...[
    ['SearchField', 'ariaLabel'], // 라벨 없는 검색 입력의 이름(툴바·필터바)
    ['SearchField', 'clearLabel'], // × 버튼의 이름
    ['Select', 'ariaLabel'], // 라벨 없는 트리거의 이름
    ['Chip', 'removeLabel'], // × 버튼의 이름
    ['DropZone', 'labels.upload'], // 드롭 영역(role=button)의 이름
    ['DropZone', 'labels.uploadMultiple'],
  ].map(([component, code]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: '접근성 이름 — 그려지는 글자가 아니라 바인딩할 텍스트 레이어가 없다(Figma 속성으로 표현 불가).',
    owner: 'sb.hong',
  })),

  // DS/CategoryTabs 생성기가 스스로 밝힌 범위: "추가·삭제 입력은 문서화 범위 밖 — Figma는 정적 세트다".
  // 그 UI가 Figma에 없으므로 그 문구를 담을 TEXT 속성도 없다. 결정을 존중해 코드 쪽만 문구를 연다(§0-4).
  ...['labels.add', 'labels.addPlaceholder', 'labels.addField'].map((code) => ({
    component: 'CategoryTabs',
    kind: 'text-missing',
    figma: null,
    code,
    reason: 'Figma DS/CategoryTabs는 정적 세트다 — 카테고리 추가 입력 UI 자체가 문서화 범위 밖이다.',
    owner: 'sb.hong',
  })),

  // ══ B5 사이트(공개 페이지) 세트 — figma-plugin/src/generators/site.ts ══════════════
  // 공통 배경: Figma의 컴포넌트 속성 타입은 VARIANT / TEXT / BOOLEAN / INSTANCE_SWAP 넷뿐이고,
  // 이 플러그인에서 INSTANCE_SWAP의 기본값이 될 수 있는 컴포넌트는 아이콘뿐이다
  // (lib/build-set.ts의 addSwapProp: defKey → ICON_COMPONENTS.get). 그래서 '노드 슬롯'(ReactNode)과
  // number·이미지 URL을 담을 그릇이 아예 없다. 아래 예외는 전부 그 한계에서 나온 것이고,
  // 표현이 가능한 것(축·불리언·아이콘 스왑)은 예외를 쓰지 않고 site.ts에 실제로 구현했다.
  // 이름은 전부 코드 prop 이름으로 맞춰 두었다 — 임의 이름(Brand·Title·Price·Count)은 남아 있지 않다.

  // (1) ReactNode 슬롯이지만 세트가 그리는 실체는 '텍스트 레이어 하나'다 → TEXT로 열되 이름은 prop 그대로.
  //     같은 prop이 swap-missing으로도 잡히므로 짝으로 함께 면제한다.
  ...[
    ['SiteHeader', 'brand'], // 워드마크 'SPACE PLANNING'
    ['SiteFooter', 'brand'],
    ['SiteSection', 'title'], // 대형 헤드라인(코드가 ReactNode인 건 <Highlight>로 일부만 강조하려고)
    ['SiteSection', 'subtitle'],
  ].flatMap(([component, code]) => [
    {
      component,
      kind: 'text-extra',
      figma: code,
      reason:
        'ReactNode 슬롯이지만 세트가 그리는 실체는 텍스트 레이어 하나다 — TEXT 속성이 유일하게 쓸모 있는 표현이다(INSTANCE_SWAP 기본값은 아이콘 컴포넌트만 가능). 이름은 코드 prop 그대로다.',
      owner: 'sb.hong',
    },
    {
      component,
      kind: 'swap-missing',
      figma: null,
      code,
      reason:
        '위 text-extra와 같은 prop이다 — 아이콘만 기본값으로 받을 수 있는 INSTANCE_SWAP으로는 워드마크·헤드라인을 표현할 수 없어 TEXT 속성(같은 이름)으로 열었다.',
      owner: 'sb.hong',
    },
  ]),

  // (2) number prop — Figma에 숫자 속성 타입이 없다. 포맷된 문자열을 TEXT로 열되 이름은 prop 그대로.
  //     classifyProps가 number를 text로 분류하지 않으므로 구조적으로 text-extra가 된다.
  ...[
    ['ProductCard', 'price'], // "38,000원" / "₩38,000"
    ['SortBar', 'total'], // "6개"
  ].map(([component, figma]) => ({
    component,
    kind: 'text-extra',
    figma,
    reason:
      'number prop — Figma에 숫자 속성 타입이 없어 포맷된 문자열을 TEXT로 연다(이름은 코드 prop 그대로). 속성을 지우면 인스턴스마다 값을 바꿀 수단이 사라진다.',
    owner: 'sb.hong',
  })),

  // (3) ReactNode 액션 슬롯 — 버튼·Select 등 '조립된 UI'가 들어온다.
  //     아이콘 기본값만 가능한 INSTANCE_SWAP으로는 표현할 수 없고, TEXT로 열면 슬롯이 아니라
  //     버튼 라벨을 고치는 거짓 속성이 된다(예전 'Action' TEXT가 정확히 그 실수였다 — 지웠다).
  ...[
    ['SiteHeader', 'actions'],
    ['SiteSection', 'actions'],
    ['SortBar', 'actions'],
    ['SortBar', 'leadingActions'],
  ].map(([component, code]) => ({
    component,
    kind: 'swap-missing',
    figma: null,
    code,
    reason:
      'ReactNode 액션 슬롯(버튼·Select 등이 들어온다). INSTANCE_SWAP 기본값은 아이콘 컴포넌트만 가능해(addSwapProp: defKey → ICON_COMPONENTS) 버튼 슬롯을 담을 수 없다 — TEXT로 여는 것은 슬롯이 아니라 라벨을 고치는 거짓 속성이다.',
    owner: 'sb.hong',
  })),

  // (4) 축이 될 prop이 하나도 없는 단일 컴포넌트 — Figma 세트는 베리언트 속성이 최소 1개 있어야 성립한다.
  ...['SortBar', 'SiteFooter'].map((component) => ({
    component,
    kind: 'axis-extra',
    figma: 'state',
    reason:
      'Figma 컴포넌트 세트는 베리언트 속성이 최소 1개 있어야 성립하는데 이 컴포넌트에는 축이 될 유니온/불리언 prop이 하나도 없다 — state=default는 대응 React prop이 아니라 플랫폼 요구다.',
    owner: 'sb.hong',
  })),

  // (5) SiteHeader — 선택 상태(현재 페이지)
  {
    component: 'SiteHeader',
    kind: 'axis-extra',
    figma: 'active',
    reason:
      '선택 상태(현재 페이지 메뉴)의 시각 표현. 대응 prop인 value(string)는 "어느 메뉴가 굵고 밑줄인가"를 담을 수 없어 Figma에서는 축이 유일한 수단이다. 19. Site Screens의 5개 화면이 이 축으로 자기 메뉴를 켠다 — 지우면 화면 조립이 깨진다.',
    owner: 'sb.hong',
  },
  {
    component: 'SiteHeader',
    kind: 'text-missing',
    figma: null,
    code: 'value',
    reason:
      '선택된 메뉴 값 — 화면에 글자로 그려지지 않아 바인딩할 텍스트 레이어가 없다(시각 표현은 active 축이 담당한다).',
    owner: 'sb.hong',
  },
  {
    component: 'SiteHeader',
    kind: 'text-missing',
    figma: null,
    code: 'menuButtonLabel',
    reason:
      '접근성 이름(햄버거의 aria-label) — 그려지는 글자가 아니라 바인딩할 텍스트 레이어가 없다(SearchField.ariaLabel 예외와 같은 사유).',
    owner: 'sb.hong',
  },
  {
    component: 'SiteHeader',
    kind: 'text-missing',
    figma: null,
    code: 'drawerTitle',
    reason:
      '열린 드로어(오버레이)의 제목 — 이 세트는 닫힌 헤더 바를 그린다. 드로어 패널 자체가 세트 범위 밖(DS/Drawer 소관)이라 문구를 담을 레이어가 없다.',
    owner: 'sb.hong',
  },

  // (6) 변형 폭발 — 축을 늘리면 곱으로 터진다(권장 상한 세트당 40).
  ...['maxWidth', 'padding'].map((code) => ({
    component: 'SiteSection',
    kind: 'axis-missing',
    figma: null,
    code,
    reason:
      '축으로 만들면 16 → 48 → 144변형으로 곱해진다(권장 상한 40). 둘 다 본문 폭·여백 치수라 변형마다 그림이 거의 같아 비용 대비 정보량이 없다 — 기본값(xl · md)만 그린다.',
    owner: 'sb.hong',
  })),
  {
    component: 'ProductCard',
    kind: 'axis-missing',
    figma: null,
    code: 'accent',
    reason:
      '다섯 번째 축이 되면 32 → 64변형(권장 상한 40 초과). 가격 글자색만 바뀌는 축이라 기본값 success(레퍼런스의 그린)만 그린다.',
    owner: 'sb.hong',
  },

  // (7) 파서 한계 — 코드에 prop이 실재하는데 검사기가 못 읽는다.
  {
    component: 'ProductCard',
    kind: 'axis-extra',
    figma: 'ratio',
    reason:
      '실재하는 코드 prop이다(ratio?: ProductCardRatio). ds-props.mjs가 Extract<MediaRatio, …> 별칭을 해석하지 못해 union이 아닌 other로 분류하는 탓에 "여분 축"으로 뜬다. 축 이름과 값 4종(3x4·1x1·4x3·16x9)은 코드 유니온과 정확히 일치한다 — 파서가 Extract를 지원하면 자동으로 사라진다.',
    owner: 'sb.hong',
  },
  {
    component: 'ProductCard',
    kind: 'text-missing',
    figma: null,
    code: 'image',
    reason:
      '이미지 URL — 글자가 아니라 미디어 채우기(fill)다. Figma에는 이미지 속성 타입이 없고 바인딩할 텍스트 레이어도 없다.',
    owner: 'sb.hong',
  },

  // (8) children 슬롯 — N7이 현재 구조에서 충족 불가.
  {
    component: 'SiteSection',
    kind: 'slot-missing',
    figma: null,
    code: 'children',
    reason:
      'children 슬롯에 대응하는 Figma 속성 타입이 없다. N7 판정은 buildSet 선언(texts/bools/swaps)의 layer만 보므로 렌더 함수의 name="content" 프레임(renderSiteSection에 있다)을 볼 수 없다 — 바인딩할 속성이 없는 한 구조적으로 충족 불가다. children을 받는 12개 컴포넌트가 같은 이유로 baseline에 있다(검사기 수정은 scripts/ 배치 소관).',
    owner: 'sb.hong',
  },

  // ══ B4 어드민 세트 — figma-plugin/src/generators/admin.ts ═══════════════════════════
  // 아래 예외는 전부 "코드에 이름을 지어내지 않으려면 Figma 쪽에 표현 수단이 없다"는 한 가지 뿌리에서 나온다.
  // 실제로 표현 가능한 것(TEXT·BOOLEAN·INSTANCE_SWAP·VARIANT)은 이번 배치에서 79건 전부 생성기에 넣었다.

  // (1) 배열(list) prop을 인덱스로 편 데모 데이터 — prop이 아니라 '데이터'다.
  //     React는 rows[]·items[]·columns[]·steps[]를 받는다. Figma엔 배열 타입이 없어 행/칸/열을 고정 개수로
  //     그리고 각각을 TEXT(문구)·BOOLEAN(가시성)으로 열어 둔 것이다. 이름을 코드 prop으로 바꿀 방법이 없다
  //     (대응하는 prop이 애초에 없다). 지우면 화면(17)이 이 인스턴스로 상세/목록을 조립하지 못한다.
  //     → 근본 해결은 "배열을 인덱스 속성으로 펴지 않는" 세트 재설계이고 B4(모양 불변)의 범위를 넘는다.
  ...[
    ...['Row Title 1', 'Row Title 2', 'Row Title 3', 'Row Title 4', 'Row Title 5'].map((figma) => [
      'AdminTable', 'text-from-list', figma,
    ]),
    ...[1, 2, 3, 4, 5, 6, 7].flatMap((n) => [
      ['DefinitionList', 'text-from-list', `Label ${n}`],
      ['DefinitionList', 'text-from-list', `Value ${n}`],
    ]),
    ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
      ['TodoSummary', 'text-from-list', `Label ${n}`],
      ['TodoSummary', 'text-from-list', `Count ${n}`],
    ]),
    ...[1, 2, 3, 4].map((n) => ['StatusTimeline', 'text-from-list', `Step ${n}`]),
    // 'Step N Meta'는 접미사형이라 isIndexed(/\s\d+$/)가 못 잡아 text-extra로 떨어질 뿐, 위와 같은 부류다.
    ...[1, 2, 3, 4].map((n) => ['StatusTimeline', 'text-extra', `Step ${n} Meta`]),
    ...['Action 1', 'Action 2'].map((figma) => ['AdminTopbar', 'text-from-list', figma]),
    // 행·칸·열 단위 가시성 BOOLEAN — 위 인덱스 TEXT의 짝(같은 배열 데이터의 on/off)이다.
    ...[1, 2, 3, 4, 5].map((n) => ['AdminTable', 'bool-extra', `Show Row ${n}`]),
    ...['Select', 'Code', 'Thumb', 'Price', 'Status', 'Stock', 'Category', 'Date', 'Actions'].map((c) => [
      'AdminTable', 'bool-extra', `Show ${c}`,
    ]),
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ['DefinitionList', 'bool-extra', `Show Row ${n}`]),
    ...[1, 2, 3, 4, 5, 6].map((n) => ['TodoSummary', 'bool-extra', `Show Todo ${n}`]),
    // 그 BOOLEAN들이 가리키는 레이어(행·칸·열 프레임)도 같은 이유로 CSS 클래스 이름이 될 수 없다 —
    // CSS엔 .row 하나뿐이고 여기선 7개 행을 구분해야 한다.
    ...[1, 2, 3, 4, 5].map((n) => ['AdminTable', 'layer-not-css-class', `Row ${n} (BOOLEAN 레이어)`]),
    ...['Select', 'Code', 'Thumb', 'Price', 'Status', 'Stock', 'Category', 'Date', 'Actions'].map((c) => [
      'AdminTable', 'layer-not-css-class', `${c} (BOOLEAN 레이어)`,
    ]),
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ['DefinitionList', 'layer-not-css-class', `Row ${n} (BOOLEAN 레이어)`]),
    ...[1, 2, 3, 4, 5, 6].map((n) => ['TodoSummary', 'layer-not-css-class', `Todo ${n} (BOOLEAN 레이어)`]),
  ].map(([component, kind, figma]) => ({
    component,
    kind,
    figma,
    code: null,
    reason:
      '배열 prop(rows·items·columns·steps)을 인덱스로 편 데모 데이터다 — 대응하는 React prop 이름이 존재하지 않아 개명할 수 없고, 지우면 17. Admin Screens가 이 세트로 목록/상세를 조립할 수단을 잃는다. 근본 해결(배열을 인덱스 속성으로 펴지 않는 세트 재설계)은 "모양 불변" 제약을 넘는 별도 배치다.',
    owner: 'sb.hong',
  })),

  // (2) 이 Figma 세트가 아예 그리지 않는 UI — 툴바·로딩 스켈레톤·빈 상태·에러·메모 이력 목록.
  //     속성만 선언하면 어떤 레이어에도 안 붙는 '유령 속성'이 된다(이번 배치가 없애려는 바로 그 병).
  //     UI를 새로 그리는 건 B4의 "기존 세트의 모양은 바꾸지 마라" 제약과 정면으로 충돌한다.
  ...[
    // AdminTable — React는 툴바(export·컬럼피커) + 로딩 + 빈 상태를 품은 데이터그리드지만,
    // Figma DS/AdminTable은 '표 본체'만 모델링한다(툴바·페이지네이션은 screens.ts가 따로 그린다).
    ['AdminTable', 'axis-missing', 'columnPicker'],
    ['AdminTable', 'axis-missing', 'exportable'],
    ['AdminTable', 'axis-missing', 'loading'],
    ['AdminTable', 'axis-missing', 'emptyKind'],
    ['AdminTable', 'text-missing', 'emptyText'],
    ['AdminTable', 'text-missing', 'emptyDescription'],
    ['AdminTable', 'text-missing', 'loadingLabel'],
    ['AdminTable', 'bool-missing', 'showEmptyDescription'],
    ['AdminTable', 'swap-missing', 'kebabIcon'],
    ['AdminTable', 'swap-missing', 'dragIcon'],
    ['AdminTable', 'swap-missing', 'csvIcon'],
    ['AdminTable', 'swap-missing', 'excelIcon'],
    ['AdminTable', 'swap-missing', 'columnPickerIcon'],
    // SearchPanel — 상세검색 접기/펼치기 토글 자체가 세트에 없다(필드 4개가 항상 펼쳐져 있다).
    ['SearchPanel', 'axis-missing', 'collapsible'],
    ['SearchPanel', 'axis-missing', 'defaultCollapsed'],
    ['SearchPanel', 'text-missing', 'expandLabel'],
    ['SearchPanel', 'text-missing', 'collapseLabel'],
    ['SearchPanel', 'swap-missing', 'collapseIcon'],
    // 빈 상태 / 목록 이력 UI 없음
    ['ActivityLog', 'text-missing', 'emptyText'],
    ['MemoBox', 'text-missing', 'emptyText'],
    ['MemoBox', 'axis-missing', 'composer'],
    ['MemoBox', 'text-missing', 'labels.itemActions.group'],
    ['MemoBox', 'text-missing', 'labels.itemActions.view'],
    ['MemoBox', 'text-missing', 'labels.itemActions.edit'],
    ['MemoBox', 'text-missing', 'labels.itemActions.delete'],
    // MemoBox.value = 입력된 본문. 세트는 '빈 메모' 상태를 그리므로 placeholder 레이어만 있다.
    ['MemoBox', 'text-missing', 'value'],
    ['DropZone', 'bool-missing', 'showError'],
    ['DropZone', 'swap-missing', 'errorIcon'],
    // StatusTimeline 데모 4단계(done·done·current·todo)엔 skipped가 없어 붙일 노드가 없다.
    ['StatusTimeline', 'swap-missing', 'skippedIcon'],
    // AdminCard는 썸네일 자리에 항상 이미지 플레이스홀더를 그린다 — '썸네일 없음' 문구 노드가 없다.
    ['AdminCard', 'text-missing', 'emptyThumbnailLabel'],
  ].map(([component, kind, code]) => ({
    component,
    kind,
    figma: null,
    code,
    reason:
      '이 Figma 세트가 그리지 않는 UI(툴바·로딩·빈 상태·에러·메모 이력·접기 토글)의 속성이다. 지금 선언하면 어떤 레이어에도 안 붙는 유령 속성이 된다 — 그 UI를 새로 그리는 것은 B4의 "기존 세트의 모양은 바꾸지 마라" 제약을 벗어난다(세트 확장 배치로 분리).',
    owner: 'sb.hong',
  })),

  // (3) 축으로 만들면 그릴 그림이 없거나(중복 변형) 세트 몸통을 다시 짜야 하는 것.
  ...[
    // 레이아웃 엔진 — 값마다 배치가 통째로 달라진다(모양 불변 제약 위반).
    // DefinitionList: 지금 frame×divider×density = 8변형. columns(3)×layout(3)×align(2)를 더하면 144변형이다.
    ['DefinitionList', 'axis-missing', 'columns', '그리드 열 수(1·2·3)는 행 배치를 통째로 바꾸는 레이아웃 엔진이다. 지금 8변형에 columns×layout×align을 더하면 144변형으로 폭발한다(세트당 40 상한 초과).'],
    ['DefinitionList', 'axis-missing', 'layout', 'grid·inline·stacked는 서로 다른 배치 엔진이라 세트 몸통을 다시 짜야 한다 — 위와 같은 변형 폭발(144)에도 걸린다.'],
    ['DefinitionList', 'axis-missing', 'align', '값 정렬(left·right)까지 축으로 열면 144변형이 된다. 위 두 축과 함께 별도 배치로 다뤄야 한다.'],
    ['TodoSummary', 'axis-missing', 'layout', 'inline·grid·stack은 6칸의 배치를 통째로 바꾸는 레이아웃 엔진이라 세트 몸통 재설계가 필요하다("모양 불변" 제약).'],
    ['SearchPanel', 'axis-missing', 'columns', '필드 그리드 열 수(1~4)는 패널 폭과 필드 배치를 통째로 바꾼다 — 세트 몸통 재설계라 모양 불변 제약을 벗어난다.'],
    // 그릴 그림이 없는 축 — 축으로 만들면 기존 변형과 픽셀 단위로 똑같은 '중복 변형'이 생겨 문서가 거짓말을 한다.
    ['MemoBox', 'axis-missing', 'requireContent', '빈 메모의 저장을 막는 규칙일 뿐 그림이 달라지지 않는다(저장 버튼의 disabled 조건만 바뀐다) — 축으로 만들면 기존 변형과 똑같은 중복 변형이 생긴다.'],
    ['DropZone', 'axis-missing', 'multiple', '파일 여러 개 허용은 검증·aria 이름만 바꾸고 그림이 같다(DropZone.tsx:147 — 통과분을 몇 개 넘길지의 차이) — 축으로 만들면 중복 변형이 된다.'],
    ['CrudDialog', 'axis-missing', 'open', 'open=false는 아무것도 그리지 않는다 — 빈 변형이라 Figma 문서로서 뜻이 없다.'],
    ['CrudDialog', 'axis-missing', 'inline', 'inline은 fixed 오버레이 없이 정적 배치한다는 뜻인데, Figma 세트엔 애초에 오버레이가 없어 두 값의 그림이 같다(중복 변형).'],
  ].map(([component, kind, code, reason]) => ({ component, kind, figma: null, code, reason, owner: 'sb.hong' })),

  // (4) 코드에 짝이 없는 Figma 전용 '조립 축' — 지우면 17. Admin Screens가 깨진다.
  ...[
    ['AdminTable', 'frame', "card/flush. 이미 카드 안(툴바·페이지네이션과 한 몸)에 놓일 때 보더·라운드를 빼 이중 테두리를 막는 조립용 축이다. React에선 부모 CSS가 처리해 prop이 아니다. screens.ts:1497이 frame='flush'로 쓴다."],
    ['DefinitionList', 'frame', '위와 같은 이중 보더 방지용 조립 축. screens.ts:2088·2378이 flush로 쓴다.'],
    ['AdminTopbar', 'stacked', '브레드크럼·설명 줄의 유무로 높이(72/104)가 갈리는 조립 축. React에선 breadcrumb 배열과 description을 넘기는지 여부로 갈려 prop이 아니다.'],
    ['AdminTopbar', 'surface', 'bar(셸 상단의 흰 띠) / plain(면·보더 없이 hug). 12개 화면이 plain을 페이지 헤더로 쓴다(screens.ts:905). React에선 부모 레이아웃이 정해 prop이 아니다.'],
    ['DropZone', 'state', "idle/dragging. dragging은 React에서 prop이 아니라 컴포넌트 내부 상태(useState)다 — 그러나 '드래그 중' 그림은 문서에 반드시 필요하고 screens.ts(2670·3092·3119)가 state='idle'로 세운다."],
  ].map(([component, figma, reason]) => ({
    component,
    kind: 'axis-extra',
    figma,
    code: null,
    reason,
    owner: 'sb.hong',
  })),

  // (5) React에선 "prop을 안 넘기면 사라지는" 슬롯 — Figma엔 '속성 없음'이 없어 BOOLEAN으로만 표현된다.
  ...[
    ['AdminTopbar', 'Show Actions'],
    ['AdminTopbar', 'Show User'],
  ].map(([component, figma]) => ({
    component,
    kind: 'bool-extra',
    figma,
    code: null,
    reason:
      'React AdminTopbar는 actions/user prop을 넘기지 않으면 그 블록이 사라진다 — 즉 대응하는 show* 불리언이 애초에 없다. Figma엔 "속성을 안 넘김"이라는 상태가 없어 BOOLEAN이 유일한 표현 수단이다. screens.ts:910-911이 페이지 헤더로 쓸 때 둘 다 false로 끈다.',
    owner: 'sb.hong',
  })),

  // (6) 화면에 글자로 그려지지 않는 문자열 — 바인딩할 텍스트 레이어가 존재할 수 없다.
  //     (기존 SearchField.ariaLabel·DropZone.labels.upload 예외와 같은 부류)
  ...[
    ['ViewSwitch', 'labels.group', 'radiogroup의 접근성 이름 — 화면에 그려지지 않는다.'],
    ['ActivityLog', 'unreadLabel', '미읽음 점의 스크린리더 이름 — 점만 그려지고 글자는 없다.'],
    ['DropZone', 'accept', "input[type=file]의 accept 규약 문자열('image/*') — 화면에 그려지지 않는다."],
    ['AdminCard', 'thumbnail', '썸네일 이미지 URL — 글자가 아니라 이미지 소스다(Figma는 플레이스홀더를 그린다).'],
    ['AdminTable', 'exportFilename', '내려받는 파일 이름 — 화면에 그려지지 않는다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${reason} Figma TEXT 속성은 텍스트 레이어에 바인딩돼야 존재할 수 있어 표현이 불가능하다.`,
    owner: 'sb.hong',
  })),

  // (7) Partial<Record<key, ReactNode>> 아이콘 맵 — 단일 INSTANCE_SWAP으로 표현 불가.
  ...[
    ['ViewSwitch', 'icons', '카드형·게시물형 슬롯마다 다른 아이콘을 넣는 맵이다.'],
    ['ActivityLog', 'typeIcons', '활동 타입(문의·주문·상품·회원)마다 다른 아이콘을 넣는 맵이다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'swap-missing',
    figma: null,
    code,
    reason: `${reason} INSTANCE_SWAP 하나에 여러 슬롯을 묶으면 모든 슬롯이 같은 아이콘이 돼 버려 오히려 망가진다. 슬롯별로 나누려면 코드가 icons.card/icons.board처럼 개별 prop이어야 한다(코드 쪽 변경이라 B4 범위 밖).`,
    owner: 'sb.hong',
  })),

  // (8) ReactNode '슬롯'(버튼 묶음) — INSTANCE_SWAP은 인스턴스 교체지 슬롯이 아니다.
  ...[
    ['AdminTopbar', 'actions', '우측 액션 슬롯 — 화면마다 버튼 구성이 다르다. Figma에선 버튼 프레임(인스턴스 아님)이라 붙일 수 없다.'],
    ['SearchPanel', 'actions', '검색/초기화 옆 추가 버튼 슬롯 — 위와 같다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'swap-missing',
    figma: null,
    code,
    reason: `${reason} INSTANCE_SWAP은 '인스턴스를 다른 컴포넌트로 교체'하는 속성이라 임의의 노드 묶음을 받는 슬롯을 표현할 수 없다.`,
    owner: 'sb.hong',
  })),

  // (9) labels.* — 개별 prop과 '같은 문구'를 가리키는 대체 통로(코드가 labels.X ?? X로 푼다).
  //     한 텍스트 레이어에 TEXT 속성 2개를 붙일 수 없어 개별 prop 쪽(title·placeholder·saveLabel…)을 열었다.
  ...['labels.title', 'labels.description', 'labels.placeholder', 'labels.empty', 'labels.save', 'labels.saving'].map(
    (code) => ({
      component: 'MemoBox',
      kind: 'text-missing',
      figma: null,
      code,
      reason:
        '같은 문구를 가리키는 두 번째 통로다(코드가 labels.X ?? X로 푼다 — 개별 prop이 이긴다). 한 텍스트 레이어에 TEXT 속성 두 개를 붙일 수 없으므로 개별 prop(title·description·placeholder·saveLabel·savingLabel) 쪽을 Figma 속성으로 노출했다. labels.empty는 그 위에 목록 빈 상태 UI 자체가 세트에 없다.',
      owner: 'sb.hong',
    }),
  ),

  // (10) children 슬롯 — N7이 현재 검사 구조에서 충족 불가(SiteSection과 같은 사유).
  ...[
    ['CrudDialog', 'create/edit 모드의 폼 본문'],
    ['DropZone', '기본 아이콘·라벨 대신 그릴 내용'],
    ['Upload', '드롭존 안내 영역(아이콘·문구) 커스텀'],
  ].map(([component, what]) => ({
    component,
    kind: 'slot-missing',
    figma: null,
    code: 'children',
    reason: `children(${what})에 대응하는 Figma 속성 타입이 없다. N7 판정은 buildSet 선언(texts/bools/swaps)의 layer만 보므로 렌더 함수의 프레임 이름을 볼 수 없다 — 바인딩할 속성이 없는 한 구조적으로 충족 불가다(검사기 수정은 scripts/ 배치 소관).`,
    owner: 'sb.hong',
  })),

  // ══ Input · Selection · Action · Feedback 세트 — figma-plugin/src/generators/categories-core.ts ══
  // 이 배치에서 표현 가능한 것(TEXT·BOOLEAN·INSTANCE_SWAP·VARIANT)은 전부 생성기에 실제로 넣었다.
  // 아래는 Figma의 속성 타입(VARIANT/TEXT/BOOLEAN/INSTANCE_SWAP)으로는 표현할 수 없는 것만 남은 것이다.

  // (1) 값 텍스트와 플레이스홀더는 **같은 텍스트 레이어**를 공유한다(값이 있으면 값, 없으면 플레이스홀더).
  //     한 텍스트 레이어에 TEXT 속성을 두 개 붙일 수 없어, 세트가 그리는 상태 쪽 prop 하나만 열었다.
  //     (MemoBox의 labels.* 예외와 같은 부류다.)
  ...[
    ['EmailField', 'value', 'placeholder'],
    ['PasswordField', 'value', 'placeholder'],
    ['CurrencyField', 'value', 'placeholder'],
    ['SearchField', 'value', 'placeholder'],
    ['Textarea', 'value', 'placeholder'],
    ['Select', 'placeholder', 'value'],
    ['Autocomplete', 'placeholder', 'value'],
  ].map(([component, code, opened]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `입력값(value)과 플레이스홀더는 같은 텍스트 레이어가 그린다 — 한 텍스트 레이어에 TEXT 속성 두 개를 붙일 수 없어 세트가 실제로 그리는 상태 쪽(${opened})만 열었다. 기본값 문자열이 곧 나머지 하나의 문구다.`,
    owner: 'sb.hong',
  })),
  {
    component: 'MultiSelect',
    kind: 'text-missing',
    figma: null,
    code: 'placeholder',
    reason:
      '세트는 값이 선택된 상태(칩 2개)를 그린다 — 플레이스홀더는 선택이 하나도 없을 때만 나타나므로 바인딩할 텍스트 레이어가 존재하지 않는다.',
    owner: 'sb.hong',
  },
  {
    component: 'OtpField',
    kind: 'text-missing',
    figma: null,
    code: 'value',
    reason:
      '자릿수만큼 분리된 셀(6개)에 한 글자씩 들어간다 — 문자열 prop 하나를 6개 텍스트 레이어에 1:1로 바인딩할 방법이 없다.',
    owner: 'sb.hong',
  },
  {
    component: 'Autocomplete',
    kind: 'text-missing',
    figma: null,
    code: 'emptyText',
    reason:
      '이 세트는 후보가 있는 상태(제안 목록 3개)를 그린다 — "검색 결과 없음" UI 자체가 없어 문구를 담을 레이어가 없다(ActivityLog.emptyText 예외와 같은 사유).',
    owner: 'sb.hong',
  },

  // (2) 화면에 글자로 그려지지 않는 문자열 — 바인딩할 텍스트 레이어가 존재할 수 없다.
  ...[
    ['Loading', 'labels.loading', '접근성 이름(role=status) — label을 넘기면 그쪽이 이기고, labels.loading만 있으면 글자는 그려지지 않는다.'],
    ['Upload', 'accept', "input[type=file]의 accept 규약 문자열('image/*') — 화면에 그려지지 않는다."],
    ['Radio', 'name', '라디오 그룹의 form name 속성 — 화면에 그려지지 않는다.'],
    ['Radio', 'value', '선택된 옵션의 value — 시각 표현은 "어느 원이 채워졌는가"지 글자가 아니다(SiteHeader.value 예외와 같은 사유).'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${reason} Figma TEXT 속성은 텍스트 레이어에 바인딩돼야 존재할 수 있어 표현이 불가능하다.`,
    owner: 'sb.hong',
  })),

  // (3) 배열(options[]) prop을 인덱스로 편 데모 데이터 — prop이 아니라 '데이터'다.
  //     레이어를 CSS 클래스(.label)로 통일하면 addTextProp의 findAll(name===layer)이 세 항목을
  //     한 속성에 묶어 같은 글자로 만들어 버린다 → 규약 §6대로 레이어에 prop 이름을 쓴다.
  ...[1, 2, 3].map((n) => ({
    component: 'Radio',
    kind: 'text-from-list',
    figma: `Label ${n}`,
    code: null,
    reason:
      'RadioProps.options[](배열)의 항목 라벨이다 — 배열은 Figma 속성으로 1:1 표현이 불가능해 고정 3개 항목의 인덱스 TEXT로 편다. 대응하는 문자열 prop이 애초에 없어 개명할 이름도 없다.',
    owner: 'sb.hong',
  })),

  // (4) React에선 "prop을 안 넘기면 사라지는" 슬롯 — 대응하는 show* 불리언이 코드에 없다.
  //     Chip.leading(ReactNode)·Chip.onRemove(함수)·Tag.onRemove(함수)는 넘길 때만 그려지는데,
  //     Figma엔 "속성을 안 넘김"이라는 상태가 없어 BOOLEAN이 유일한 표현 수단이다
  //     (AdminTopbar의 'Show Actions'/'Show User' 예외와 같은 부류).
  //     지우면 선행 아이콘·제거 버튼을 켤 방법이 사라져 leading(INSTANCE_SWAP)·removeIcon도 함께 죽는다.
  ...[
    ['Chip', 'Show Leading'],
    ['Chip', 'Show Remove'],
    ['Tag', 'Show Remove'],
  ].map(([component, figma]) => ({
    component,
    kind: 'bool-extra',
    figma,
    code: null,
    reason:
      'React는 leading/onRemove를 넘기지 않으면 그 요소가 사라진다 — 즉 대응하는 show* 불리언이 애초에 없다(onRemove는 함수라 속성이 될 수도 없다). Figma엔 "속성 없음" 상태가 없어 BOOLEAN이 유일한 표현 수단이다.',
    owner: 'sb.hong',
  })),

  // (5) children(ReactNode) 슬롯이지만 세트가 그리는 실체는 '텍스트 한 줄'이다 →
  //     규약 §7이 정한 슬롯 이름 `content`로 TEXT를 열었다(SiteSection.title 예외와 같은 부류).
  {
    component: 'Callout',
    kind: 'text-extra',
    figma: 'content',
    code: null,
    reason:
      'CalloutProps.children(본문)이다. INSTANCE_SWAP 기본값은 아이콘 컴포넌트만 가능해 노드 슬롯을 담을 수 없고, 세트가 그리는 실체는 텍스트 한 줄이라 TEXT가 유일하게 쓸모 있는 표현이다. 이름은 규약 §7의 슬롯 이름 content 그대로다(이 TEXT가 N7의 content 레이어도 함께 만족시킨다).',
    owner: 'sb.hong',
  },

  // (6) 코드에 없는 축 = React에선 prop이 아니라 컴포넌트 내부 상태(useState)다.
  //     그러나 그 그림(열린 목록·검증 결과)은 문서에 반드시 필요하다 — DropZone의 state 축 예외와 같은 사유.
  ...[
    ['Select', 'open', '옵션 패널이 열린 상태. React에선 useState이고 prop이 아니다 — 그러나 "무엇을 고르는 컨트롤인가"는 열린 그림 없이는 문서가 될 수 없다.'],
    ['MultiSelect', 'open', '위와 같다(다중 선택 패널의 체크 상태를 보여주는 유일한 그림).'],
    ['EmailField', 'error', '블러 시 형식 검증의 결과. React에선 validate가 켜져 있을 때 컴포넌트가 스스로 계산하는 내부 상태라 prop이 아니다.'],
    ['EmailField', 'success', '위와 같다(검증 통과 그림).'],
  ].map(([component, figma, reason]) => ({
    component,
    kind: 'axis-extra',
    figma,
    code: null,
    reason,
    owner: 'sb.hong',
  })),

  // (7) 축으로 만들면 기존 변형과 픽셀 단위로 똑같은 '중복 변형'이 생기거나(문서가 거짓말을 한다),
  //     아무것도 그리지 않는 '빈 변형'이 된다.
  ...[
    ['Snackbar', 'open', 'open=false는 아무것도 그리지 않는다 — 빈 변형이라 Figma 문서로서 뜻이 없다(CrudDialog.open과 같은 사유).'],
    ['Snackbar', 'inline', 'inline은 fixed 오버레이 없이 정적 배치한다는 뜻인데, Figma 세트엔 애초에 오버레이가 없어 두 값의 그림이 같다(중복 변형).'],
    ['Tooltip', 'alwaysVisible', '이 세트는 말풍선 자체를 그린다(트리거는 children이라 세트 밖이다) — "호버 없이도 보이는가"는 정적 프레임에서 그림이 완전히 같다(중복 변형).'],
    ['Upload', 'multiple', '파일 여러 개 허용은 input의 multiple 속성과 maxFiles 검증만 바꾸고 드롭존 그림이 같다 — 축으로 만들면 중복 변형이 된다(DropZone.multiple과 같은 사유).'],
    ['EmailField', 'validate', '검증을 켜고 끄는 스위치일 뿐 그림이 달라지지 않는다(꺼도 기본 상태와 같은 그림) — 검증 결과 그림은 error·success 축이 담당한다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'axis-missing',
    figma: null,
    code,
    reason,
    owner: 'sb.hong',
  })),

  // (8) 변형 폭발 — 축을 늘리면 곱으로 터진다(권장 상한 세트당 40).
  {
    component: 'Textarea',
    kind: 'axis-missing',
    figma: null,
    code: 'autoResize',
    reason:
      '지금 축 5개(error·disabled·readOnly·required·fullWidth)로 2^5=32변형이다. autoResize를 더하면 2^6=64변형으로 권장 상한 40을 넘는다. 게다가 "내용에 맞춰 높이가 자란다"는 동작이라 글자가 고정된 정적 프레임에서는 두 값의 그림이 같다 — 비용은 2배인데 정보량은 0이다.',
    owner: 'sb.hong',
  },

  // (9) number prop을 축으로 이산화 — Figma에 숫자 속성 타입이 없다.
  {
    component: 'Slider',
    kind: 'axis-from-number',
    figma: 'value (50|0|100)',
    code: 'value',
    reason:
      '채움 비율은 value(number)가 정하는데 Figma에는 숫자 속성 타입이 없다. 대표값 3개(50·0·100)를 축으로 그려야 "슬라이더가 무엇을 하는가"를 문서가 보여줄 수 있다. TEXT 속성으로 여는 대안은 불가능하다 — 같은 이름의 VARIANT 축과 TEXT 속성은 공존할 수 없고(addComponentProperty 이름 충돌), 축을 지우면 채움 그림이 하나로 굳는다. 단위(unit)는 TEXT 속성으로 따로 열어 두었다.',
    owner: 'sb.hong',
  },

  // ══ Navigation · Layout · Overlay · Structure 세트 ══════════════════════════════════
  //     figma-plugin/src/generators/categories-nav-overlay.ts
  // 표현 가능한 것은 이번 배치에서 전부 생성기에 넣었다(축 6개 · BOOLEAN 4개 · TEXT 9개 신설,
  // 대응 prop 없는 INSTANCE_SWAP 9개 제거, TEXT 9개 개명 → baseline 47건 해소).
  // 아래는 남은 구조적 격차뿐이다.

  // (1) 세트가 그리는 것은 '컴포넌트'가 아니라 '배열 항목 하나' 또는 '고정 개수의 행'이다.
  //     React는 items[]·actions[]·links[]·sections[]를 받는다 — 인덱스로 편 이 이름들에 대응하는
  //     prop 이름이 애초에 존재하지 않아 개명할 수단이 없다(admin.ts의 AdminTable·DefinitionList와 같은 부류).
  ...[
    ...['Action 1', 'Action 2', 'Action 3'].map((f) => ['ActionSheet', 'text-from-list', f]),
    ...['Item 1', 'Item 2'].map((f) => ['Breadcrumb', 'text-from-list', f]),
    ...['Tab 1', 'Tab 2', 'Tab 3'].map((f) => ['CategoryTabs', 'text-from-list', f]),
    ...['Item 1', 'Item 2', 'Item 3'].map((f) => ['Dropdown', 'text-from-list', f]),
    ...['Link 1', 'Link 2', 'Link 3'].map((f) => ['Footer', 'text-from-list', f]),
    ...['Name 1', 'Name 2', 'Name 3', 'Sub 1', 'Sub 2', 'Sub 3'].map((f) => ['List', 'text-from-list', f]),
    ...['Link 1', 'Link 2', 'Link 3'].map((f) => ['Navbar', 'text-from-list', f]),
    ...['Item 1', 'Item 2', 'Item 3'].map((f) => ['Sidebar', 'text-from-list', f]),
    // SidebarItem.icon(ReactNode)은 실재하는 항목별 아이콘 슬롯이라 스왑을 남겼다(지우면 교체 수단이 사라진다).
    // 다만 '항목별'이라 코드에 Icon 1/2/3 같은 개별 prop 이름이 없어 §5를 만족시킬 방법이 없다.
    ...['Icon 1', 'Icon 2', 'Icon 3'].map((f) => ['Sidebar', 'swap-indexed', f]),
    // 아래 4건도 같은 배열 데이터인데 이름이 인덱스 접미사(/\s\d+$/)가 아니라 text-extra로 떨어질 뿐이다.
    ['Breadcrumb', 'text-extra', 'Current'], // items[]의 마지막 항목
    ['Tab', 'text-extra', 'Label'], // DS/Tab은 탭 '항목 하나'를 그린다 → items[].label
    ['Accordion', 'text-extra', 'Title'], // items[].title
    ['Accordion', 'text-extra', 'Body'], // items[].content
  ].map(([component, kind, figma]) => ({
    component,
    kind,
    figma,
    code: null,
    reason:
      '배열 prop(items·actions·links·sections)을 고정 개수로 편 데모 데이터다 — 대응하는 React prop 이름이 존재하지 않아 개명할 수 없고, 지우면 디자이너가 항목 문구를 바꿀 수단을 잃는다. 근본 해결(배열을 인덱스 속성으로 펴지 않는 세트 재설계)은 "기존 세트의 모양 불변" 제약을 넘는 별도 배치다.',
    owner: 'sb.hong',
  })),

  // (2) ReactNode 슬롯이 그리는 내용물 — 슬롯 자체는 Figma 속성으로 표현할 수 없고(아래 (6)),
  //     세트는 그 안에 들어갈 대표 내용을 그려 둔다. 그 내용의 문구에는 대응 prop이 없다.
  ...[
    ['Modal', 'Cancel', 'footer 슬롯(ReactNode)에 들어가는 대표 버튼'],
    ['Modal', 'Confirm', 'footer 슬롯(ReactNode)에 들어가는 대표 버튼'],
    ['Navbar', 'CTA', 'actions 슬롯(ReactNode)에 들어가는 대표 버튼'],
    ['Drawer', 'Item 1', 'children 슬롯(ReactNode)에 들어가는 대표 내비 목록'],
    ['Drawer', 'Item 2', 'children 슬롯(ReactNode)에 들어가는 대표 내비 목록'],
    ['Drawer', 'Item 3', 'children 슬롯(ReactNode)에 들어가는 대표 내비 목록'],
  ].map(([component, figma, what]) => ({
    component,
    kind: 'text-extra',
    figma,
    code: null,
    reason: `${what}의 문구다 — React는 이 자리에 노드를 통째로 받으므로 문구에 대응하는 prop이 없다. 지우면 세트가 그려 둔 대표 내용이 편집 불가능해진다.`,
    owner: 'sb.hong',
  })),

  // (3) children 슬롯을 그리는 텍스트 레이어 — 규약 §7이 슬롯 이름을 'content'로 못박았는데
  //     classifyProps는 children을 code.slot으로 따로 분류해 code.text에 넣지 않는다. 즉 §7대로 이름을
  //     지을수록 N4는 "여분 TEXT"라고 부른다. 지우면 본문을 인스턴스마다 바꿀 수단이 사라지고
  //     N7(content 레이어)도 다시 깨진다 — 규약을 지킨 대가로 생기는 위반이라 예외로 둔다.
  ...['Card', 'Modal', 'Popover', 'BottomSheet'].map((component) => ({
    component,
    kind: 'text-extra',
    figma: 'content',
    code: null,
    reason:
      'children 슬롯(§7 → 레이어 이름 content)을 그리는 텍스트 레이어에 붙인 TEXT 속성이다. 검사기가 children을 code.slot으로 따로 분류해 code.text에 넣지 않으므로 규약대로 이름 지을수록 text-extra가 된다. 지우면 N7(content 레이어)이 다시 깨진다.',
    owner: 'sb.hong',
  })),

  // (4) 이 Figma 세트가 아예 그리지 않는 UI의 속성 — 선언하면 어떤 레이어에도 안 붙는 유령 속성이 된다.
  ...[
    ['ActionSheet', 'title', '이 세트는 제목 없는 액션시트를 그린다 — 제목 노드가 없다.'],
    ['Footer', 'description', '이 세트는 저작권 + 링크만 그린다 — 설명 줄이 없다.'],
    ['Header', 'description', '이 세트는 제목 한 줄만 그린다 — 설명 줄이 없다.'],
    [
      'Breadcrumb',
      'separator',
      "구분자를 셰브론 아이콘 인스턴스로 그린다 — 문자열('/')을 담을 텍스트 레이어가 없다. 텍스트로 바꾸는 건 모양 변경이다.",
    ],
  ].map(([component, code, why]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${why} 지금 선언하면 어떤 레이어에도 안 붙는 유령 속성이 된다 — 그 UI를 새로 그리는 것은 "기존 세트의 모양 불변" 제약을 벗어난다(세트 확장 배치로 분리).`,
    owner: 'sb.hong',
  })),

  // (5) DS/Dropdown 세트는 '열린 메뉴 패널'만 그린다 — 트리거 버튼이 세트 밖이다.
  //     그래서 트리거에 걸리는 세 prop(label·disabled·align)은 붙일 레이어도, 달라질 그림도 없다.
  ...[
    ['text-missing', 'label', '트리거 버튼의 텍스트'],
    ['axis-missing', 'disabled', '트리거 버튼의 비활성 상태(그때는 메뉴가 열리지도 않는다)'],
    ['axis-missing', 'align', '트리거를 기준으로 한 메뉴의 좌/우 정렬'],
  ].map(([kind, code, what]) => ({
    component: 'Dropdown',
    kind,
    figma: null,
    code,
    reason: `${what}이다. DS/Dropdown 세트는 열린 메뉴 패널만 그리고 트리거 버튼은 세트 밖이라 붙일 레이어가 없다 — 축으로 만들어도 기존 변형과 픽셀 단위로 같은 중복 변형이 된다. 트리거를 그리는 것은 세트의 모양을 바꾸는 일이다.`,
    owner: 'sb.hong',
  })),

  // (6) ReactNode 슬롯 — INSTANCE_SWAP은 '인스턴스를 다른 컴포넌트로 교체'하는 속성이고
  //     이 플러그인에서 그 기본값이 될 수 있는 컴포넌트는 아이콘뿐이다(addSwapProp: defKey → ICON_COMPONENTS).
  ...[
    ['Header', 'breadcrumb', '제목 위 경로 슬롯'],
    ['Header', 'actions', '우측 액션 버튼 슬롯'],
    ['Navbar', 'actions', '우측 액션 버튼 슬롯'],
    ['Modal', 'footer', '하단 액션 버튼 슬롯'],
    ['Popover', 'trigger', '팝오버를 여는 트리거 노드'],
    ['Sidebar', 'brand', '사이드바 머리의 브랜드/로고 슬롯'],
  ].map(([component, code, what]) => ({
    component,
    kind: 'swap-missing',
    figma: null,
    code,
    reason: `${what}(ReactNode)이다. INSTANCE_SWAP의 기본값은 아이콘 컴포넌트만 될 수 있어(addSwapProp: defKey → ICON_COMPONENTS) 임의의 노드 묶음을 받는 슬롯을 표현할 수 없다. TEXT로 여는 것은 슬롯이 아니라 라벨을 고치는 거짓 속성이다.`,
    owner: 'sb.hong',
  })),
  {
    // 위 Sidebar.brand의 짝 — 세트가 그리는 실체는 워드마크 텍스트 하나라 TEXT로 열되 이름은 prop 그대로.
    // (site.ts의 SiteHeader/SiteFooter.brand와 정확히 같은 처리다.)
    component: 'Sidebar',
    kind: 'text-extra',
    figma: 'brand',
    reason:
      'ReactNode 슬롯이지만 세트가 그리는 실체는 워드마크 텍스트 레이어 하나다 — TEXT 속성이 유일하게 쓸모 있는 표현이다(INSTANCE_SWAP 기본값은 아이콘만 가능). 이름은 코드 prop 그대로이고, 위 swap-missing과 같은 prop의 짝이다.',
    owner: 'sb.hong',
  },

  // (7) 화면에 글자로 그려지지 않는 문자열 — 바인딩할 텍스트 레이어가 존재할 수 없다.
  //     (SearchField.ariaLabel·SiteHeader.value 예외와 같은 부류)
  ...[
    ['Breadcrumb', 'ariaLabel', 'nav의 접근성 이름'],
    ['Pagination', 'labels.nav', 'nav의 접근성 이름'],
    ['Pagination', 'labels.prev', '이전 버튼의 접근성 이름(그려지는 건 셰브론뿐)'],
    ['Pagination', 'labels.next', '다음 버튼의 접근성 이름'],
    ['Pagination', 'labels.first', '처음 버튼의 접근성 이름'],
    ['Pagination', 'labels.last', '끝 버튼의 접근성 이름'],
    ['Tab', 'value', '선택된 탭의 id'],
    ['CategoryTabs', 'value', '선택된 탭의 id'],
    ['Navbar', 'value', '선택된 메뉴의 id'],
    ['Sidebar', 'value', '선택된 메뉴의 id'],
    ['List', 'selectedId', '선택된 행의 id'],
  ].map(([component, code, what]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${what} — 화면에 글자로 그려지지 않아 바인딩할 텍스트 레이어가 없다(Figma TEXT 속성은 텍스트 레이어에 붙어야 존재할 수 있다). 선택 상태의 시각 표현은 축·강조 스타일이 담당한다.`,
    owner: 'sb.hong',
  })),

  // (8) 오버레이의 open / inline — 그릴 그림이 없는 축(CrudDialog.open·inline 예외와 같은 사유).
  ...[
    ...['Modal', 'Dialog', 'Drawer', 'BottomSheet', 'ActionSheet', 'Popover'].map((c) => [c, 'open']),
    ...['Modal', 'Dialog', 'Drawer', 'BottomSheet', 'ActionSheet'].map((c) => [c, 'inline']),
  ].map(([component, code]) => ({
    component,
    kind: 'axis-missing',
    figma: null,
    code,
    reason:
      'open=false는 아무것도 그리지 않는다(빈 변형이라 Figma 문서로서 뜻이 없다). inline은 fixed 오버레이 없이 정적 배치한다는 뜻인데 Figma 세트엔 애초에 백드롭이 없어 두 값의 그림이 완전히 같다 — 축으로 만들면 기존 변형과 픽셀 단위로 똑같은 중복 변형이 생겨 문서가 거짓말을 한다.',
    owner: 'sb.hong',
  })),

  // (9) 그림이 달라지지 않는 축 — 축으로 만들면 중복 변형이 된다.
  ...[
    ['Navbar', 'sticky', 'position: sticky 한 줄(Navbar.module.css .sticky)일 뿐이라 그림이 달라지지 않는다 — 스크롤 동작이지 시각 속성이 아니다.'],
    ['Accordion', 'multiple', '여러 항목을 동시에 열 수 있는가라는 동작 규칙인데 이 세트는 아코디언 항목 하나를 그린다 — 달라질 그림이 없다.'],
    ['CategoryTabs', 'addable', "'+ 카테고리 추가' 버튼/입력의 노출 여부인데 그 UI 자체가 이 세트에 없다. 생성기가 스스로 밝힌 범위다 — \"추가·삭제 입력은 문서화 범위 밖, Figma는 정적 세트\"(같은 사유로 labels.add* 3건이 이미 예외다)."],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'axis-missing',
    figma: null,
    code,
    reason,
    owner: 'sb.hong',
  })),

  // (10) 항목 단위 상태를 Figma에서 표현하는 축 — 코드엔 대응 prop이 없다(항목 배열의 필드이거나 내부 상태다).
  ...[
    ['Tab', 'active', '어느 탭이 선택됐는지 — 코드에선 value(string)가 정하는데 항목 하나짜리 세트로는 담을 수 없다.'],
    ['Tab', 'disabled', 'TabItem.disabled — 항목 배열의 필드라 컴포넌트 prop이 아니다.'],
    ['Accordion', 'expanded', 'defaultOpenIds로 정해지는 항목별 펼침 상태 — 항목 배열 기준이라 컴포넌트 prop이 아니다.'],
    ['Accordion', 'disabled', 'AccordionItem.disabled — 항목 배열의 필드라 컴포넌트 prop이 아니다.'],
  ].map(([component, figma, why]) => ({
    component,
    kind: 'axis-extra',
    figma,
    code: null,
    reason: `${why} 그러나 그 그림은 문서에 반드시 필요하고, 세트가 '항목 하나'를 그리는 이상 Figma에서는 축이 유일한 수단이다(SiteHeader.active 예외와 같은 사유). 지우면 문서가 활성/비활성 상태를 못 보여준다.`,
    owner: 'sb.hong',
  })),

  // (11) 축이 될 수 있는 prop이 하나도 없는 세트 — Figma 컴포넌트 세트는 베리언트 속성이 최소 1개 있어야 성립한다.
  //      (코드에 유니온이 없거나, 있어도 위 (5)·(8)·(9) 사유로 그릴 그림이 없는 것들이다.)
  ...['Breadcrumb', 'Dropdown', 'Footer', 'Form', 'BottomSheet', 'ActionSheet', 'Navbar'].map((component) => ({
    component,
    kind: 'axis-extra',
    figma: 'state',
    code: null,
    reason:
      'Figma 컴포넌트 세트는 베리언트 속성이 최소 1개 있어야 성립하는데 이 세트에는 그림이 달라지는 축이 하나도 없다 — state=default는 대응 React prop이 아니라 플랫폼 요구다(SortBar·SiteFooter 예외와 같은 사유).',
    owner: 'sb.hong',
  })),

  // (12) children 슬롯 — N7이 현재 검사 구조에서 충족 불가(SiteSection·CrudDialog와 같은 사유).
  {
    component: 'Drawer',
    kind: 'slot-missing',
    figma: null,
    code: 'children',
    reason:
      'children(드로어 본문)에 대응하는 Figma 속성 타입이 없다. Card·Modal·Popover·BottomSheet는 본문이 텍스트 한 줄이라 TEXT를 content 레이어에 걸어 N7을 채웠지만, Drawer의 본문은 내비 목록(아이콘+라벨 행)이라 걸 텍스트 레이어가 하나로 정해지지 않는다. N7 판정은 buildSet 선언의 layer만 보므로 렌더 함수의 프레임 이름은 보이지 않는다(검사기 수정은 scripts/ 배치 소관).',
    owner: 'sb.hong',
  },

  // (13) 축 → BOOLEAN/TEXT 전환이 **도구에 막혀 있는** 2건.
  //      게이트가 시키는 고침(축을 지우고 BOOLEAN·TEXT로 선언)을 그대로 하면 문서에서 그 변형 그림이 사라진다:
  //      categories.ts의 variantItem이 `inst.setProperties(state.props)`를 표시 이름 그대로 호출하는데,
  //      VARIANT 축만 이름으로 먹고 TEXT·BOOLEAN·INSTANCE_SWAP은 전체 키('showFooter#12:3')를 요구한다
  //      (lib/build-set.ts의 propKeys 주석 참조). 즉 문서 상태(states)로 BOOLEAN을 켤 수단이 아예 없다.
  //      카드의 푸터·구분선의 라벨은 그 세트 문서의 핵심 그림이라 지울 수 없다.
  //      → 해결: variantItem이 propKeys로 이름을 풀게 고치면 자동 해소된다(categories.ts — 이 배치의 소관 밖이라 보고).
  ...[
    ['Card', 'bool-promoted-to-axis', 'footer', 'showFooter'],
    ['Card', 'bool-missing', null, 'showFooter'],
    ['Divider', 'text-promoted-to-axis', 'label', 'label'],
  ].map(([component, kind, figma, code]) => ({
    component,
    kind,
    figma,
    code,
    reason:
      'BOOLEAN/TEXT 속성으로 전환하면 문서 상태(states)에서 그 변형을 켤 수 없어 그림이 통째로 사라진다 — categories.ts의 variantItem이 setProperties를 표시 이름 그대로 호출해 VARIANT 축만 먹고, TEXT·BOOLEAN은 전체 키(propKeys)가 필요하기 때문이다. Card의 푸터·Divider의 라벨은 그 세트 문서의 핵심 그림이다. variantItem이 propKeys를 쓰도록 고치면(categories.ts — 이 배치의 소관 밖) 자동으로 해소된다.',
    owner: 'sb.hong',
  })),

  // ══ Data · Date&Time · KR · Media · Templates 세트 ══════════════════════════════════
  //    figma-plugin/src/generators/categories-data-kr-media.ts
  // 표현 가능한 것은 이 배치에서 전부 생성기에 넣었다(113건). 아래는 Figma의 속성 타입
  // (VARIANT / TEXT / BOOLEAN / INSTANCE_SWAP)으로는 표현할 수 없거나, 축으로 만들면
  // 그릴 그림이 없어 중복 변형만 늘어나는 것들이다.

  // (1) 화면에 글자로 그려지지 않는 문자열 — 바인딩할 텍스트 레이어가 존재할 수 없다.
  //     (기존 SearchField.ariaLabel · AdminCard.thumbnail · ProductCard.image 예외와 같은 부류)
  ...[
    ['Avatar', 'src', '아바타 이미지 URL — 글자가 아니라 이미지 소스다(세트는 이니셜 폴백을 그린다).'],
    ['Image', 'src', '이미지 URL — 글자가 아니라 미디어 채우기(fill)다.'],
    ['Image', 'alt', '대체 텍스트(접근성) — 화면에 그려지지 않는다.'],
    ['Video', 'src', '동영상 URL — 글자가 아니라 미디어 소스다.'],
    ['Video', 'poster', '포스터 이미지 URL — 글자가 아니라 이미지 소스다.'],
    ['YouTube', 'id', '유튜브 영상 ID — 임베드 URL 조각이라 화면에 글자로 그려지지 않는다.'],
    ['ImageCard', 'image', '카드 이미지 URL — 글자가 아니라 미디어 채우기다(세트는 플레이스홀더를 그린다).'],
    ['Carousel', 'aspectRatio', "CSS 비율 문자열('16 / 9') — 값이지 화면에 그려지는 글자가 아니다."],
    ['Tree', 'selectedId', '선택된 노드의 id — 시각 표현은 행 하이라이트이고 글자로는 그려지지 않는다.'],
    ['KrCarrierSelect', 'value', '선택된 통신사 코드 — 시각 표현은 선택된 필의 하이라이트다(SiteHeader.value와 같은 사유).'],
    ['KrAuthMethodSelect', 'value', '선택된 인증수단 코드 — 시각 표현은 선택된 행의 하이라이트다.'],
    ['AdminShell', 'navValue', '선택된 상단 메뉴 값 — 시각 표현은 메뉴 강조이고 글자로는 그려지지 않는다.'],
    ['AdminShell', 'sidebarValue', '선택된 사이드바 항목 값 — 위와 같다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${reason} Figma TEXT 속성은 텍스트 레이어에 바인딩돼야 존재할 수 있어 표현이 불가능하다.`,
    owner: 'sb.hong',
  })),

  // (2) 값 텍스트와 **같은 레이어**를 가리키는 두 번째 통로 — 한 텍스트 레이어에 TEXT 속성을 두 개 붙일 수 없다.
  //     (기존 MemoBox labels.* 예외와 같은 사유. 세트가 그리는 상태 쪽 prop 하나만 열었다.)
  ...[
    ['DatePicker', 'placeholder', '세트는 날짜가 선택된 필드를 그린다 — 그 글자 슬롯은 값과 플레이스홀더가 공유한다.'],
    ['KrRrnField', 'placeholder', '값이 비어 있을 때만 보이는 글자 — value TEXT와 같은 레이어다.'],
    ['KrVehicleNoField', 'placeholder', '위와 같다.'],
    ['KrPhoneField', 'placeholder', '위와 같다.'],
    ['KrAddressAutocomplete', 'placeholder', '위와 같다.'],
    ['FilterBar', 'searchValue', '검색 입력의 값 — 세트는 빈 검색칸(플레이스홀더)을 그리므로 searchPlaceholder 쪽을 열었다.'],
    ['EmptyState', 'labels.title', '개별 prop(title)과 같은 문구를 가리키는 대체 통로다 — 코드가 resolveLabel(title, L.title)로 푼다.'],
    ['EmptyState', 'labels.description', '개별 prop(description)과 같은 문구를 가리키는 대체 통로다.'],
    ['EmptyState', 'labels.actionLabel', '개별 prop(actionLabel)과 같은 문구를 가리키는 대체 통로다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${reason} 한 텍스트 레이어에 TEXT 속성 두 개를 붙일 수 없어 개별 prop 쪽만 Figma 속성으로 노출했다.`,
    owner: 'sb.hong',
  })),

  // (3) 이 세트가 아예 그리지 않는 UI — 선언하면 어떤 레이어에도 안 붙는 '유령 속성'이 된다.
  //     UI를 새로 그리는 건 "기존 세트의 모양은 바꾸지 마라" 제약과 정면으로 충돌한다(세트 확장 배치로 분리).
  ...[
    ['DatePicker', 'helperText', '세 픽커 세트는 라벨 + 닫힌 필드만 그린다 — 헬퍼 줄 자체가 없다.'],
    ['TimePicker', 'helperText', '위와 같다.'],
    ['DateRangePicker', 'helperText', '위와 같다.'],
    ['KrAddressAutocomplete', 'helperText', '이 세트는 입력 + 제안 리스트만 그린다 — 헬퍼 줄이 없다.'],
    ['Table', 'emptyText', '빈 상태는 prop이 아니라 rows=[] 데이터로 나온다 — 세트는 행이 있는 표만 그린다(DS/AdminTable과 같은 사유).'],
    ['KrAddressForm', 'value.jibun', '지번 주소는 도로명/지번 토글의 반대쪽 값이다 — 세트는 도로명 칸만 그린다.'],
    ['KrAddressForm', 'value.requestNote', "요청사항을 '직접 입력'으로 골랐을 때만 열리는 칸이라 세트에 없다."],
    ['AdminShell', 'pageTitle', 'Figma DS/AdminShell은 셸의 골격(바 + 사이드바 + 본문 블록)만 그리는 템플릿 목업이다 — 페이지 헤더를 그리지 않는다.'],
    ['AdminShell', 'pageDescription', '위와 같다.'],
    ['AdminShell', 'user.name', '셸 목업에 사용자 블록이 없다.'],
    ['AdminShell', 'user.role', '위와 같다.'],
    ['Video', 'title', 'figcaption은 title이 있을 때만 그려진다 — 세트는 캡션 없는 플레이어를 그린다(비율 축 10×2 변형의 높이가 캡션 유무로 갈리면 비율 문서가 거짓말을 한다).'],
    ['YouTube', 'title', 'iframe의 접근성 이름이다. 글자로 그려지는 건 id가 빈 폴백뿐인데, 세트는 임베드된 플레이어(검정 면 + 재생 버튼)를 그린다.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'text-missing',
    figma: null,
    code,
    reason: `${reason} 지금 선언하면 어떤 레이어에도 안 붙는 유령 속성이 된다.`,
    owner: 'sb.hong',
  })),

  // (4) ReactNode 액션 슬롯 — INSTANCE_SWAP은 '인스턴스를 다른 컴포넌트로 교체'하는 속성이지 슬롯이 아니다.
  //     (기존 AdminTopbar.actions · SearchPanel.actions 예외와 같은 사유)
  ...[
    ['AdminShell', 'actions', '셸 상단바 우측 액션 슬롯 — 화면마다 버튼 구성이 다르다.'],
    ['AdminShell', 'pageActions', '페이지 헤더 액션 슬롯 — 셸 목업에 페이지 헤더 자체가 없다.'],
    ['FilterBar', 'actions', '필터바 우측 추가 버튼 슬롯.'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'swap-missing',
    figma: null,
    code,
    reason: `${reason} INSTANCE_SWAP의 기본값이 될 수 있는 컴포넌트는 아이콘뿐이라(lib/build-set.ts의 addSwapProp: defKey → ICON_COMPONENTS) 임의의 노드 묶음을 받는 슬롯을 표현할 수 없다.`,
    owner: 'sb.hong',
  })),

  // (5) children 슬롯 — N7이 현재 검사 구조에서 충족 불가(SiteSection과 같은 사유).
  {
    component: 'AdminShell',
    kind: 'slot-missing',
    figma: null,
    code: 'children',
    reason:
      'children(셸 본문)에 대응하는 Figma 속성 타입이 없다. N7 판정은 buildSet 선언(texts/bools/swaps)의 layer만 보므로 렌더 함수의 프레임 이름을 볼 수 없다 — 바인딩할 속성이 없는 한 구조적으로 충족 불가다(검사기 수정은 scripts/ 배치 소관).',
    owner: 'sb.hong',
  },

  // (6) 축이 될 유니온/불리언 prop이 하나도 없는 컴포넌트 — Figma 세트는 베리언트 축이 최소 1개 있어야 성립한다.
  //     (기존 SortBar · SiteFooter 예외와 같은 사유. state=default는 React prop이 아니라 플랫폼 요구다.)
  ...[
    ['Timeline', 'items[]만 받는다(축이 될 prop 없음).'],
    ['Tree', 'nodes[] · selectedId만 받는다.'],
    ['KrStepIndicator', 'steps[] · current(number)만 받는다.'],
    ['KrPhoneAuth', 'prop이 콜백뿐이다.'],
    ['KrIdentityVerification', 'prop이 콜백뿐이다.'],
    ['Dashboard', 'React 템플릿에 prop이 하나도 없다.'],
    ['ListPage', '위와 같다.'],
    ['Settings', '위와 같다.'],
    ['Login', '위와 같다.'],
  ].map(([component, what]) => ({
    component,
    kind: 'axis-extra',
    figma: 'state',
    code: null,
    reason: `Figma 컴포넌트 세트는 베리언트 속성이 최소 1개 있어야 성립하는데 이 컴포넌트에는 축이 될 유니온/불리언 prop이 하나도 없다 — ${what} state=default는 대응 React prop이 아니라 플랫폼 요구다.`,
    owner: 'sb.hong',
  })),

  // (7) 배열 prop을 인덱스/칸으로 편 데모 데이터 — prop이 아니라 '데이터'다.
  //     React는 columns[] · items[] · nodes[] · slides[] · images[]를 받는다. Figma엔 배열 타입이 없어
  //     행/칸을 고정 개수로 그리고 각각을 TEXT로 열어 둔 것이라 개명할 코드 이름이 애초에 없다.
  //     (기존 AdminTable 'Row Title N' · DefinitionList 'Label N' 예외와 같은 부류)
  ...[
    ...['Head 1', 'Head 2', 'Head 3'].map((figma) => ['Table', 'text-from-list', figma, 'columns[]의 헤더']),
    ...['Title 1', 'Title 2', 'Title 3'].map((figma) => ['Timeline', 'text-from-list', figma, 'items[]의 제목']),
    ...['Node 1', 'Node 2', 'Node 3', 'Node 4', 'Node 5'].map((figma) => ['Tree', 'text-from-list', figma, 'nodes[]의 라벨']),
    // 아래 넷은 접미사/단수형이라 isIndexed(/\s\d+$/)가 못 잡아 text-extra로 떨어질 뿐 같은 부류다.
    ['Statistics', 'text-extra', 'label', 'items[] 한 칸의 라벨'],
    ['Statistics', 'text-extra', 'value', 'items[] 한 칸의 값'],
    ['Statistics', 'text-extra', 'delta', 'items[] 한 칸의 증감(items[].delta)'],
    ['Carousel', 'text-extra', 'slide', 'slides[] 한 장의 데모 내용'],
    ['ImageSlide', 'text-extra', 'Counter', 'images[]의 인덱스/총계 표시(1 / 3)'],
  ].map(([component, kind, figma, what]) => ({
    component,
    kind,
    figma,
    code: null,
    reason: `배열 prop을 고정 개수로 편 데모 데이터다(${what}) — 대응하는 React prop 이름이 존재하지 않아 개명할 수 없고, 지우면 세트가 그 내용을 보여줄 수단을 잃는다. 근본 해결(배열을 인덱스 속성으로 펴지 않는 세트 재설계)은 "모양 불변" 제약을 넘는 별도 배치다.`,
    owner: 'sb.hong',
  })),

  // (8) number prop을 축으로 이산화 — Figma에 숫자 속성 타입이 없고, 값 없이는 그릴 그림도 없다.
  ...[
    ['Progress', 'value (25|50|75|100)', '진행률 0~100 — 채움 폭이 곧 이 컴포넌트의 전부라 축이 없으면 그릴 그림이 없다. 대표 4값.'],
    ['Rating', 'value (3|4|5)', '별점 0~5 — 채워진 별 수가 곧 이 컴포넌트의 전부다. 대표 3값.'],
  ].map(([component, figma, reason]) => ({
    component,
    kind: 'axis-from-number',
    figma,
    code: 'value',
    reason: `${reason} number prop이라 유니온 축이 아니지만, Figma 세트는 축이 최소 1개 있어야 하고 이 값이 유일한 시각 축이다.`,
    owner: 'sb.hong',
  })),

  // (9) 축으로 만들면 기존 변형과 픽셀이 같은 '중복 변형'이 생겨 문서가 거짓말을 하는 것.
  //     (기존 DropZone.multiple · MemoBox.requireContent · CrudDialog.inline 예외와 같은 사유)
  ...[
    ['Rating', 'readOnly', "Rating.module.css의 .readOnly는 `cursor: default`뿐이다 — 정적 프레임에선 그림이 완전히 같다."],
    ['Table', 'compact', "@deprecated prop이다. Table.tsx:125가 `density != null ? density === 'compact' : compact`로 풀어 **같은 클래스(.compact)** 를 그린다 — density 축과 픽셀이 같은 중복 변형이 된다(8 → 16변형)."],
    ['Table', 'stickyHeader', '헤더를 스크롤에 고정하는 동작이다 — 정적 프레임에선 헤더가 똑같이 그려진다(8 → 16변형).'],
    ['TimePicker', 'minuteStep', '열린 패널의 분(分) 목록 간격이다. 세트는 닫힌 필드만 그리므로 4값 모두 그림이 같다(2 → 8변형).'],
    ['KrRrnField', 'validate', '값의 유효성으로 error/success를 **내부에서 파생시키는** 동작 prop이다(KrRrnField.tsx:61-63). 정적 세트엔 판정할 값이 없어 validate=true/false의 그림이 같다.'],
    ['KrVehicleNoField', 'validate', '위와 같다.'],
    ['KrPhoneField', 'validate', '위와 같다.'],
    ['KrRrnField', 'foreigner', "라벨·문구의 명칭만 '주민등록번호' → '외국인등록번호'로 바꾼다(KrRrnField.tsx:33 — 형식은 동일). 그 글자는 이미 label TEXT 속성으로 열려 있어 축을 더하면 기본 문자열만 다른 중복 변형이 된다."],
    ['Statistics', 'columns', '지표 카드 여러 장을 늘어놓는 그리드의 열 수다. 이 세트는 카드 **한 장**을 그리므로 1~6 어느 값이든 그림이 같다(중복 변형).'],
  ].map(([component, code, reason]) => ({
    component,
    kind: 'axis-missing',
    figma: null,
    code,
    reason,
    owner: 'sb.hong',
  })),

  // (9-b) 위 (9)와 같은 뿌리지만 방향이 반대 — 코드에 짝이 없는데 그림으로는 꼭 필요한 축.
  {
    component: 'Statistics',
    kind: 'axis-extra',
    figma: 'delta',
    code: null,
    reason:
      '증감 방향(up/down/flat)은 prop이 아니라 items[].delta의 **부호**다(양수 ▲success · 음수 ▼error). 대응하는 React prop 이름이 없어 개명할 수 없지만, 증감 표시는 이 컴포넌트의 핵심 그림이라 지울 수 없다 — 지표 카드의 대표 3그림으로 남긴다.',
    owner: 'sb.hong',
  },

  // (10) 변형 폭발 — 축을 늘리면 곱으로 터진다(권장 상한 세트당 40).
  //      DS/ImageCard는 이미 ratio(4) × layout(2) × align(3) × scrim(3) = 72변형으로 상한을 넘겨 있다.
  ...[
    ['ImageCard', 'axis-missing', null, 'rounded', '72 → 144변형. 라운드 유무는 카드 모서리 12px 차이뿐이라 비용 대비 정보량이 없다 — 기본값(true)만 그린다.'],
    ['ImageCard', 'axis-missing', null, 'fill', "72 → 144변형. fill은 '그리드 셀 폭을 꽉 채운다'는 **컨텍스트 종속** 동작(부모가 결정)이라 격리된 컴포넌트의 외형이 바뀌지 않는다 — 축 대신 문서용 BOOLEAN 속성으로만 남겼다(생성기 참조)."],
    [
      'ImageCard',
      'axis-values',
      'ratio: [16x9|4x3|1x1|21x9]',
      'ratio: [1x1|4x3|3x2|16x9|21x9|4x5|3x4|9x16|2x1|auto]',
      '10값을 다 그리면 72 → 180변형이다(권장 상한 40). 4축 곱이라 비율만 대표 4값(16x9·4x3·1x1·21x9)으로 줄였다 — DS/Image·Video·YouTube·ImageSlide는 축이 하나뿐이라 10값을 전부 그린다.',
    ],
  ].map(([component, kind, figma, code, reason]) => ({ component, kind, figma, code, reason, owner: 'sb.hong' })),

  // (11) 공용 플레이스홀더 SVG 언어의 벡터 사본이 필요한 축.
  {
    component: 'EmptyState',
    kind: 'axis-missing',
    figma: null,
    code: 'kind',
    reason:
      'kind 8종(image·video·file·empty·search·error·delete·success)은 각각 src/shared/placeholders.tsx의 SYMBOL — 64 캔버스 위의 전용 SVG 심볼 — 을 그린다. Figma 세트가 지금 그리는 아이콘은 lucide 인스턴스라, 축을 세우려면 8종 벡터를 이 생성기에 옮겨 심볼 자체를 다시 그려야 한다("기존 세트의 모양은 바꾸지 마라" 제약을 벗어난다 — 플레이스홀더 이식 배치로 분리). 그 사이 아이콘 교체는 icon INSTANCE_SWAP으로 열려 있다.',
    owner: 'sb.hong',
  },
]

// ── CLI ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(`--${n}`)
const val = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const asJson = flag('json')
const strict = flag('strict')
const updateBaseline = flag('update-baseline')
const filterComponent = val('component')
const filterRule = val('rule')?.split(',').map((s) => s.trim().toUpperCase())

// ── 수집 ─────────────────────────────────────────────────────────────
const violations = []
const errors = []
const V = (rule, kind, component, o) =>
  violations.push({ rule, kind, component, ...o })

const { specs, errors: extractErrors } = extractFigmaSets(root)
errors.push(...extractErrors)

const index = indexComponents(root)
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const setEq = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
/** 인덱스 전개 이름: 'Item 1', 'Head 2', 'Icon 3' (규약 §4·§5 위반의 표식) */
const isIndexed = (s) => /\s\d+$/.test(s) || /^Icon$/.test(s)

for (const spec of specs) {
  const setName = spec.setName
  const name = setName.replace(/^DS\//, '')
  const at = { file: spec.file, line: spec.line }

  // ── N1 §1: 세트 이름 = 'DS/<ComponentName>' ──
  if (!setName.startsWith('DS/')) {
    V('N1', 'set-name', name, { ...at, figma: setName, code: null, fix: `세트 이름을 'DS/<ComponentName>' 형식으로` })
    continue
  }
  const entry = index.get(name)
  if (!entry) {
    V('N1', 'no-code', name, {
      ...at,
      figma: setName,
      code: null,
      fix: `코드 짝(src/ds/${name}/${name}.tsx)이 없다 — 세트를 지우거나 컴포넌트를 만들어라`,
    })
    continue
  }

  // ── 코드 스펙 ──
  let parsed
  try {
    parsed = parsePropsAt(entry.tsx, root)
  } catch (e) {
    errors.push({ code: 'E-UNPARSED', file: entry.tsx, line: 0, message: `${name}: ${e.message}` })
    continue
  }
  // 분류 불가 prop을 조용히 버리지 않는다 — 이번 드리프트의 근본 원인이 "못 읽으면 통과"였다.
  for (const u of parsed.unparsed) {
    errors.push({
      code: 'E-UNPARSED',
      file: parsed.file,
      line: u.line,
      message: `${name}: prop 분류 실패 — ${u.text}`,
    })
  }
  const code = classifyProps(parsed.props)
  const { legal } = legalLayers(entry)
  const codeAt = { codeFile: parsed.file }
  // classifyProps는 왕복 동일성 때문에 line을 담지 않는다 — 원본 props에서 줄을 되찾는다.
  const lineOfProp = (n) => parsed.props.find((p) => p.name === n)?.line ?? 0
  for (const a of code.axes) a.line = lineOfProp(a.name)

  const codeAxisNames = code.axes.map((a) => a.name)
  const figAxisNames = spec.axes.map((a) => a.name)

  // ── N2 §2: VARIANT 축 이름 = React prop 이름 그대로 ──
  const axisMissing = codeAxisNames.filter((n) => !figAxisNames.includes(n))
  const axisExtra = figAxisNames.filter((n) => !codeAxisNames.includes(n))

  // 이름만 다른 1:1 개명(예: Toast tone → variant)은 missing+extra 두 건이 아니라 한 건으로 보고한다.
  const renamed = []
  if (axisMissing.length === 1 && axisExtra.length === 1) {
    const c = code.axes.find((a) => a.name === axisMissing[0])
    const f = spec.axes.find((a) => a.name === axisExtra[0])
    if (setEq(c.values, f.values)) renamed.push([c, f])
  }
  if (renamed.length) {
    const [c, f] = renamed[0]
    V('N2', 'axis-name', name, {
      ...at,
      ...codeAt,
      line: f.line,
      codeLine: c.line,
      code: c.name,
      figma: f.name,
      fix: `축 이름을 '${c.name}'로 (React prop 이름 그대로)`,
    })
  } else {
    for (const n of axisExtra) {
      const f = spec.axes.find((a) => a.name === n)
      // 더 구체적인 원인이 있으면 그걸로 보고한다(축이 "여분"인 게 아니라 잘못 승격된 것).
      if (code.numbers.includes(n)) {
        // N2d — number prop은 유니온이 아니므로 축이 될 수 없다(값을 임의 이산화한 것).
        V('N2', 'axis-from-number', name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: n,
          figma: `${n} (${f.values.join('|')})`,
          fix: `number prop은 축이 아니다 — 축을 없애고 '${n}'을 TEXT 속성으로 두거나 대표값 1개만 그려라`,
        })
      } else if (code.booleans.includes(`show${cap(n)}`)) {
        // N2e — show* boolean은 축이 아니라 BOOLEAN 속성이다.
        V('N2', 'bool-promoted-to-axis', name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: `show${cap(n)}`,
          figma: n,
          fix: `축 '${n}'을 지우고 BOOLEAN 속성 'show${cap(n)}'으로 선언`,
        })
      } else if (code.text.includes(n)) {
        // N2f — string prop은 축이 아니라 TEXT 속성이다.
        V('N2', 'text-promoted-to-axis', name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: n,
          figma: n,
          fix: `축 '${n}'을 지우고 TEXT 속성 '${n}'으로 선언`,
        })
      } else {
        V('N2', 'axis-extra', name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: null,
          figma: n,
          fix: `대응 prop이 없는 축 — 축을 지우거나 코드에 '${n}' prop을 추가`,
        })
      }
    }
    for (const n of axisMissing) {
      const c = code.axes.find((a) => a.name === n)
      V('N2', 'axis-missing', name, {
        ...at,
        ...codeAt,
        line: spec.line,
        codeLine: c.line,
        code: n,
        figma: null,
        fix: `축 '${n}' 추가 — values: [${c.values.map((v) => `'${v}'`).join(', ')}]`,
      })
    }
  }

  // N2b/N2c — 이름이 맞는 축의 값 집합 비교
  for (const f of spec.axes) {
    const c = code.axes.find((a) => a.name === f.name)
    if (!c) continue
    if (!setEq(c.values, f.values)) {
      const isBool = setEq(c.values, ['false', 'true'])
      V('N2', isBool ? 'axis-bool-values' : 'axis-values', name, {
        ...at,
        ...codeAt,
        line: f.line,
        codeLine: c.line,
        code: `${c.name}: [${c.values.join('|')}]`,
        figma: `${f.name}: [${f.values.join('|')}]`,
        fix: `축 값을 코드 유니온과 일치시켜라 — [${c.values.map((v) => `'${v}'`).join(', ')}]`,
      })
    }
  }

  // ── N3 §3: BOOLEAN 속성 이름 = React show* prop 이름 그대로 ──
  compareProps({
    ruleText: 'N3',
    kindPrefix: 'bool',
    figma: spec.bools.map((b) => ({ nameStr: b.prop, line: b.line })),
    codeNames: code.booleans,
    codeKindLabel: 'show* boolean prop',
  })

  // N3g — buildSet이 TEXT마다 자동 생성하는 유령 불리언은 대응 prop이 전혀 없다. 항상 위반.
  for (const g of spec.derivedBools) {
    V('N3', 'bool-ghost', name, {
      ...at,
      ...codeAt,
      line: g.line,
      code: null,
      figma: `${g.name} (buildSet 자동생성)`,
      fix: 'buildSet의 addBoolProp(set, `Show ${t.prop}`, …) 제거 — show* prop이 있을 때만 bools에 명시',
    })
  }

  // ── N4 §4: TEXT 속성 이름 = React prop 이름 그대로 (중첩은 점 표기) ──
  compareProps({
    ruleText: 'N4',
    kindPrefix: 'text',
    figma: spec.texts.map((t) => ({ nameStr: t.prop, line: t.line })),
    codeNames: code.text,
    codeKindLabel: 'string prop',
    // N4c — 배열 prop을 인덱스 TEXT로 전개한 것(Item 1 / Head 2)은 별도 kind로 표시한다.
    extraKind: (fname) => (isIndexed(fname) && code.lists.length ? 'text-from-list' : null),
    extraFix: () =>
      `배열 prop(${code.lists.join(', ')})은 Figma 속성으로 1:1 표현 불가 — 인덱스 전개를 없애거나 예외 선언`,
  })

  // ── N5 §5: INSTANCE_SWAP 속성 이름 = React prop 이름 그대로 ──
  compareProps({
    ruleText: 'N5',
    kindPrefix: 'swap',
    figma: spec.swaps.map((s) => ({ nameStr: s.prop, line: s.line })),
    codeNames: code.swaps,
    codeKindLabel: 'ReactNode prop',
    // N5b — 아이콘을 'Icon' 하나로 뭉개거나 인덱스로 번호 매긴 것.
    extraKind: (fname) => (isIndexed(fname) ? 'swap-indexed' : null),
    extraFix: (fname) =>
      `'${fname}'처럼 뭉뚱그리거나 번호 매긴 아이콘 금지 — 슬롯마다 실제 prop 이름으로 나눠라`,
  })

  // ── N6 §6: 레이어 이름 = 그 요소를 그리는 CSS Module 클래스 이름 ──
  // 단, 속성에 바인딩된 레이어는 그 prop 이름을 쓸 수 있다. 왜냐하면 한 CSS 클래스가 여러 슬롯을
  // 그리는 경우(Button은 leftIcon/rightIcon을 둘 다 styles.icon으로 그린다) 레이어를 클래스명으로
  // 통일하면 이름이 겹쳐 addSwapProp의 findAll(name===layer)이 두 슬롯을 한 속성에 묶어버린다
  // → §5(슬롯마다 별도 INSTANCE_SWAP)가 성립 불가능해진다. 바인딩된 레이어는 prop 이름이 정답이다.
  const layerItems = [
    ...spec.texts.map((t) => ({ layer: t.layer, prop: t.prop, line: t.line, from: 'TEXT' })),
    ...spec.bools.map((b) => ({ layer: b.layer, prop: b.prop, line: b.line, from: 'BOOLEAN' })),
    ...spec.swaps.map((s) => ({ layer: s.layer, prop: s.prop, line: s.line, from: 'INSTANCE_SWAP' })),
  ]
  // 한 레이어에 여러 속성이 붙는 건 정상이다: showLeftIcon(visible)과 leftIcon(mainComponent)은
  // 같은 아이콘 레이어를 가리킨다. 그래서 BOOLEAN의 합법 레이어는 "자기 이름"만이 아니라
  // 그 세트가 선언한 다른 속성 이름(=그 요소의 정체)도 포함한다.
  const declaredProps = new Set(layerItems.map((it) => it.prop))
  for (const it of layerItems) {
    if (!it.layer || legal.has(it.layer) || declaredProps.has(it.layer)) continue
    const cands = [...legal].filter((l) => !STRUCTURAL_LAYERS.includes(l))
    V('N6', 'layer-not-css-class', name, {
      ...at,
      ...codeAt,
      line: it.line,
      code: null,
      figma: `${it.layer} (${it.from} 레이어)`,
      fix: `레이어를 CSS 클래스명 또는 바인딩된 prop 이름('${it.prop}')으로 — CSS 후보: ${cands.slice(0, 8).join(', ') || '(CSS 없음 → root/content만)'}`,
    })
  }

  // ── N7 §7: children 슬롯 = 'content' ──
  if (code.slot === 'content') {
    const hasContentLayer = layerItems.some((it) => it.layer === 'content')
    // 슬롯을 TEXT 속성으로 잘못 선언했는지(§4b) 여부와 무관하게, content 레이어가 없으면 슬롯이 없는 것.
    if (!hasContentLayer && !spec.texts.some((t) => t.prop === 'content')) {
      V('N7', 'slot-missing', name, {
        ...at,
        ...codeAt,
        line: spec.line,
        code: 'children',
        figma: null,
        fix: `children 슬롯 — 렌더 함수에 name='content' 레이어를 두어라`,
      })
    }
  }

  /** 이름 집합 비교 공통 루틴 — 정확 일치가 판정, 정규화 매칭은 "개명이다"라고 알려줄 때만 쓴다. */
  function compareProps({ ruleText, kindPrefix, figma, codeNames, codeKindLabel, extraKind, extraFix }) {
    const figNames = figma.map((f) => f.nameStr)
    const unmatchedFig = figma.filter((f) => !codeNames.includes(f.nameStr))
    const unmatchedCode = codeNames.filter((c) => !figNames.includes(c))

    for (const f of unmatchedFig) {
      // 특수 kind(인덱스 전개/뭉뚱그린 아이콘)가 우선 — 원인을 정확히 짚어야 고칠 수 있다.
      const special = extraKind?.(f.nameStr)
      if (special) {
        V(ruleText, special, name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: null,
          figma: f.nameStr,
          fix: extraFix(f.nameStr),
        })
        continue
      }
      // 대소문자·공백만 다른 같은 이름 → 개명(-name). 통과 판정은 어디까지나 정확 일치다.
      const twin = unmatchedCode.find((c) => norm(c) === norm(f.nameStr))
      if (twin) {
        V(ruleText, `${kindPrefix}-name`, name, {
          ...at,
          ...codeAt,
          line: f.line,
          code: twin,
          figma: f.nameStr,
          fix: `'${f.nameStr}' → '${twin}' (React prop 이름 그대로)`,
        })
        unmatchedCode.splice(unmatchedCode.indexOf(twin), 1)
        continue
      }
      V(ruleText, `${kindPrefix}-extra`, name, {
        ...at,
        ...codeAt,
        line: f.line,
        code: null,
        figma: f.nameStr,
        fix: `대응 ${codeKindLabel}이 없다 — 속성을 지우거나 코드에 prop을 추가`,
      })
    }
    for (const c of unmatchedCode) {
      V(ruleText, `${kindPrefix}-missing`, name, {
        ...at,
        ...codeAt,
        line: spec.line,
        code: c,
        figma: null,
        fix: `${codeKindLabel} '${c}'에 대응하는 Figma 속성이 없다 — 선언을 추가`,
      })
    }
  }
}

// ── 예외 적용 ────────────────────────────────────────────────────────
const usedAllow = new Set()
const expired = []
const today = new Date().toISOString().slice(0, 10)
const kept = violations.filter((v) => {
  const hit = ALLOWLIST.findIndex(
    (a) =>
      a.component === v.component &&
      a.kind === v.kind &&
      a.figma === (v.figma ?? null) &&
      (a.code === undefined || a.code === v.code),
  )
  if (hit === -1) return true
  const a = ALLOWLIST[hit]
  if (a.until && a.until < today) {
    expired.push(a)
    return true
  }
  usedAllow.add(hit)
  return false
})

// 예외가 썩어서 규칙을 가리는 걸 막는다 — 미사용/만료 = 실패.
const stale = ALLOWLIST.filter((_, i) => !usedAllow.has(i)).filter((a) => !expired.includes(a))

// ── 베이스라인(있으면) — 알려진 위반은 KNOWN으로 강등해 단조 감소를 보장한다 ──
const keyOf = (v) => `${v.component}|${v.kind}|${v.figma ?? ''}|${v.code ?? ''}`
let baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : null

if (updateBaseline) {
  const keys = [...new Set(kept.map(keyOf))].sort()
  writeFileSync(BASELINE_PATH, JSON.stringify(keys, null, 2) + '\n')
  console.log(`verify-naming — baseline 갱신: ${keys.length}건 → ${BASELINE_PATH}`)
  process.exit(0)
}

const baseSet = new Set(baseline ?? [])
const known = []
const fresh = []
for (const v of kept) (baseSet.has(keyOf(v)) ? known : fresh).push(v)
// 고쳐진 항목이 baseline에 남아 있으면 실패 — 강제로 지우게 해서 120 → 0 단조 감소를 보장한다.
const liveKeys = new Set(kept.map(keyOf))
const staleBaseline = baseline ? baseline.filter((k) => !liveKeys.has(k)) : []

// ── 필터 & 출력 ──────────────────────────────────────────────────────
let shown = fresh
if (filterComponent) shown = shown.filter((v) => v.component === filterComponent)
if (filterRule) shown = shown.filter((v) => filterRule.includes(v.rule))

// dedupe: component+kind+figma
const seen = new Set()
shown = shown.filter((v) => {
  const k = keyOf(v)
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

const hardErrors = errors.filter((e) => strict || e.code !== 'W-')
const failing = shown.length > 0 || hardErrors.length > 0 || stale.length > 0 || expired.length > 0 || staleBaseline.length > 0

if (asJson) {
  console.log(
    JSON.stringify(
      {
        violations: shown,
        known: known.length,
        errors: hardErrors,
        summary: summarize(shown, known.length),
        allowlist: { applied: usedAllow.size, stale: stale.length, expired: expired.length },
        baselineStale: staleBaseline,
      },
      null,
      2,
    ),
  )
  process.exit(failing ? 1 : 0)
}

for (const e of hardErrors) {
  console.error(`FAIL  ${e.code}\n  ${e.file}:${e.line}\n  ${e.message}\n`)
}
for (const v of shown) {
  const codeLine = v.codeLine ? `:${v.codeLine}` : ''
  console.error(
    `FAIL  ${v.rule}-${v.kind}  ${v.component}\n` +
      `  code  ${v.code ?? '(없음)'}${' '.repeat(Math.max(1, 26 - String(v.code ?? '(없음)').length))}${v.codeFile ?? ''}${codeLine}\n` +
      `  figma ${v.figma ?? '(없음)'}${' '.repeat(Math.max(1, 26 - String(v.figma ?? '(없음)').length))}${v.file}:${v.line}\n` +
      `  fix   ${v.fix}\n`,
  )
}
for (const a of stale) {
  console.error(
    `FAIL  E-ALLOWLIST-STALE\n  ${a.component} / ${a.kind} / ${a.figma} — 더 이상 위반이 아니다. ALLOWLIST에서 지워라.\n`,
  )
}
for (const a of expired) {
  console.error(`FAIL  E-ALLOWLIST-EXPIRED\n  ${a.component} / ${a.kind} / ${a.figma} — until=${a.until} 만료.\n`)
}
for (const k of staleBaseline) {
  console.error(`FAIL  E-BASELINE-STALE\n  ${k} — 고쳐졌다. baseline에서 지워라(--update-baseline).\n`)
}

const s = summarize(shown, known.length)
if (failing) {
  console.error(
    `verify-naming FAIL — ${shown.length}건 / ${specs.length}세트 / 규칙 7개` +
      (known.length ? ` (KNOWN ${known.length}건은 baseline으로 강등)` : '') +
      `\n  by rule : ${s.byRule}\n  by file : ${s.byFile}\n` +
      `  allowlist: ${usedAllow.size}건 적용, ${stale.length}건 stale\n` +
      (hardErrors.length ? `  errors  : ${hardErrors.length}건 (E-UNPARSED/E-COVERAGE — 파서가 못 읽은 선언)\n` : ''),
  )
  process.exit(1)
}
console.log(
  `verify-naming OK — ${specs.length}세트, 이름 규약(N1~N7) 위반 0건` +
    (known.length ? ` (baseline KNOWN ${known.length}건)` : '') +
    `\n  allowlist ${usedAllow.size}건 적용 · 미파싱 0건 · 커버리지 ${specs.length}/${specs.length}`,
)

function summarize(list, knownCount) {
  const byRule = {}
  const byFile = {}
  for (const v of list) {
    byRule[v.rule] = (byRule[v.rule] || 0) + 1
    const f = v.file.split('/').pop()
    byFile[f] = (byFile[f] || 0) + 1
  }
  const fmt = (o) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ') || '없음'
  return { byRule: fmt(byRule), byFile: fmt(byFile), known: knownCount, total: list.length }
}
