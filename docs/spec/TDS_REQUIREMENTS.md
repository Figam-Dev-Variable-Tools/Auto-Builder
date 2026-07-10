# TDS(UI Platform) 구축 요구사항 정의서

> 2026-07-10 오너 제공. 원문 구조·목록을 그대로 보존한다(섹션 번호는 원문 기준).
> 구현 로드맵과의 매핑은 [부록 R](#부록-r--구현-로드맵-매핑) 참조.

## 1. 개요 — 요구 기능 총괄

- Design Token 관리
- UI Component Library
- Storybook Documentation
- Figma ↔ Storybook 양방향 연동
- 다양한 CSS Framework 비교
- 한국형 UI Pattern 제공
- 향후 Figma Plugin 자동 생성 지원
- Design System Versioning
- Component Playground
- Design QA

## 3. Storybook 구조

Design Tokens / Foundation / Typography / Icons / Buttons / Forms / Navigation /
Overlay / Feedback / Data Display / Templates / Korea Components / Admin Components /
Charts / Animations / Accessibility / Framework Showcase

## 4. Framework Showcase

아래 Framework를 하나의 Storybook에서 비교 가능하도록 구현한다.

- Bootstrap
- Tailwind CSS
- Bulma
- Foundation
- Materialize
- Semantic UI
- Skeleton
- Bootstrap Icons
- Heroicons

각 Framework는 Style Isolation 구조를 사용한다.
CSS 충돌은 Decorator 또는 Shadow DOM 기반으로 해결한다.

## 5. Design Tokens

Typography / Color / Gradient / Spacing / Margin / Padding / Border / Border Radius /
Shadow / Elevation / Opacity / Text Opacity / Background Opacity / Z-index /
Animation / Motion / Grid / Breakpoints / Container

## 6. Component Library

### Input
Text / Password / Search / Email / Phone / Number / Currency / OTP / Textarea /
Select / Multi Select / Autocomplete / Date Picker / Date Range / Time Picker /
Calendar / Slider / Switch / Checkbox / Radio / Toggle / Upload / Image Upload /
File Upload

### Button
Filled / Outline / Ghost / Soft / Icon / Link / FAB / Loading / Disabled /
Success / Warning / Danger / Primary / Secondary / Small / Medium / Large

### Overlay
Modal / System Dialog / Alert / Confirm / Prompt / Bottom Sheet / Action Sheet /
Toast / Snackbar / Loading / Tooltip / Popover

### Navigation
Header / Footer / Sidebar / Navbar / Tab / Breadcrumb / Pagination / Drawer / Dropdown

### Data Display
Card / Table / List / Accordion / Tabs / Timeline / Carousel / Statistics / Chart /
Tree / Badge / Chip / Avatar

## 7. 모든 Component 공통 State

모든 컴포넌트는 아래 State를 반드시 가진다.

Default / Hover / Focus / Pressed / Selected / Checked / Loading / Disabled /
Readonly / Required / Success / Warning / Error / Invalid / Empty

## 8. Validation

Input 계열은 반드시 아래 Validation을 제공한다.

정상 / 필수값 / 최대길이 / 최소길이 / 중복 / 형식오류 / 네트워크오류 / 서버오류 /
인증실패 / 인증만료 / 재시도 / 잠금 / 시간초과

## 9. 한국형(KR) UI Components

한국 서비스에서 자주 사용하는 컴포넌트를 기본 제공한다.

### 본인인증
휴대폰 본인인증 / PASS / 카카오 인증 / 네이버 인증 / 공동인증서 / 금융인증서

### 주소
우편번호 조회 / 도로명 주소 / 지번 주소 / 상세주소 / 주소 자동완성

### 금융
계좌번호 / 은행선택 / 카드번호 / 유효기간 / CVC / 예금주 / 현금영수증 / 세금계산서

### 기타
사업자번호 / 주민등록번호 / 외국인등록번호 / 차량번호 / 통신사 선택 /
배송 요청사항 / 전자서명

## 10. Figma 연동

**지원 대상**: Story.to.design / Storybook Connect / addon-designs

**지원 기능**: Storybook → Figma / Figma → Storybook / Variant Mapping /
Args Mapping / Component Properties / Design Link / Token Sync / Design QA

## 11. Icon System

**지원 대상**: Heroicons / Bootstrap Icons / Lucide / Material Symbols / Tabler Icons

### Known Issue

현재 Bootstrap Icons는 일부 Story에서 깨지는 현상이 발생한다.

확인 필요 사항:

- SVG Sprite 방식 지원 여부
- Font 방식 지원
- Vite Asset Loader
- Storybook Builder(Vite) 호환성
- Dynamic Import 문제
- Tree Shaking 영향 여부

Heroicons는 정상 동작하므로 Bootstrap Icons와의 구현 방식을 비교하여 원인을
분석하고 해결한다. → **분석·해결 완료: [docs/known-issues.md](../known-issues.md) KI-1**

## 12. 최종 목표

최종적으로 본 프로젝트는 단순한 Storybook이 아닌 아래 기능을 모두 포함하는
**Enterprise TDS(UI Platform)** 이 되어야 한다.

- Design Token Management
- Component Library
- Multi Framework Showcase
- Storybook Documentation
- Figma Integration
- Storybook ↔ Figma 양방향 동기화
- 한국형 UI Pattern Library
- Design QA Platform
- Component Playground
- Versioning 및 배포 자동화
- 향후 Figma Plugin 기반의 컴포넌트 및 Token 자동 생성 지원

---

## 부록 R — 구현 로드맵 매핑

| 요구사항 | 현재 상태 | 근거 |
|---|---|---|
| §4 Framework Showcase (7종 + 아이콘 2종) | **완료** (Phase 1, W3~W10) | Shadow DOM 격리(FrameworkScope) |
| §11 Bootstrap Icons Known Issue | **해결** (KI-1) | docs/known-issues.md |
| §10 Figma 연동 — addon-designs/Chromatic/가이드 | **완료** (Phase 1, W12~W14) | Design 탭 + 배포 파이프라인 |
| §5 Design Tokens (bootstrap/tailwind/toss 3프리셋) | **Phase 2 예정** (T1~T2) | PROMPT_BUNDLE_V2 §5~6 |
| §6 Component Library — 코어 5종(Button/TextField/Card/Alert/Badge) | **Phase 2 예정** (D1) | PROMPT_BUNDLE_V2 §7 |
| §6 Chart | **Phase 2 예정** (D3) | PROMPT_BUNDLE_V2 §9 |
| §10 Token Sync / Component Properties / Variant Mapping | **Phase 2 예정** (P2~P5, V1) | Figma 플러그인 |
| §1 Figma Plugin 자동 생성 | **완료** (P1~P4 + Stage C figma-story-tools) | 매니페스트 주도 생성기 + npm/CDN 배포 경로 |
| §6 Input 24종 — Text(TextField)·Password·Search·Email·Phone(KR)·Number·Currency·OTP·Textarea·Select·Multi Select·Autocomplete·Date Picker·Date Range·Time Picker·Calendar·Slider·Switch/Toggle·Checkbox·Radio·Upload·Image Upload·File Upload | **완료** (Phase 5 — IN1~IN4) | src/ds/ — InputBase 공용 베이스, §7 State(hover/focus/error/success/disabled/readonly/required) + §8 Validation(형식오류/필수/길이) 스토리 내장 |
| §6 나머지(Overlay 12종/Navigation 9종 중 미구현분/Data Display 13종 중 미구현분), §7 공통 State 15종 전수, §8 Validation 13종 전수 | **신규 범위 — 미착수** | Phase 5 이후 별도 단계 필요 |
| §9 한국형 KR Components — 입력 필드 세트(휴대폰·통신사·주민/외국인등록번호·차량번호·은행선택·계좌·카드번호/유효기간/CVC·카드 등록 폼·사업자번호·우편번호 조회·주소 입력/자동완성·배송 요청사항) | **완료** (Phase 4 — K1) | src/ds/kr/ — 자동 하이픈·검증식(주민 형식/사업자 국세청식/카드 Luhn)·마스킹, '6. KR 컴포넌트' 섹션 |
| §9 한국형 KR — 본인인증 플로우(휴대폰/PASS·카카오·네이버·공동·금융인증서)·전자서명 | **완료** (Phase 4 — K2) | src/ds/kr/ KrIdentityVerification(통합 플로우)·KrPhoneAuth(문자 인증+카운트다운)·KrCertAuth·KrSignaturePad — 외부 인증 API 연동 지점의 mock |
| §11 Lucide/Material Symbols/Tabler | **완료** (Phase 3 — I1) | 인라인 SVG 3스토리: src/icons/{Lucide,Tabler,MaterialSymbols}.stories.tsx (KI-1 권장 방식) |
| §1 Versioning/Playground/Design QA/Admin/Templates/Accessibility | **신규 범위 — 미착수** | 〃 |
