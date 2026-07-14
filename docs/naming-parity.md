# 네이밍 파리티 규약 — 코드가 단일 출처, Figma가 그대로 따른다

React 컴포넌트의 **prop 이름**과 **CSS Module 클래스 이름**이 정답이다.
Figma 생성기(`figma-plugin/src/generators/*.ts`)의 선언은 그것을 **한 글자까지 그대로** 따라야 한다.

게이트: `pnpm verify:naming` (실패 시 exit 1)
그리고 그 이름을 **화면이 실제로 부르는지**는 `pnpm verify:screens`가 본다(아래 §화면 조립 게이트).

---

## 왜 이 문서가 필요한가

Figma 속성 이름이 `Label`, `Show Left Icon`, `Helper` 처럼 사람이 읽기 좋은 표기로 흘러가 있었다.
코드는 `label`, `showLeftIcon`, `helperText` 다. 이름이 다르면:

- 디자이너가 Figma에서 고른 속성이 코드의 어느 prop인지 **기계적으로 알 수 없다**.
- Figma → 코드 자동 생성/동기화가 **매번 사람의 번역을 요구**한다.
- 그 번역 규칙이 컴포넌트마다 달라 시간이 지나면 **아무도 신뢰하지 않는 매핑**이 된다.

기존 `verify-mapping`이 이 드리프트를 못 잡은 이유는 관대해서가 아니라 **엉뚱한 걸 봐서**다.
검사 대상이던 `components.ts`의 `COMPONENT_MANIFEST`는 그 자체가 `src/ds` props에서 파생된 값이라
**코드 ↔ 코드를 비교하는 동어반복**이었고, 유일한 소비자 `generateComponents`는 `ui.html`이
`components: false`로 못박아 **실행되지도 않는 그림자 선언**이었다.
지금은 실제 Figma를 그리는 `categories/admin/site.ts`의 `buildSet(...)` 선언만 본다.

---

## 규약 7개

| # | 대상 | 규칙 | 예 |
|---|---|---|---|
| **§1** | 컴포넌트 세트 | `DS/<ComponentName>` — React 컴포넌트 이름 그대로 | `DS/Button` |
| **§2** | VARIANT 축 | 축 이름 = **prop 이름 그대로**, 값 = 유니온 값 문자열 그대로. boolean prop이 축이면 값은 `false`/`true` | `variant: primary\|secondary`, `disabled: false\|true` |
| **§3** | BOOLEAN 속성 | **`show*` prop 이름 그대로**. `Show Label` 같은 임의 표기 금지 | `showLeftIcon` (✗ `Show Left Icon`) |
| **§4** | TEXT 속성 | **prop 이름 그대로**. 중첩 `labels` 객체는 점 표기로 평탄화 | `helperText` (✗ `Helper`), `labels.columns.name` |
| **§5** | INSTANCE_SWAP | **prop 이름 그대로**. 아이콘이 여러 개면 `Icon` 하나로 뭉뚱그리지 않고 슬롯마다 나눈다 | `leftIcon` / `rightIcon` (✗ `Icon`, ✗ `Icon 1`) |
| **§6** | 레이어 | 그 요소를 그리는 **CSS Module 클래스 이름 그대로**. 클래스 없는 순수 구조 프레임만 `root`/`content` | `.overlayTitle` → 레이어 `overlayTitle` |
| **§7** | 슬롯(children) | `content` | |

### §6의 단서 — 속성에 바인딩된 레이어

한 CSS 클래스가 **여러 슬롯**을 그리는 경우가 있다. `Button`은 `leftIcon`과 `rightIcon`을
**둘 다 `styles.icon`으로** 그린다. 레이어를 클래스명(`icon`)으로 통일하면 이름이 겹쳐
`addSwapProp`의 `findAll(name === layer)`가 두 슬롯을 **한 속성에 묶어버린다** → §5가 성립 불가능해진다.

그래서 **속성에 바인딩된 레이어는 그 속성(prop) 이름을 쓴다.**

```ts
// Button — 아이콘 레이어는 CSS 클래스(.icon)가 아니라 prop 이름을 쓴다.
// showLeftIcon(visible)과 leftIcon(mainComponent)이 같은 레이어를 가리키는 건 정상이다.
bools: [{ prop: 'showLeftIcon', layer: 'leftIcon', def: false }],
swaps: [{ prop: 'leftIcon',     layer: 'leftIcon', defKey: '_Icon/Star' }],
```

