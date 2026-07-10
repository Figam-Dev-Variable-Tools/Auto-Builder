# css-frameworks-storybook

CSS 프레임워크 7종(Bootstrap, Foundation, Bulma, Tailwind, Materialize, Semantic UI,
Skeleton) × 컴포넌트 5종(Button, Card, Form, Alert, Navbar)을 단일 Storybook에서
충돌 없이 비교하고, Figma와 양방향 연동하는 프로젝트다.

스펙 원문: [docs/spec/PROMPT_BUNDLE.md](docs/spec/PROMPT_BUNDLE.md) (Phase 1),
[docs/spec/PROMPT_BUNDLE_V2.md](docs/spec/PROMPT_BUNDLE_V2.md) (Phase 2),
[docs/spec/TDS_REQUIREMENTS.md](docs/spec/TDS_REQUIREMENTS.md) (전체 플랫폼 요구사항 정의서).

알려진 이슈와 해결 근거: [docs/known-issues.md](docs/known-issues.md)
(KI-1: Bootstrap Icons — Shadow DOM 내 @font-face 미등록 제약, 해결됨).

## 요구 환경

- **Node 20 또는 22** (Storybook 8은 Node 24 미지원 — package.json의
  `devEngines.runtime`(node 22.23.1, `onFail: download`)이 pnpm 실행 스크립트에
  자동 적용되므로 시스템 Node 버전과 무관하게 동작한다)
- **pnpm** (corepack: `corepack enable && corepack prepare pnpm@latest --activate`)

## 실행

```bash
pnpm install
pnpm build:tokens                      # tokens JSON → CSS 변수 + TS 타입
pnpm build:tw                          # Tailwind 컴파일
pnpm storybook                         # TDS풍 문서 사이트 (http://localhost:6006)
pnpm build-storybook                   # 통합 빌드 검증 (tokens→tw→storybook 자동 체인)
pnpm --dir figma-plugin build          # Figma 플러그인 번들
```

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

개발(Phase 1·2, Stage C, Phase 3 아이콘 세트)은 완료·검증됨. 아래는 계정/수동 확인이 필요해 자동화하지 않은 단계다.

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
- [ ] **다음 개발 범위 승인**: TDS 요구사항 신규 범위(§6 전체 컴포넌트·§7 State 15종·
      §9 한국형 KR·Versioning/Playground/QA) —
      [docs/spec/TDS_REQUIREMENTS.md 부록 R](docs/spec/TDS_REQUIREMENTS.md)에서 우선순위 결정
      (§11 아이콘 3세트는 Phase 3 — I1로 완료: 아래 "아이콘 시스템" 참조)

## 버전 고정 및 보정 근거

부록 A 버전표 기준 메이저 고정(마이너/패치만 상향). 현실 충돌 보정:

- `storybook@8` 메이저 명시 설치 — 2026년 현재 latest는 SB10
- `@storybook/addon-designs@^8` — 11.x는 SB10 전용
- `chromatic@^11` — 최신(≥16)은 Node 24 필수라 Node 22와 충돌
- `tailwindcss@^3.4` — v4는 CSS-first 문법으로 스펙과 비호환
- `@storybook/react`, `@storybook/blocks` 명시 devDep — pnpm 엄격 격리에서
  각각 렌더러/MDX Meta 직접 의존 필요
- `materialize-css`/`semantic-ui-css`는 사실상 비유지보수 상태 — 정적 마크업만 사용
