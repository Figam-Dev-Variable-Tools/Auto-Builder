# Design System Hub-Tools — 작업 규약

Storybook(React) ↔ Figma(플러그인 생성기)가 **같은 토큰·같은 이름·같은 변형**으로 맞물리는 디자인 시스템이다.
React가 단일 출처이고 Figma는 그것을 미러링한다. 이 문서의 규칙은 **협상 대상이 아니다**.

---

## 0. 절대 규칙 (어기면 그 작업은 실패다)

### 0-0. git 상태를 바꾸는 명령 금지 ⛔ (여러 에이전트가 같은 워크트리를 공유한다)

**절대 실행하지 마라:**
```
git stash        git stash pop     git checkout -- .    git checkout <branch>
git reset --hard git restore .     git clean            git rebase / merge
```
이 워크트리에서는 **여러 에이전트가 동시에 서로 다른 폴더를 편집한다.**
위 명령은 네 폴더만이 아니라 **모든 에이전트의 미커밋 작업을 통째로 날린다.**

> 실제 사고: 한 에이전트가 "게이트 기준선을 잡겠다"며 `git stash`를 실행해
> **다른 에이전트 53개 파일의 작업이 HEAD로 되돌아갔다.** 되돌아간 파일도 타입체크는 통과하므로
> 아무도 알아채지 못한 채 "완료" 보고가 나갔다. 복구에 사람이 개입해야 했다.

**허용되는 것**: `git status`, `git diff`, `git log`, `git show`, `git stash list` (읽기 전용)
**기준선이 필요하면**: 파일을 복사해 두거나(`cp`), `git show HEAD:<path>` 로 원본을 읽어라. 워크트리를 건드리지 마라.
**커밋/푸시는 오케스트레이터(메인)만 한다.**

### 0-1. 하드코딩 금지
- **색·크기·간격·라운드·폰트를 리터럴로 쓰지 마라.** `#3D6BFF`, `16px`, `font-weight: 700` 전부 금지.
  → `var(--ds-color-primary)`, `var(--ds-spacing-4)`, `var(--ds-font-weight-bold)`.
- **사용자에게 보이는 문구를 컴포넌트 안에 박지 마라.** 전부 prop(`labels`)으로 열고 기본값만 상수로 둔다(§3).
- **매직 넘버 금지.** `20`, `1439`, `0.68` 같은 값은 이름 있는 상수로 만들고 **왜 그 값인지** 주석을 달아라.
- Figma 생성기도 같다 — **raw hex 금지**, 반드시 Figma Variables에 바인딩한다.

### 0-2. 이미 있는 것을 두고 새로 만들지 마라 (중복 생성 금지)
- 컴포넌트를 만들기 전에 **반드시 먼저 찾아라**: `ls src/ds/` → `grep -rn "비슷한이름" src/ds/`.
- 표·빈 상태·행 액션·툴바·확인창·배지·업로드·타임라인은 **이미 있다**(§4 목록).
  비슷한 걸 새로 그리는 대신 **기존 것에 옵셔널 축을 추가**하라.
- 타입·상수·헬퍼도 마찬가지다. 문구 타입은 `src/shared/labels.ts`, 토큰은 `tokens/*.json`,
  아이콘은 lucide-react, 목이미지는 `src/shared/mediaMock.ts`가 **단일 출처**다.
- 같은 값을 두 곳에 적지 마라. 두 번째로 적는 순간 두 값은 갈라진다.
  (실제 사고: 사이트 GNB 메뉴가 `site.ts`와 `site-screens.ts`에 중복 선언돼 서로 어긋났다.)
- 정말 새 컴포넌트가 필요하다면, **왜 기존 것으로 안 되는지 한 문장으로 설명할 수 있어야** 한다. 못 하면 만들지 마라.

### 0-3. 클린 코드
- **죽은 코드는 즉시 지운다.** 안 쓰는 export·헬퍼·CSS 클래스·주석 처리된 코드를 남기지 마라.
  (실제 사고: `admin2.ts`의 생성기 6개는 아무도 호출하지 않는데 1,076줄이 살아 있었다.)
- 마크업을 옮겼으면 **그 CSS도 함께 옮기거나 지운다.** 죽은 클래스는 다음 사람을 속인다.
- 함수 하나는 한 가지 일만. 화면 파일에는 **컬럼 배열 · 상태 맵 · 문구 기본값**만 남는 것이 정상이다.
- 우회로(래퍼 div·sr-only CSS·keydown 가로채기)를 만들고 싶으면 그건 **컴포넌트에 축이 빠졌다는 신호**다.
  우회하지 말고 축을 추가하거나 보고하라.