즉 합법 레이어 = **(CSS 클래스 ∩ TSX에서 실제 쓰는 클래스) ∪ 그 세트가 선언한 속성 이름 ∪ `root`/`content`**.
(선언만 있고 안 쓰는 죽은 CSS 클래스는 합법 레이어가 아니다.)

---

## 규칙 코드 N1~N7

`verify-naming`이 내는 위반 코드다. 비교는 **문자열 정확 일치**다 —
`camelCase → "Title Case"` 같은 정규화 함수는 **넣지 않는다**(그걸 넣는 순간 규약이 사라진다).
대소문자·공백만 다른 짝은 `-name`으로 **리포트만** 친절하게 해줄 뿐, 통과 판정은 정확 일치다.

| 코드 | 뜻 |
|---|---|
| `N1-set-name` / `N1-no-code` | 세트 이름이 `DS/<X>`가 아니거나, 코드 짝이 없다 |
| `N2-axis-missing` / `-extra` / `-name` | 축이 코드에만·Figma에만 있거나, 이름이 다르다 |
| `N2-axis-values` / `-axis-bool-values` | 축 이름은 맞는데 값 집합이 다르다 |
| `N2-axis-from-number` | `number` prop을 축으로 썼다(값을 임의 이산화 — `value: '25'\|'50'\|'75'`) |
| `N2-bool-promoted-to-axis` | `show*` boolean을 축으로 승격했다(`showFooter` → 축 `footer`) |
| `N2-text-promoted-to-axis` | `string` prop을 축으로 썼다(`label` → `false`/`true` 축) |
| `N3-bool-name` / `-missing` / `-extra` | BOOLEAN 이름이 `show*` prop과 다르다/없다/여분이다 |
| `N3-bool-ghost` | **대응 prop이 전혀 없는 유령 불리언** (아래 참조) |
| `N4-text-name` / `-missing` / `-extra` | TEXT 이름이 prop과 다르다/없다/여분이다 |
| `N4-text-from-list` | 배열 prop을 인덱스 TEXT로 전개했다(`Item 1`, `Head 2`) |
| `N5-swap-name` / `-missing` / `-extra` | INSTANCE_SWAP 이름이 prop과 다르다/없다/여분이다 |
| `N5-swap-indexed` | 아이콘을 `Icon` 하나로 뭉갰거나 번호를 매겼다(`Icon 1`, `Icon 2`) |
| `N6-layer-not-css-class` | 레이어가 CSS 클래스도, 선언된 속성 이름도 아니다 |
| `N7-slot-missing` | `children`이 있는데 `content` 레이어가 없다 |

### N3-bool-ghost — 없앤 유령 불리언

`buildSet`이 **TEXT 속성마다** `Show <prop>` 불리언을 자동 생성하고 있었다:

```ts
props.texts?.forEach((t) => {
  addTextProp(set, t.prop, t.layer, t.def)
  addBoolProp(set, `Show ${t.prop}`, t.layer, true)   // ← 대응 React prop이 없는 유령
})
```

이 한 줄이 `categories/admin/site/admin2.ts` **4곳에 복붙**돼 있어서, 한 곳만 고쳐도 나머지가 계속
위반을 증식시켰다. 텍스트 하나당 유령 하나 → 혼자서 **231건**이었다. 지금은 제거했다.
텍스트 on/off가 필요하면 **코드에 `show*` prop을 만들고** `props.bools`에 명시적으로 선언하라.

---

## 예외 선언 (ALLOWLIST)

예외는 `scripts/verify-naming.mjs` 상단 `ALLOWLIST` **한 곳에만** 쓴다.
**사유·소유자 없이 추가 금지.**

```js
const ALLOWLIST = [
  {
    component: 'Breadcrumb',
    kind: 'text-from-list',   // 위반 kind (필수)
    figma: 'Item 1',          // Figma 이름 (필수, 정확 일치 — 와일드카드 금지)
    code: 'items',            // 코드 이름 (선택, 있으면 함께 매칭)
    reason: '배열 prop은 Figma 속성으로 1:1 표현 불가 — 인덱스 TEXT 전개 유지',
    owner: 'sb.hong',
    until: '2026-12-31',      // 선택. 지나면 실패
  },
]
```

