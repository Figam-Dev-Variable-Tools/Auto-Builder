# css-frameworks-storybook

![Storybook](https://img.shields.io/badge/Storybook-8-FF4785?logo=storybook&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)

여러 CSS 프레임워크와 자체 디자인 시스템을 **하나의 Storybook에서 충돌 없이 비교·문서화**하고,
**Figma와 양방향 연동**하는 엔터프라이즈 **TDS(UI 플랫폼)** 프로젝트입니다.

## 목적

- **디자인 토큰 관리** — 색·타이포·간격 등을 JSON 단일 출처(SSOT)로 관리하고 CSS 변수·TS 타입으로 컴파일
- **UI 컴포넌트 라이브러리** — 토큰으로 스킨되는 자체 DS 컴포넌트(3·6번 섹션)
- **다중 CSS 프레임워크 비교** — Bootstrap/Tailwind/Bulma/Foundation/Materialize/Semantic UI/Skeleton을 Shadow DOM으로 격리해 한 화면에서 대조
- **한국형(KR) UI 패턴** — 휴대폰·주민번호·계좌·카드·주소·본인인증·전자서명 등 한국 서비스 필수 입력 패턴
- **Figma ↔ Storybook 양방향 연동** — 플러그인으로 토큰/컴포넌트 생성, Variables 내보내기로 역방향 반영
- **Storybook 문서 사이트** — TDS풍 문서·토큰·아이콘·차트 페이지

전체 요구사항은 [docs/spec/TDS_REQUIREMENTS.md](docs/spec/TDS_REQUIREMENTS.md)(부록 R에 구현 로드맵 매핑),
스펙 원문은 [PROMPT_BUNDLE.md](docs/spec/PROMPT_BUNDLE.md)(Phase 1)·[PROMPT_BUNDLE_V2.md](docs/spec/PROMPT_BUNDLE_V2.md)(Phase 2),
알려진 이슈는 [docs/known-issues.md](docs/known-issues.md) 참조.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 코어 | React 18 · TypeScript 5 · Vite 5 |
| 문서/카탈로그 | Storybook 8 (`@storybook/react-vite`) + addon-essentials/designs |
| 스타일 | CSS Modules · Tailwind 3.4 · SCSS(sass) · styled-components · `color-mix` 토큰 스킨 |
| 토큰 파이프라인 | JSON → 자체 생성 스크립트(`build-tokens.mjs`) → CSS 변수 + TS 타입 (style-dictionary 병용) |
| 프레임워크(비교용) | bootstrap · foundation-sites · bulma · tailwindcss · materialize-css · semantic-ui-css · skeleton-css |
| 아이콘 | Heroicons · Lucide · Tabler(React 인라인 SVG) · Material Symbols(`?raw` SVG) · Bootstrap Icons(폰트) |
| 차트 | Chart.js + react-chartjs-2 |
| 폰트 | Pretendard · Inter(@fontsource) |
| Figma | Figma Plugin API(`figma-plugin/`) + 매니페스트 직렬화(`packages/figma-story-tools`) |
| 배포/QA | Chromatic(비주얼 회귀) · GitHub Actions |
| 패키지 관리 | pnpm 워크스페이스 + corepack(Node 22 자동 프로비저닝) |

## 디렉터리 구조

```
Auto-Builder/
├─ tokens/                     # 디자인 토큰 SSOT (JSON) — bootstrap/tailwind/toss 3프리셋
├─ scripts/                    # 빌드 스크립트 (Node ESM)
│  ├─ build-tokens.mjs         #   토큰 JSON → CSS 변수 + TS 타입 생성
│  ├─ build-story-manifest.mjs #   src/ds → Figma 매니페스트 직렬화 + 왕복 동일성 검증
│  ├─ validate-tokens.mjs      #   토큰 스키마 검증
│  ├─ verify-mapping.mjs       #   DS props ↔ 매니페스트 §3 매핑 검증
│  └─ lib/ds-props.mjs         #   TSX props 파서 (union/boolean/string/ReactNode 분류)
├─ src/
│  ├─ shared/                  # 공용 인프라
│  │  ├─ FrameworkScope.tsx    #   프레임워크 CSS를 Shadow DOM에만 주입 (전역 격리)
│  │  ├─ ThemeScope.tsx        #   data-theme 프리셋 스위처 (토큰 CSS 변수 적용)
│  │  ├─ ShowcaseSheet.tsx     #   Gallery·Compare용 시트 레이아웃 크롬
│  │  ├─ formSkin.ts           #   프레임워크 폼에 입히는 소프트 스킨 CSS
│  │  └─ figma.ts              #   Figma 파일 링크 상수
│  ├─ tokens/generated/        # ⚙️ build-tokens 산출물 (직접 수정 금지)
│  ├─ ds/                      # 자체 디자인 시스템 컴포넌트 (사이드바 "3. 컴포넌트")
│  │  ├─ Button, TextField, Card, Alert, Badge   #   코어 5종
│  │  ├─ Toggle, Checkbox, Radio, Tab, Pagination, Toast  #   확장 6종
│  │  ├─ Chart, SocialLoginButton                #   차트·소셜 로그인
│  │  └─ kr/                   #   한국형 KR 컴포넌트 (사이드바 "6. KR 컴포넌트")
│  │     ├─ format.ts          #     자동 하이픈 포맷터 + 검증식(주민/사업자/카드 Luhn)
│  │     ├─ KrField.tsx        #     KR 필드 공용 베이스
│  │     ├─ KrPhoneField, KrRrnField, KrCarrierSelect, KrVehicleNoField
│  │     ├─ KrBankSelect, KrAccountField, KrCardNoField, KrExpiryField, KrCvcField, KrCardForm
│  │     ├─ KrBizNoField, KrPostcodeSearch, KrAddressForm, KrAddressAutocomplete
│  │     └─ KrAuthMethodSelect, KrPhoneAuth, KrCertAuth, KrIdentityVerification, KrSignaturePad
│  ├─ frameworks/              # CSS 프레임워크 쇼케이스 (사이드바 "Frameworks")
│  │  ├─ bootstrap/ … skeleton/  #   7종 × (Button/Card/Form/Alert/Navbar) + showcase.tsx
│  │  └─ compare/              #   컴포넌트별 7프레임워크 나란히 비교 (Compare 페이지)
│  ├─ icons/                   # 아이콘 5세트 스토리 (사이드바 "Icons")
│  ├─ styling/                 # 스타일링 기법 비교 (css/css-modules/scss/styled)
│  └─ docs/                    # MDX 문서 페이지 (시작하기/컬러/타이포/KR/Figma)
├─ figma-plugin/               # Figma 플러그인 "DS Generator" (별도 번들)
│  └─ src/ (code.ts·presets.ts·generators/)
├─ packages/figma-story-tools/ # npm/CDN 배포용 매니페스트 (Stage C)
├─ docs/                       # 스펙·요구사항·가이드·known-issues + docs-content.json
└─ .storybook/                 # Storybook 설정 (main.ts·preview.tsx)
```

## Storybook 구성 (사이드바 순서)

`0. 시작하기` · `1. 컬러` · `2. 타이포그래피` · `3. 컴포넌트`(DS) · `4. 차트` ·
`5. 소셜 로그인` · `6. KR 컴포넌트` · `9. Figma 연동` · `Frameworks`(+Compare) · `Icons` · `Styling`

상단 툴바의 **Preset 스위처**(bootstrap/tailwind/toss)로 DS 컴포넌트의 토큰 스타일을 실시간 전환한다
(각 프리셋 primary: 퍼플/시안/블루). 프레임워크 쇼케이스는 `noDsTheme`라 프리셋 전환의 영향을 받지 않는다.

## 핵심 개념

- **스타일 격리** — 모든 프레임워크 CSS는 `?inline`으로 문자열 import 후
  [FrameworkScope](src/shared/FrameworkScope.tsx)가 Shadow DOM 안에만 주입한다.
  전역(document head)에 프레임워크 CSS를 주입하지 않아 7종이 한 화면에서 충돌하지 않는다.
- **토큰 SSOT** — `tokens/*.json`이 유일한 출처. `pnpm build:tokens`가 CSS 변수(`--ds-color-*`)와
  TS 타입을 생성하고, DS 컴포넌트는 하드코딩 색 없이 `var(--ds-color-*)` + `color-mix`만 사용한다.
  hex 리터럴 허용 예외는 두 곳뿐: `SocialLoginButton/brand.css`와 `SocialLoginButton/logos/*.svg`
  (각 사 브랜드 규정색 — 부록 E, 값 변경 금지). SSOT 검증 grep도 이 두 경로만 제외한다.
- **매니페스트 왕복 동일성** — `src/ds` 소스가 Figma 컴포넌트 스펙의 SSOT다.
  `pnpm build:manifest`가 소스에서 매니페스트를 파생해 플러그인 내장본과 deep-equal 검증하므로,
  DS props를 바꾸면 플러그인 매니페스트도 함께 갱신해야 통과한다.

## 요구 환경

- **Node 20 또는 22** (Storybook 8은 Node 24 미지원 — package.json의
  `devEngines.runtime`(node 22.23.1, `onFail: download`)이 pnpm 실행 스크립트에
  자동 적용되므로 시스템 Node 버전과 무관하게 동작한다)
- **pnpm** (corepack: `corepack enable && corepack prepare pnpm@latest --activate`)

## 실행 / 스크립트

```bash
pnpm install
pnpm build:tokens                      # tokens JSON → CSS 변수 + TS 타입
pnpm build:tw                          # Tailwind 컴파일
pnpm storybook                         # TDS풍 문서 사이트 (http://localhost:6006)
pnpm build-storybook                   # 통합 빌드 검증 (tokens→tw→storybook 자동 체인)
pnpm build:manifest                    # Figma 매니페스트 직렬화 + 왕복 동일성 검증
pnpm --dir figma-plugin build          # Figma 플러그인 번들
```

> 통합 검증은 `pnpm build-storybook`이 기준이다(Vite 기반, tokens→tw→storybook 자동 체인).
> `tsc -b`는 프레임워크 스토리의 CSF args 추론 등 사전존재 오류가 있어 통과 기준으로 쓰지 않는다.

## Figma 플러그인 (DS Generator)

1. `pnpm --dir figma-plugin build` 실행 (`figma-plugin/dist/` 생성).
2. Figma → Plugins → Development → **Import plugin from manifest…** →
   `figma-plugin/manifest.json` 선택.
3. 플러그인 UI에서 프리셋 선택 → [디자인시스템 생성] — Variables 3컬렉션·Text Styles·
   DS 컴포넌트·문서 페이지가 생성된다.
4. 양방향 동기화: [현재 Variables 내보내기] → 받은 JSON을 `tokens/`에 덮어쓰고 커밋 →
   `pnpm build:tokens` → Storybook 자동 반영. 이것이 디자이너 수정의 유일한 코드 반영 경로다.
5. 웹 컴포넌트의 소셜 로그인 로고는 각 사 공식 geometry SVG로 반영됨(Google 4색 G·
   Facebook f·네이버 N·카카오 심볼). 단, Figma 플러그인이 생성하는 Figma 컴포넌트의
   로고는 첫 글자 텍스트 플레이스홀더이므로 Figma 안에서 공식 에셋으로 교체가 필요하다.
6. 프리셋 폰트(Pretendard/Inter)는 Figma에 설치되어 있어야 하며, 없으면 Inter로 폴백된다.

## figma-story-tools (Stage C — 자체 story.to.design 경로)

`pnpm build:manifest`가 `src/ds` 소스에서 §3 매핑 정보 + 토큰 3프리셋을
[packages/figma-story-tools/manifest.json](packages/figma-story-tools/manifest.json)으로
직렬화한다(플러그인 내장 매니페스트와 동일성 검증 포함). npm 발행(오너 계정, 사람 단계)
후에는 플러그인 [원격에서 가져오기(URL)]에
`https://unpkg.com/figma-story-tools@latest/manifest.json`을 넣어 SaaS 없이 동일한
컴포넌트 생성이 가능하다. 절차: [docs/figma-integration-guide.md](docs/figma-integration-guide.md) §9.

## 스타일 격리

모든 프레임워크 CSS는 `?inline`으로 문자열 import 후
[src/shared/FrameworkScope.tsx](src/shared/FrameworkScope.tsx)가 Shadow DOM 안에만
주입한다. 전역(document head)에 프레임워크 CSS를 주입하지 않는다.

## 아이콘 시스템 (요구사항 §11)

Storybook `Icons/` 하위에 5개 세트를 제공한다. 세 가지 통합 방식을 의도적으로 병렬
비교한다 — 모두 Shadow DOM 격리와 호환된다.

| 세트 | 방식 | 근거 |
|---|---|---|
| Heroicons / Lucide / Tabler | React **인라인 SVG 컴포넌트** (`currentColor`) | 외부 폰트·에셋 없음 — 어떤 격리 구조에서도 동작 |
| Material Symbols | **`?raw` SVG 인라인** (`@material-symbols/svg-400`) | React 컴포넌트 패키지 부재 — SocialLoginButton과 동일 방식, CSS 모듈에서 `fill: currentColor` |
| Bootstrap Icons | **아이콘 폰트** (`@font-face`) | KI-1 제약 회피를 위해 `@font-face`만 document 레벨 1회 주입 ([docs/known-issues.md](docs/known-issues.md)) |

인라인 SVG 3종은 KI-1이 권장한 방식으로, `@font-face` 등록 제약이 원천적으로 없다.

## Figma 연동

### Figma → Storybook (Design 탭)

각 스토리의 `parameters.design.url`은 placeholder다. 실제 연동하려면
[src/shared/figma.ts](src/shared/figma.ts)의 `FIGMA_FILE`을 실제 Figma 파일 URL로
교체하고, 각 스토리의 `design.url`에 대응하는 Figma 프레임 링크의 `node-id`를
반영한다(프레임 우클릭 → *Copy link to selection*). 자세한 절차는
[docs/figma-integration-guide.md](docs/figma-integration-guide.md) 참조.

### Storybook → Figma (Chromatic 배포)

1. [chromatic.com](https://www.chromatic.com)에서 이 저장소로 프로젝트를 생성한다.
2. 프로젝트 설정에서 **Project Token**을 발급받는다.
3. GitHub 저장소 Settings → Secrets → `CHROMATIC_PROJECT_TOKEN`으로 등록한다.
4. push하면 [.github/workflows/chromatic.yml](.github/workflows/chromatic.yml)이 자동 배포한다.
5. 로컬 수동 배포: `CHROMATIC_PROJECT_TOKEN=xxxx pnpm chromatic` (토큰 하드코딩 금지).

## 남은 단계 (메모 — 사람 수행 필요)

개발(Phase 1·2, Stage C, Phase 3 아이콘·DS 확장, Phase 4 KR)은 완료·검증됨. 아래는 계정/수동 확인이 필요해 자동화하지 않은 단계다.

- [ ] **오너 검수**: `pnpm storybook` → 툴바 Preset(bootstrap/tailwind/toss) 전환 시 DS 컴포넌트
      색 변화, Controls 패널 조작, 쇼케이스 인터랙션(토글/dismiss/active) 확인
- [ ] **Chromatic**: chromatic.com에서 프로젝트 생성 → Project Token 발급 → GitHub 저장소
      Settings → Secrets에 `CHROMATIC_PROJECT_TOKEN` 등록 (이후 push 시 자동 배포)
- [ ] **Figma 플러그인**: `pnpm --dir figma-plugin build` → Figma → Plugins → Development →
      Import plugin from manifest… → 실행 결과(모드 전환·속성 패널·슬롯 스왑) 스크린샷 대조
- [ ] **Figma 폰트 설치**: Pretendard / Inter (없으면 Text Style이 Inter로 폴백됨)
- [ ] **실링크 교체**: `src/shared/figma.ts`의 `FIGMA_FILE` placeholder → 실제 파일 URL,
      각 스토리 `node-id` 교체 (Design 탭 "Whoops!"는 placeholder라서 나는 정상 화면.
      절차: docs/figma-integration-guide.md §7)
- [ ] **story.to.design / Storybook Connect 연결** (Connect는 Chromatic **Public** 필요 — 가이드 §5·§6)
- [ ] **figma-story-tools npm publish** — 오너 npm 계정으로 `packages/figma-story-tools` 발행
      (`pnpm build:manifest` → `pnpm --dir packages/figma-story-tools pack`으로 사전 확인)
- [ ] **다음 개발 범위 승인**: TDS 요구사항 신규 범위(§6 나머지 컴포넌트(Input 확장·Overlay·
      Navigation·Data Display)·§8 Validation 체계화·Versioning/Playground/QA) —
      [docs/spec/TDS_REQUIREMENTS.md 부록 R](docs/spec/TDS_REQUIREMENTS.md)에서 우선순위 결정
      (완료: §11 아이콘 3세트(Phase 3 — I1), DS 확장 6종+TextField(Phase 3 — D4),
      §9 KR 입력 필드 세트(Phase 4 — K1) + 본인인증 플로우·전자서명(Phase 4 — K2))

## 버전 고정 및 보정 근거

부록 A 버전표 기준 메이저 고정(마이너/패치만 상향). 현실 충돌 보정:

- `storybook@8` 메이저 명시 설치 — 2026년 현재 latest는 SB10
- `@storybook/addon-designs@^8` — 11.x는 SB10 전용
- `chromatic@^11` — 최신(≥16)은 Node 24 필수라 Node 22와 충돌
- `tailwindcss@^3.4` — v4는 CSS-first 문법으로 스펙과 비호환
- `@storybook/react`, `@storybook/blocks` 명시 devDep — pnpm 엄격 격리에서
  각각 렌더러/MDX Meta 직접 의존 필요
- `materialize-css`/`semantic-ui-css`는 사실상 비유지보수 상태 — 정적 마크업만 사용