- 주석은 한국어로, **"무엇을"이 아니라 "왜"** 를 적어라. 코드가 말하는 것을 반복하지 마라.

### 0-4. 할루시네이션 방지
- **추측 금지.** prop·클래스·토큰 이름을 기억이나 관례로 지어내지 마라. 항상 `grep`으로 확인하고 인용하라.
- **"아마 있을 것"으로 쓰지 마라.** 없는 prop을 호출하면 타입체크가 잡지만, 없는 *동작*을 가정하면 아무도 못 잡는다.
- **주석이 "왜 이렇게 안 했는지" 말하고 있으면 그 결정을 존중하라.** 되돌리려면 그 이유가 지금도 유효한지 먼저 확인하라.
  (실제 사고: `CustomerDetail`에 "공용 Statistics를 쓰지 않는다 — 좁은 aside에서 금액이 잘린다"는 주석이 있었는데
  무시하고 Statistics로 바꿨다가 금액이 잘려 되돌렸다.)
- **작업 끝났다고 말하기 전에 게이트를 실제로 돌려라.** 통과했다고 쓰기 전에 출력을 봐라.

---

## 1. 검증 게이트 (전부 통과해야 "완료")

```bash
npx tsc -p tsconfig.app.json --noEmit      # 앱 타입체크 (noUnusedLocals 켜져 있음)
cd figma-plugin && npx tsc --noEmit         # 플러그인 타입체크
node scripts/verify-parity.mjs              # 토큰·아이콘·로고·컴포넌트 커버리지
node scripts/verify-mapping.mjs             # Storybook props ↔ Figma 매니페스트
node scripts/verify-naming.mjs              # 코드 이름 ↔ Figma 속성/레이어 이름
node scripts/verify-screen-props.mjs        # 화면의 inst() 오버라이드 ↔ 세트 속성 이름
```

**`verify-screen-props`를 빼먹지 마라.** 화면(`screens.ts`·`site-screens.ts`)은 `inst(세트, { props })`로
컴포넌트를 조립하는데, **`inst()`는 없는 속성 이름을 경고만 하고 무시한다**(warn-and-ignore).
그래서 세트의 속성 이름을 바꾸면 화면의 오버라이드가 **조용히 끊기고, 나머지 게이트는 전부 초록으로 남는다.**

> 실제 사고: `ProductCard`의 `Price`를 개명하자 **상품 카드 10장이 전부 세트 기본가로 렌더**됐다(세일가 소실).
> `MemoBox`의 `Counter`·`Save`, `DropZone`의 `Action` ×3도 같은 방식으로 깨졌다.
> **5개 게이트가 전부 초록인데 아무도 몰랐다** — 사람이 눈으로 21건을 찾아 고쳤고, 그러고도 6건을 놓쳤다.
> (특히 `SortBar`는 상품 10장짜리 화면에서 "6개"를 그리고 있었다.)
>
> **세트의 속성 이름을 바꿨으면 그 세트를 부르는 화면도 함께 고쳐라.** 개명은 규약 준수인 **동시에** 사고다.

자세한 내용: `docs/naming-parity.md` §화면 조립 게이트

큰 변경 후에는 스토리 런타임 스모크도 돌린다(Storybook이 6006에 떠 있어야 함):
전체 스토리를 순회하며 `pageerror`와 빈 렌더를 잡는다.

---

## 2. 이름은 코드가 정한다 (Figma 파리티의 핵심)

| 코드 | Figma |
|---|---|
| 컴포넌트 `Button` | 세트 `DS/Button` |
| 유니온 prop `variant: 'card' \| 'plain'` | VARIANT 축 `variant` / 값 `card`·`plain` |
| boolean `showThumbnail` | BOOLEAN 속성 `showThumbnail` (`Show Thumbnail` 금지) |
| string `helperText` | TEXT 속성 `helperText` (`Helper` 금지) |
| ReactNode `leftIcon` | INSTANCE_SWAP `leftIcon` (뭉뚱그린 `Icon` 금지) |
| CSS 클래스 `.overlayTitle` | 레이어 이름 `overlayTitle` |
| `children` | 슬롯 `content` |
| 중첩 `labels.columns.name` | TEXT 속성 `labels.columns.name` (점 표기 평탄화) |

분류 규칙은 `scripts/lib/ds-props.mjs`가 코드로 갖고 있다. `scripts/verify-naming.mjs`가 게이트다.
자세한 내용: `docs/naming-parity.md`

---

## 3. 문구(labels) 규약

사용자에게 보이는 **모든 글자는 밖에서 갈아끼울 수 있어야 한다.**