- **미사용 항목 = 실패**(`E-ALLOWLIST-STALE`). 예외가 썩어서 규칙을 가리는 걸 막는다.
- **만료 = 실패**(`E-ALLOWLIST-EXPIRED`).

현재 ALLOWLIST는 404건이다. 대부분(341건)은 Figma 컴포넌트 속성 타입(VARIANT/TEXT/BOOLEAN/
INSTANCE_SWAP) 네 가지로는 애초에 표현 못 하는 **영구(permanent)** 면제다 — 숫자 prop, 배열을
인덱스로 편 데모 데이터, ReactNode 슬롯(아이콘 외 INSTANCE_SWAP 기본값 불가), 화면에 안 그려지는
문자열(접근성 이름 등), 이미지/미디어 URL, 플랫폼이 요구하는 최소 1개 축 등. 나머지 63건은
**연기(deferred)** — 아래 §연기 항목 참조.

---

## 연기(deferred) 항목 — "표현 불가"와 "지금은 미룸"을 구분한다

ALLOWLIST의 예외는 전부 `reason`이 있지만, 그 이유는 두 갈래로 다르다:

- **permanent** — Figma가 그 개념 자체를 **영원히** 표현 못 한다(숫자 prop, 배열, ReactNode 슬롯,
  화면에 안 그려지는 문자열, 데이터 등). 세트를 아무리 다시 그려도 사라지지 않는다.
- **deferred** — 지금 표현 못 하는 이유가 "지금 이 세트/이 검사기를 손대면 모양이 바뀌거나
  (세트 확장·재설계가 필요) 이 저장소의 검사 도구가 아직 그 대응을 못 읽어서"다. **언젠가는
  해소해야 한다** — 영구 면제로 조용히 굳으면 안 된다.

`scripts/verify-naming.mjs`의 `DEFERRED` 목록이 `component·kind·figma·code` 키로 ALLOWLIST 항목에
`lifecycle: 'deferred'` · `blockedBy` · `unblockedBy`를 붙인다(나머지는 전부 `lifecycle: 'permanent'`).
요약 줄이 매번 건수를 찍는다 — **연기 항목이 안 보이면 영구 면제로 굳는다**는 것이 이 구분의 핵심이다:

```
verify-naming OK — 137세트, 이름 규약(N1~N7) 위반 0건
  allowlist 446건 적용 · 미파싱 0건 · 커버리지 137/137
  allowlist 446건 (영구 386 · 연기 60) — 연기 항목은 docs/naming-parity.md 참조
```

(정확한 최신 수치는 `node scripts/verify-naming.mjs`를 직접 돌려서 확인하라 — 이 표는 예시일 뿐이고
ALLOWLIST가 바뀔 때마다 사람이 손으로 갱신해야 하므로 항상 최신이라는 보장이 없다.)

`DEFERRED`에 적었는데 ALLOWLIST에 같은 키가 없으면(오타이거나 이미 해소된 것) `E-ALLOWLIST-STALE`과
같은 원리로 `E-DEFERRED-STALE`이 실패시킨다 — 이 목록도 썩으면 안 된다.

### 연기 항목 표

