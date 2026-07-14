# Figma 커버리지 계획 — 무엇이 세트이고 무엇이 화면인가

> **2026-07 갱신**: 이 문서가 원래 지시했던 작업(§A 신설 화면 10개 · §B 세트 21개 · §C 세트 3개)은
> **전부 완료됐다** — 아래 "완료 확인" 절이 근거다. 낡은 "❌ 없음" 표는 지우지 않고 취소선 없이
> 상태만 갈아 끼웠다(이력 추적용). **더 이상 작업 지시서가 아니다** — 남은 것은 §E(미확인 데모 화면)뿐이고,
> 그마저 원래 "기타(데모·변형)"로 우선순위 밖이라고 못 박혀 있던 항목이다.

산출 근거: `node scripts/verify-parity.mjs`(세트/화면 대조, 2026-07 재실행 — 컴포넌트 65/65 · KR 20/20 ·
Site 12/12, 알려진 갭 0건) + `figma-plugin/src/generators/{admin,site,screens}.ts`(세트·화면의 단일 출처)를
직접 grep해 개별 확인.

---

## 규칙 — 세트인가 화면인가

| | 정의 | Figma 위치 |
|---|---|---|
| **세트(Component)** | 재사용되는 조각. props 로 변형된다. | `15. System - Admin Component` |
| **화면(Page)** | 사이드바 라우트로 도달하는 완결된 페이지. 세트의 **인스턴스로 조립**한다. | `17. System - Admin Pages` |
| **셸(Shell)** | 화면을 담는 그릇. 그 자체로는 그릴 것이 없다 — **화면이 곧 셸의 렌더 결과**다. | 세트 없음 (사유 등록) |

> **화면은 직접 그리지 마라.** `screens.ts` 상단 주석의 오너 확정 사항이다 —
> 화면은 `15. System - Admin Component` 의 세트를 `inst()` 로 조립한다. 직접 그리면 컴포넌트를 고쳐도 화면이 안 바뀐다.

---

## A. 화면 — 오너의 사이드바 6그룹 기준 (완료)

`AdminSuite` 사이드바는 오너가 확정한 구조다. 2026-07 기준 **6그룹 전부 Figma 화면이 있다**
(`figma-plugin/src/generators/screens.ts`의 `function screenXxx` 전수 확인).

| 사이드바 | 라우트 | 컴포넌트 | Figma 화면 |
|---|---|---|---|
| 1. 대시보드 | `dashboard` | `DashboardScreen` | ✅ `screenDashboard` |
| 2. 회원관리 › 사용자 | `customer-list` | `CustomerList` | ✅ `screenCustomerList` (신설 완료) |
| 2. 회원관리 › 운영자 | `staff-list` | `StaffList` | ✅ `screenStaffList` |
| 3. 상품관리 › 카테고리 | `category-list` | `CategoryList` | ✅ `screenCategoryList` (신설 완료) |
| 3. 상품관리 › 상품 | `product-screen` | `ProductListScreen` | ✅ `screenProductList` — 이름은 다르지만 verify-parity의 `hasScreen()`이 `Screen` 접미사를 벗기고 매칭하므로 갭이 아니다(옛 "⚠️ 다른 컴포넌트" 우려는 해소됨). |
| 3. 상품관리 › 주문 | `orders` | `OrderList` | ✅ `screenOrderList` |
| 4. 문의관리 | `inquiry-manage` | `InquiryManageList` | ✅ `screenInquiryManageList` (신설 완료) |
| 5. 회사관리 › 회사소개 | `company-form` | `CompanyForm` | ✅ `screenCompanyForm` |
| 5. 회사관리 › 연혁 | `history-list` | `HistoryList` | ✅ `screenHistoryList` |
| 5. 회사관리 › 포트폴리오 | `portfolio-list` | `PortfolioList` | ✅ `screenPortfolioList` |
| 6. 메인비주얼 관리 | `mainvisual-list` | `MainVisualList` | ✅ `screenMainVisualList` (신설 완료) |

