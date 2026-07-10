# Known Issues

## KI-1. Bootstrap Icons 글리프 깨짐 (해결)

**증상**: `Icons/Bootstrap Icons` 스토리에서 아이콘이 □(tofu)로 렌더.
Heroicons는 정상.

**요구사항 정의서 §11의 확인 필요 사항별 판정**:

| 확인 항목 | 판정 |
|---|---|
| Font 방식 지원 | 지원. 단, **`@font-face`는 Shadow Root 내부 `<style>`에서 폰트로 등록되지 않는 브라우저 제약**이 있음 — 이것이 근본 원인 |
| Vite Asset Loader | 정상. `?inline` CSS의 `url()`이 빌드 시 `new URL(..., import.meta.url)`로 재작성되고 `bootstrap-icons-*.woff2` 에셋이 방출됨을 확인 |
| Storybook Builder(Vite) 호환성 | 정상 (위 에셋 방출로 확인) |
| Dynamic Import 문제 | 무관 — CSS 문자열이 스토리 청크에 포함되어 로드됨 |
| Tree Shaking 영향 | 무관 — `?inline` import는 문자열 전체가 보존됨 |
| SVG Sprite 방식 지원 여부 | bootstrap-icons 패키지는 `bootstrap-icons.svg` 스프라이트도 동봉. 다만 Shadow DOM에서 외부 파일 `<use href>` 참조 제약이 있어 채택하지 않음. 향후 Lucide/Material Symbols/Tabler 추가 시에는 **인라인 SVG 컴포넌트 방식(Heroicons와 동일)** 을 권장 |

**원인 분석 (Heroicons와의 구현 방식 비교)**:

- Heroicons = React **인라인 SVG 컴포넌트**. 외부 에셋·폰트가 전혀 없고
  `currentColor`로 칠하므로 어떤 격리 구조에서도 동작한다.
- Bootstrap Icons = **아이콘 폰트**(`@font-face` + `.bi-*::before { content }`).
  FrameworkScope가 CSS 전체를 Shadow Root 안에만 주입하는 구조라 `@font-face`가
  브라우저에 등록되지 않았고, 폰트가 로드되지 않아 글리프가 깨졌다.
  (글리프 클래스 규칙 자체는 Shadow 안에서 정상 적용된다 — 폰트 등록만 document
  스코프여야 한다.)

**해결** ([src/icons/BootstrapIcons.stories.tsx](../src/icons/BootstrapIcons.stories.tsx)):

1. `?inline` CSS 문자열에서 `@font-face` 블록만 정규식으로 분리.
2. 분리한 `@font-face`를 `document.head`에 1회 주입
   (`style[data-bootstrap-icons-font]`로 멱등 보장).
3. 나머지 글리프 클래스 CSS는 기존대로 FrameworkScope(Shadow DOM) 안에 유지.

**전역 주입 금지 원칙(스펙 §0-5)과의 관계**: 주입되는 것은 셀렉터가 없는
`@font-face` 선언 1개뿐으로, 어떤 요소에도 스타일이 적용되지 않아 전역 충돌이
원천적으로 불가능하다. 폰트 등록이 document 스코프에서만 가능한 브라우저 제약에
따른 최소 예외이며, 이 문서를 근거로 남긴다.

**검증**: `@font-face` 추출/글리프 보존을 실제 CSS로 단위 검증, `pnpm build-storybook`
통과, 산출 청크에 주입 코드 포함 확인. 브라우저 시각 확인은 오너 검수 항목.

**후속 반영 (Phase 3 — I1)**: 위 표에서 권장한 **인라인 SVG 방식**으로 요구사항 §11의
나머지 아이콘 세트를 추가했다. Lucide/Tabler는 Heroicons와 동일한 React 인라인 SVG
컴포넌트(`currentColor` stroke), Material Symbols는 React 컴포넌트 패키지가 없어
SocialLoginButton과 동일한 `?raw` SVG 인라인(`@material-symbols/svg-400`, CSS 모듈에서
`fill: currentColor` 지정)으로 구현했다. 세 세트 모두 외부 폰트·`@font-face`가 없어
Shadow DOM 등 격리 구조에서 KI-1 같은 폰트 등록 제약이 원천적으로 발생하지 않는다.
(src/icons/{Lucide,Tabler,MaterialSymbols}.stories.tsx — `pnpm build-storybook` 인덱스 등록 확인.)
