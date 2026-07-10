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
5. 소셜 로그인 근사 SVG 로고는 각 사 브랜드 리소스의 원본 에셋으로 교체해야 한다.
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

## 버전 고정 및 보정 근거

부록 A 버전표 기준 메이저 고정(마이너/패치만 상향). 현실 충돌 보정:

- `storybook@8` 메이저 명시 설치 — 2026년 현재 latest는 SB10
- `@storybook/addon-designs@^8` — 11.x는 SB10 전용
- `chromatic@^11` — 최신(≥16)은 Node 24 필수라 Node 22와 충돌
- `tailwindcss@^3.4` — v4는 CSS-first 문법으로 스펙과 비호환
- `@storybook/react`, `@storybook/blocks` 명시 devDep — pnpm 엄격 격리에서
  각각 렌더러/MDX Meta 직접 의존 필요
- `materialize-css`/`semantic-ui-css`는 사실상 비유지보수 상태 — 정적 마크업만 사용