| 그룹 | 컴포넌트 · 속성 | 무엇이 막혔나 | 무엇이 생기면 풀리나 | 건수 |
|---|---|---|---|---|
| A | `AdminTable`(columnPicker·exportable·loading·emptyKind·emptyText·emptyDescription·loadingLabel·showEmptyDescription·kebabIcon·dragIcon·csvIcon·excelIcon·columnPickerIcon), `SearchPanel`(collapsible·defaultCollapsed·expandLabel·collapseLabel·collapseIcon), `ActivityLog`(emptyText), `MemoBox`(emptyText·composer·labels.itemActions.group/view/edit/delete·value), `DropZone`(showError·errorIcon), `StatusTimeline`(skippedIcon), `AdminCard`(emptyThumbnailLabel) | figma-plugin 세트 확장 배치(생성기 `admin.ts`) — 툴바·로딩·빈 상태·접기 토글 UI 자체가 Figma 세트에 없다. 담당자 미배정 | 이 UI(툴바·로딩·빈 상태·접기 토글 등)를 DS 세트에 실제로 그리는 후속 배치가 실행되면 | 30 |
| B | `ActionSheet`(title), `Footer`(description), `Header`(description), `Breadcrumb`(separator) | figma-plugin 세트 확장 배치(생성기 `categories-nav-overlay.ts`) — 제목 줄·설명 줄·문자열 구분자가 세트에 없다. 담당자 미배정 | 그 UI를 세트에 실제로 그리는 후속 배치가 실행되면 | 4 |
| C | `DatePicker`·`TimePicker`·`DateRangePicker`·`KrAddressAutocomplete`(helperText), `Table`(emptyText), `KrAddressForm`(value.jibun·value.requestNote), `AdminShell`(pageTitle·pageDescription·user.name·user.role), `Video`(title), `YouTube`(title) | figma-plugin 세트 확장 배치(생성기 `categories-data-kr-media.ts`) — 헬퍼 줄·지번 토글·페이지 헤더·캡션 UI가 세트에 없다. 담당자 미배정 | 그 UI를 세트에 실제로 그리는 후속 배치가 실행되면 | 13 |
| D | `DefinitionList`(columns·layout·align), `TodoSummary`(layout), `SearchPanel`(columns) | figma-plugin 세트 재설계(레이아웃 엔진) — 축을 그대로 추가하면 최대 144변형(권장 상한 40 초과) | 세트 몸통을 grid/inline/stacked 등 레이아웃별로 재설계(또는 별도 세트로 분리)하면 | 5 |
| E | `ProductCard`(ratio) | `scripts/lib/ds-props.mjs` 파서 — `Extract<MediaRatio, …>` 타입 별칭을 union으로 해석하지 못해 "여분 축"으로 오판 | 파서가 TS `Extract<>` 별칭을 해석하도록 확장되면(자동 해소) | 1 |
| F | `CrudDialog`·`DropZone`·`Upload`·`Drawer`·`AdminShell`(children) | **2026-07 부분 해소.** N7이 이제 `buildSet`의 `render` 콜백을 따라가 렌더 함수 본문의 `name='content'` 프레임도 인정한다(`scripts/lib/figma-sets.mjs`의 `detectContentFrame`) — `SiteSection`은 그걸로 해소돼 이 그룹에서 빠졌다(렌더 함수에 `fixedFrame('content', …)`가 있었다). 남은 다섯은 렌더 함수 자체에 `'content'`라는 이름의 노드가 없다(각각 `body`·컴포넌트 루트·`dropzone`·`nav` 반복·`main`) — **검사기가 아니라 생성기 쪽**이 막고 있다 | 해당 렌더 함수가 그 프레임(또는 새 자리표시 프레임)의 이름을 `'content'`로 바꾸면(figma-plugin 소관) | 5 |
| G | `Card`·`Modal`·`Popover`·`BottomSheet`(content) | `scripts/lib/ds-props.mjs`의 `classifyProps` — `children`을 `code.slot`으로만 분류해 `code.text` 후보에서 제외(§7을 지킬수록 `text-extra`가 된다) | `classifyProps`가 §7 `content` 레이어와 짝지어진 `children`을 `code.text` 후보로도 인정하면 | 4 |
| D2 | `InputBase`(readOnly·required) | figma-plugin `DS/InputBase` 변형 예산 — 지금 24변형(size×error×success×disabled)에 readOnly·required 중 하나만 더해도 48로 상한(40)을 넘는다. 둘 다 실제로 그림이 바뀌는 진짜 축 후보다(`.readOnly` 배경·`.required` 별표) — "표현 불가"가 아니라 "변형 예산 재설계 필요" | 기존 축을 접어(예: error/success를 상호 배타 state 축 하나로 합치는 등) 여유를 만들거나 세트당 상한을 재검토하면 | 2 |

합계 60건(2026-07: EraTimeline.ratio가 실제로 축이 세워져 이 표에서 해소·제외됐다 — 축소 4값이라는
남은 문제는 §연기가 아니라 §permanent axis-values로 옮겨졌다, ALLOWLIST 본문 참고). A·B·C는 "세트가 아예 그리지 않는 UI"라는
같은 뿌리를 생성기 파일별로 나눈 것이고, D·D2는 세트 재설계(레이아웃 엔진 · 변형 예산)가 필요한
것, E·G는 이 저장소 자신의 파서(`scripts/lib/ds-props.mjs`)가 아직 못 읽는 것, F는 생성기가
`content` 이름을 아직 안 붙인 것이다 — F는 이제 **검사기가 아니라 figma-plugin 쪽**을 고쳐야 풀린다
(N7 자체는 이미 고쳐졌다 — `SiteSection`이 그 증거다).