### 신설했던 화면(전부 완료 — `screens.ts`에서 함수명으로 확인함)

1. **카테고리 관리** — `screenCategoryList` ✅
2. **카테고리 등록/수정** — `screenCategoryForm` ✅
3. **메인비주얼 관리** — `screenMainVisualList` ✅
4. **메인비주얼 등록/수정** — `screenMainVisualForm` ✅
5. **문의관리** — `screenInquiryManageList` ✅
6. **문의 상세(관리)** — `screenInquiryManageDetail` ✅
7. **문의 설정** — `screenInquirySettings` ✅
8. **사용자 목록** — `screenCustomerList` ✅ (`MemberList`는 여전히 별도 화면 `screenMemberList` — 이름 충돌 없음, 둘 다 존재)
9. **상품 상세** — `screenProductDetail` ✅
10. **상품 등록/수정** — `screenProductEditPage` ✅

---

## B. 세트 — Admin 컴포넌트 (21개, 완료)

전부 `15. System - Admin Component`(`admin.ts`)에 세트로 있다(`setName: 'DS/…'` 전수 grep 확인,
2026-07). **이름은 코드가 정한다** — 세부 prop/속성 이름 파리티는 `verify-naming`이 게이트한다(개별
속성 예외는 `scripts/verify-naming.mjs`의 ALLOWLIST를 봐라, `docs/naming-parity.md` §연기 항목 참고).

| 컴포넌트 | 상태 |
|---|---|
| `RowActions` | ✅ `admin.ts` |
| `ListToolbar` | ✅ `admin.ts` (SortBar 흡수, `layout` 축) |
| `ToolbarActions` | ✅ `admin.ts` |
| `FilterBar` | ✅ **낡은 항목 정정** — `categories-data-kr-media.ts`의 `krBespokeDoc('FilterBar', …)`로 **이미 있었다**. 원래 이 문서가 "세트 누락"으로 잘못 분류한 원인은 `verify-parity.mjs`의 커버리지 스캐너가 `kr(Field\|Bespoke)Doc(...)` 호출이 여러 줄에 걸치면 못 읽던 파싱 버그였다(`scripts/verify-parity.mjs:172` 주석에 이력이 남아 있다 — EmptyState·FilterBar·Dashboard·ListPage·Settings·Login 6개가 같은 버그로 오탐됐었다). 파서는 이미 고쳐졌다. |
| `FormSection` | ✅ `admin.ts` |
| `FieldRow` | ✅ `admin.ts` (`labelPlacement: top \| left`) |
| `FormAnchorNav` | ✅ `admin.ts` |
| `Placeholder` | ✅ `admin.ts` (8종 `kind`) |
| `ContextMenu` | ✅ `admin.ts` |
| `AdminChart` | ✅ `admin.ts` |
| `AnalyticsTable` | ✅ `admin.ts` |
| `AttachmentList` | ✅ `admin.ts` |
| `CategoryTree` | ✅ `admin.ts` (2Depth) |
| `ConsentList` | ✅ `admin.ts` |
| `GroupPanel` | ✅ `admin.ts` |
| `ImagePreview` | ✅ `admin.ts` |
| `MainVisualUploader` | ✅ `admin.ts` |
| `MobilePreview` | ✅ `admin.ts` |
| `OptionRows` | ✅ `admin.ts` |
| `RichTextEditor` | ✅ `admin.ts` |
| `SortableList` | ✅ `admin.ts` |

## C. 세트 — 컴포넌트·사이트 (3개, 완료)