- 통로는 `labels` prop **하나**. 타입은 `export type XxxLabels`.
- 공용 타입은 `src/shared/labels.ts`에 있다 — **재정의하지 말고 import 해서 써라**
  (`RowActionsLabels`, `ConfirmDialogLabels`, `EmptyLabels`, `TotalLabels`, `SearchLabels`, `PaginationLabels`,
  `TableToolbarLabels`, `BulkLabels`, `Formatters`, `mergeLabels()`, `resolveLabel()`).
- 중첩은 **표면 기준 1단계까지만**: `columns` / `status` / `tabs` / `rowActions` / `bulk` / `toolbar` / `search` / `empty` / `deleteDialog`.
  접근성 이름(aria-label)은 별도 버킷을 만들지 않고 해당 표면 그룹 안에 둔다.
- 기본값은 `export const DEFAULT_XXX_LABELS = {...} as const` + 본문에서 `const L = mergeLabels(DEFAULT_XXX_LABELS, labels)`.
  **naive spread 금지** — 부분 오버라이드가 나머지 기본값을 지운다.
- 우선순위: **개별 prop > `labels.*` > 기본값**. 기존 카피 prop(`emptyText` 등)은 **제거·개명 금지**,
  `@deprecated` JSDoc만 붙이고 `resolveLabel()`로 해석한다.
- 값을 끼우는 문구는 인자 1개짜리 함수(`(n: number) => string`). 숫자·통화·날짜는 문구가 아니라 **포맷**이므로 `formatters` prop으로 연다.

---

## 4. 컴포넌트 작성 규칙

- **새 prop은 전부 옵셔널, 기본값 = 현재 동작.** 기본 props에서 렌더가 바뀌면 그건 회귀다.
- **ON/OFF는 `show*` boolean**, 아이콘은 **`ReactNode` 슬롯**, 변형은 **문자열 유니온**.
  여러 개면 `show` 객체 + 키마다 `?? true` (naive spread 금지 — `show={{header: undefined}}`가 기본값을 지운다).
- **색은 토큰만.** raw hex 금지. `--ds-*` 커스텀 프로퍼티만 쓴다.
  강조색은 `SiteSection`이 소유한다(`--site-accent` / `-text` / `-solid` / `-on`) — 사본을 만들지 마라.
- **중복 마크업 금지.** 표·빈 상태·행 액션·툴바·배지·확인창을 새로 그리지 마라. 이미 있다:
  `AdminTable` `Table` `EmptyState` `RowActions` `ListToolbar` `ToolbarActions` `Badge` `Chip` `CrudDialog`
  `Pagination` `SearchPanel` `FilterBar` `DefinitionList` `Statistics` `Skeleton` `Placeholder`.
- **화면은 셸로 조립한다.** 목록은 `AdminListPage`, 폼은 `AdminFormPage`.
  화면 파일에는 **컬럼 배열 · 상태 맵 · 문구 기본값**만 남는 것이 정상이다.
- 주석은 한국어. **"무엇을"이 아니라 "왜"** 를 적어라.

---

## 5. 자주 나오는 함정

- `noUnusedLocals`가 켜져 있다 — 안 쓰는 import 하나로 타입체크가 깨진다.
- CSS Modules의 클래스가 죽으면 지워라. 죽은 클래스는 다음 사람을 속인다.
- `AdminTable`은 레이아웃의 density 변수를 읽지 않는다 — 같은 값을 명시적으로 넘겨야 한다.
- `Button`은 라벨이 곧 접근성 이름이다. 아이콘만 필요하면 `iconOnly`를 써라(라벨은 sr-only로 남는다).
  각 화면에서 sr-only CSS를 새로 만들지 마라.
- 사이트 3종(`AboutPage`·`HistoryPage`·`ContactPage`)과 `PortfolioPage`·`ShopPage`는 **레퍼런스 시안과 픽셀이 맞아야 하는 화면**이다.
  기본값 렌더를 바꾸지 마라.

---

## 6. 여러 에이전트가 동시에 일할 때

- **폴더 소유권을 지켜라.** 배정된 `src/ds/<컴포넌트>/` 밖은 건드리지 마라.
- 공용 프리미티브(`Button`·`Badge`·`Table`·`EmptyState` …)는 **읽기 전용**이다. 필요하면 고치지 말고 **보고**하라.
- 다른 폴더의 타입체크 에러는 네 것이 아니다. 네 폴더만 깨끗하면 된다.
- 공용 컴포넌트에 축이 없어서 우회로(래퍼 div·sr-only CSS·keydown 가로채기)를 만들고 싶으면 —
  그건 **컴포넌트에 축이 빠졌다는 신호**다. 우회하지 말고 보고하라.
  (실제 사고: `ListToolbar`에 `totalLabel`·`onSearch`가 없어 7개 목록이 제각각 우회로를 만들었다.)