---

## baseline — 구조적 격차의 동결

이름만 고쳐서는 해소되지 않는 위반이 있다. 예를 들어:

- `Chip.size`, `Avatar.shape`, `Radio.direction` — **코드엔 축이 있는데 Figma에 없다**(`axis-missing`)
- `Select.open`, `Tab.active` — **Figma에만 있는 상태 축**(`axis-extra`)
- `Breadcrumb.items[]`, `Table.columns[]` — 배열 prop의 인덱스 전개(`text-from-list`)
- `Progress.value`, `Slider.value` — `number` prop을 축으로 이산화(`axis-from-number`)

이건 **세트의 모양·동작을 바꾸는 설계 결정**이지 개명이 아니다.
그래서 `scripts/.naming-baseline.json`에 동결해두고 `KNOWN`으로 강등한다(exit 0에 영향 없음).

- baseline에 **없는** 새 위반만 FAIL → **새 드리프트는 즉시 막힌다.**
- 고쳐진 항목이 baseline에 남아 있으면 **실패**(`E-BASELINE-STALE`) → 강제로 지우게 해서
  **단조 감소**를 보장한다. 되돌아갈 수 없다.
- 0이 되면 baseline 파일과 관련 코드를 삭제한다.

```bash
node scripts/verify-naming.mjs --update-baseline   # 고친 만큼 줄인다
```

---

## CLI

| 플래그 | 동작 |
|---|---|
| (없음) | 위반 있으면 exit 1 |
| `--json` | `{ violations, summary, ... }` stdout |
| `--component=Button` | 컴포넌트 필터 |
| `--rule=N3,N6` | 규칙 필터 |
| `--strict` | 경고 규칙도 실패로 승격 |
| `--update-baseline` | baseline 갱신 |

---

## 화면 조립 게이트 — verify-screen-props

게이트: `pnpm verify:screens` → `scripts/verify-screen-props.mjs` (실패 시 exit 1)

### 왜 필요한가 — `inst()`는 warn-and-ignore다

화면 생성기(`screens.ts` · `site-screens.ts`)는 컴포넌트 세트를 인스턴스로 꺼내 화면을 조립한다:

```ts
inst(ctx, 'DS/ProductCard', {
  variant: { ratio: '3x4', soldOut: 'false' },
  props:   { brand: p.brand, name: p.name, price: p.price },   // ← 세트의 속성 이름
})
```

`props`의 키는 **세트가 선언한 속성의 표시 이름**이어야 한다. 그런데 `inst()`의 구현은 이렇다:

```ts
const key = keys[name]                 // propKeys(set) — 표시 이름 → 'price#12:3'
if (key) props[key] = given[name]
else missing.push(name)                // ← 모르는 이름은 여기로. 그리고 warning 하나 남기고 끝.
```

즉 **세트의 속성 이름을 바꾸면 화면의 오버라이드가 조용히 끊긴다.**
예외도 안 나고, 타입도 안 깨지고(키가 `Record<string, string｜boolean>`이다), 화면은 멀쩡히 그려진다.
다만 **세트 기본값이 그대로 남는다.**

> **실제 사고.** `ProductCard`의 `Price` 속성을 `price`로 개명하자 상품 카드 **10장이 전부 세트 기본가**로
> 렌더됐다(세일가 표기 소실). `MemoBox`의 `Counter`·`Save`, `DropZone`의 `Action` ×3도 같은 방식으로 끊겼다.
> **게이트 5개가 전부 초록이었다.** 그들은 "세트 선언 ↔ React 코드"만 보고, 화면이 그 세트를
> **어떤 이름으로 부르는지**는 아무도 보지 않았기 때문이다. 사람이 눈으로 21건을 찾아 고쳤다.
>
> 그리고 그 21건은 전부가 아니었다. 이 게이트를 처음 돌리자 **사람이 놓친 6건**이 즉시 나왔다 —
> `SiteHeader.Brand`·`Action`, `SiteFooter.Brand`·`Copyright`, `SortBar.'Total Label'`·`Count`.
> 그중 `SortBar.Count: '10개'`는 눈에 보이는 버그였다: 쇼핑 화면은 상품을 10장 그리는데
> 정렬 바는 세트 기본값 **"6개"** 를 그리고 있었다.