| 컴포넌트 | 상태 |
|---|---|
| `InputBase` | ✅ `categories-core.ts`(`setName: 'DS/InputBase'`). `verify-parity.mjs`의 `KNOWN_GAPS` 주석에도 "세트가 실제로 생겨 커버리지 갭이 해소됐다"고 명시돼 있다 — 남은 이슈(있다면)는 커버리지가 아니라 이름 규약이라 `verify-naming`이 본다. |
| `EraTimeline` | ✅ `site.ts`(`setName: 'DS/EraTimeline'`). 2026-07 `ratio` 축(대표 4값, `ERA_RATIOS`)까지 세워 이름 규약도 통과한다(`scripts/verify-naming.mjs` ALLOWLIST axis-values 참고). |
| `Highlight` | ✅ `site.ts`(`setName: 'DS/Highlight'`). |

---

## D. 셸 — 세트가 필요 없다 (사유 등록, 유지)

이들은 **화면이 곧 렌더 결과**다. 세트로 만들면 화면과 중복된다.
`verify-parity` 의 `KNOWN_GAPS` 에 사유와 함께 등록한다(2026-07 기준 `KNOWN_GAPS`는 **비어 있다** —
아래 셸들은 애초에 `sections.admin`으로 분류돼 자동 갭 검사 대상이 아니다, `verify-parity.mjs:213,246-251`).

`AdminShell` · `AdminListPage` · `AdminFormPage` · `AdminPageLayout` · `AdminGrid` · `AdminListView` ·
`PageContainer` · `DetailLayout` · `PageHeaderBar` · `AdminSuite` · `SiteSuite`

> `PageHeaderBar`는 **아직 미확정**이다 — 원 문서가 남긴 질문을 그대로 옮긴다. 실사용처는 12개 파일
> (`AdminFormPage`·`CategoryForm`·`CompanyForm`·`CustomerDetail`·`InquiryManageDetail`·`MainVisualForm`·
> `PageContainer` 등, grep 확인함)로 넓게 퍼져 있어 "화면마다 반복되는 조각"에 더 가까워 보이지만,
> 세트로 만들지 안 만들지는 여전히 오너 판단이 필요하다 — 추측으로 닫지 않는다.

---

## E. 남은 것 — 데모·변형 화면 (원래도 우선순위 밖, 미확인)

원 문서가 처음부터 "기타 화면(데모·변형 섹션)"으로 낮은 우선순위에 두었던 항목이다 — 오너의 6그룹
사이드바가 아니라 별도 데모 내비게이션(`inquiry-board` 등, `AdminSuite.tsx`의 두 번째 사이드바 그룹)
소속이다. `verify-parity.mjs`는 Admin/Templates 섹션 전체를 자동 갭 검사에서 뺀다(§D 참고) — 즉
아래 항목이 Figma에 실제로 있는지는 **이번 갱신에서 개별 확인하지 못했다** (figma-plugin은 이 작업의
소유 범위 밖이라 추측으로 "완료"라고 적지 않는다). `NoticeBoard`만 확인됨(`screenNotice`로 이미 있다 —
이름 매칭 문제였을 뿐).

- `InquiryBoard` · `InquiryApplicationDetail` · `QaList` · `AnswerForm` · `AnswerHistory` — 확인 필요
- `NoticeBoard` — ✅ Figma `screenNotice`로 이미 있음(이름 매칭만 다름, 갭 아님)

---

## 게이트

이 문서의 §E 항목이 실제로 비어 있지 않다면 `verify-parity` 가 **KNOWN_GAPS 에 사유를 요구**한다
(단, Admin/Templates 섹션은 자동 갭 검사 밖이라 이 문서가 유일한 추적 수단이다 — §D 참고).
사유 없는 갭과 **썩은 항목**(이미 해소됐는데 남은 것)은 실패한다.
`verify-naming` 이 세트의 속성 이름을, `verify-screen-props` 가 화면의 `inst()`/문서 `states` 오버라이드를,
`verify-bindings` 가 색·폰트가 raw hex/미바인딩 없이 실제로 Variables에 물렸는지 강제한다.

**세트를 만들었으면 그 세트를 부르는 화면도 같은 커밋에서 고쳐라** — 개명은 규약 준수인 동시에 사고다.