`site-screens.ts`의 `swaps` 경로는 더 나쁘다 — 키를 못 찾으면 **warning조차 없이** 통째로 삼킨다.

### 무엇을 검사하는가

| 규칙 | 검사 |
|---|---|
| **S1** `set-missing` | `inst()`의 대상 세트가 **그 화면이 닿을 수 있는 레지스트리**에 실재하는가 |
| **S2** `props-unknown` | `props: {...}`의 키가 세트의 TEXT/BOOLEAN/INSTANCE_SWAP/VARIANT 속성에 실재하는가 |
| **S3** `variant-unknown` / `-wrong-type` | `variant: {...}`의 키가 세트의 **VARIANT 축 이름**인가 |
| **S4** `variant-value` | `variant` 값이 그 축의 값 집합에 있는가 (정적으로 읽히는 값만) |
| **S5** `swaps-unknown` | `swaps: {...}`의 키가 세트의 **INSTANCE_SWAP** 속성인가 |

S3/S4가 왜 실패인가: 축이 아닌 이름이나 없는 값을 `variant`에 넣으면 `setProperties`가 **던진다**.
`inst()`는 그 예외를 `catch`로 삼키므로 **그 인스턴스의 오버라이드가 전부** 날아간다(일부가 아니라 전부).

세트 스펙은 **`scripts/lib/figma-sets.mjs`를 그대로 재사용**한다 — `verify-naming`이 쓰는 바로 그 추출기다.
파서를 복제하지 않는다(CLAUDE.md §0-2: 같은 값을 두 곳에 적으면 두 값은 갈라진다).

### 화면 ↔ 레지스트리 짝

`SCREEN_FILES`가 짝을 못박는다. 이 짝은 임의가 아니라 **코드가 정한다**:

| 화면 생성기 | import | 닿을 수 있는 세트 |
|---|---|---|
| `screens.ts` | `ADMIN_SETS` from `./admin` | `admin.ts`의 `buildSet` 세트만 |
| `site-screens.ts` | `SITE_SETS` from `./site` | `site.ts`의 `buildSet` 세트만 |

그래서 `screens.ts`가 `'DS/SiteHeader'`를 부르면 런타임엔 `null` → 폴백이다. **S1**이 그걸 잡는다.

### 조용한 통과 금지 (여기서도)

- `E-UNPARSED` — 정적으로 못 읽은 `inst()` 호출(동적 세트 이름 · 스프레드 · 계산된 키 · 객체 리터럴이 아닌 opts)은
  **개수를 출력하고 exit 1** 한다. "검사하지 않아서 통과"가 이번 사고의 뿌리다 — 검사기가 그걸 반복하면 안 된다.
- `E-UNREGISTERED-SCREEN` — `SCREEN_FILES`에 없는 생성기에 `inst()` 호출이 생기면 실패.
  새 화면 파일을 만들고 등록만 안 하면 위반이 조용히 0으로 떨어진다(고쳐서가 아니라 안 봐서).
- `E-NO-CALLS` — 등록된 화면 파일의 `inst()` 호출이 0건이면 실패(헬퍼 이름이 바뀌어 검사기가 눈이 먼 것).
- `E-NO-SETS` — 레지스트리에서 세트를 하나도 못 뽑으면 실패(대조할 기준이 없다 = 검사되지 않았다).
- 새 `InstOpts` 버킷이 생겼는데 `BUCKETS`에 없으면 `E-UNPARSED`. 그 버킷이 영영 안 보이는 걸 막는다.

CLI: `--json` · `--file=site-screens.ts`

### 문서(variantItem) states 대조 — 같은 검사기, 다른 조립 통로

`inst()`가 **화면**에서 세트를 조립한다면, `variantItem(ctx, set, state)`는 **문서 페이지**에서 같은 일을
한다(`categories-core.ts` 등 5개 생성기가 컴포넌트별 예시 그림을 그릴 때 호출). `state.props`/`texts`/`swaps`도
`inst()`의 `props`와 똑같이 **표시 이름**으로 세트를 되묻고, `lib/build-set.ts`의 `resolveStateProps`도
`inst()`와 똑같이 **모르는 이름은 경고만 남기고 무시**한다 — 오타(`showFotter`)나 없는 축 값(`size: 'xl'`)을
넣어도 그 그림은 조용히 세트 기본값으로 렌더된다. `verify-screen-props`가 이 통로도 함께 본다:

| 규칙 | 검사 |
|---|---|
| **D1** `doc-state-unknown` | `states`의 `props`/`texts`/`swaps` 키가 그 세트에 실재하는 속성인가 |
| **D2** `doc-state-bad-bool` | BOOLEAN 속성 값이 `'true'`/`'false'` 문자열인가 |
| **D3** `doc-state-bad-variant-value` | VARIANT 축 값이 그 축의 값 집합에 있는가 |

`states`는 세트를 만드는 `buildSet` 호출과 **같은 doc 리터럴**에 선언되므로 `setName` 매칭은 필요 없다
(`figma-sets.mjs`의 `resolveDocStates`가 그 자리에서 그대로 읽는다). 예외는 `krFieldDoc`처럼 `states`를
함수 본문에서 조건부로 조립하는 팩토리뿐 — `makeInputSet`과 같은 원칙(재현 + 지문가드, 어긋나면
`E-ADAPTER-STALE`)으로 대응한다. 못 찾거나 못 읽은 states는 조용히 건너뛰지 않고 `E-UNPARSED-STATES`로 실패시킨다.

---

## 게이트 역할 분담

| | **verify-mapping** | **verify-naming** | **verify-screen-props** |
|---|---|---|---|
| 질문 | "있어야 할 게 다 있고, 없어야 할 게 없는가" | "이름이 코드와 한 글자까지 같은가" | "**화면이 그 이름으로 부르고 있는가**" |
| 대상 | 실물 생성기 세트 ↔ `src/ds/*` 커버리지, 세트 중복, P3 매니페스트 동기 | 동일 세트의 **이름 문자열** (N1~N7) | 화면 생성기의 `inst()` 오버라이드 ↔ 세트 속성 (S1~S5) |
| 예외 | — | ALLOWLIST + baseline | — (예외 없음) |

세 게이트 모두 **`scripts/lib/figma-sets.mjs`(실물 생성기 AST 추출기)** 를 공유한다.

**셋이 다 있어야 하는 이유**: `verify-naming`은 세트 선언과 React 코드가 같은 이름을 쓰는지만 본다.
그 이름을 **소비하는 쪽**(화면)은 안 본다. 그래서 세트를 규약에 맞게 개명하면 `verify-naming`은
**초록으로 바뀌면서 동시에 화면을 깨뜨린다** — 개명이 규약 준수인 동시에 사고인 것이다.
`verify-screen-props`가 그 뒷면을 맡는다.

---

## 조용한 통과 금지

이번 드리프트가 오래 살아남은 근본 원인은 **"못 읽으면 통과"** 였다.
그래서 파서는 실패를 삼키지 않는다:

- `E-UNPARSED` — `buildSet` 인자나 `Props` 타입을 못 읽으면 **위반으로 올린다**(`continue` 금지).
- `E-COVERAGE` — 파일의 `buildSet` 호출 수와 추출된 세트 수가 다르면 **실패**. 파서가 조용히 놓치는 걸 막는 안전핀.
- `E-ADAPTER-STALE` — `makeInputSet`(명령형 조립이라 리터럴이 아니다)의 파생 규칙을 추출기가
  **재현**하고 있는데, 원본 함수가 바뀌면 재현이 낡았다는 뜻이므로 실패시켜 어댑터를 고치라고 강제한다.

`verify-screen-props`도 같은 원칙을 따른다 — 못 읽은 `inst()` 호출은 **개수를 출력하고 실패**한다.
그리고 그 게이트가 막는 병 자체가 **"조용한 통과"의 런타임 버전**이다: `inst()`는 모르는 속성 이름을
경고만 하고 무시하므로, 검사기가 없으면 화면은 **끊긴 채로 계속 초록**이다(§화면 조립 게이트).

`scripts/lib/` 구성:

```
ds-props.mjs     React props 파서(AST) + 규약 분류 + strict unparsed
css-classes.mjs  CSS Module 클래스 집합(선언 ∩ 사용)
figma-sets.mjs   생성기 AST → FigmaSpec[] (buildSet + INPUTS 어댑터 + 팩토리 인스턴스화)
```
