# Figma 양방향 연동 가이드

이 문서는 사람이 직접 수행해야 하는 Figma ↔ Storybook 연동 절차를 정리한다.

## 1. 개요: 방향 2가지

| 방향 | 도구 | 상태 |
|---|---|---|
| Figma → Storybook | `@storybook/addon-designs` (스토리에 Figma Design 탭 임베드) | 코드 완료 |
| Storybook → Figma | **자체 구축** — GitHub Pages/jsdelivr로 선언 배포 → DS Generator 플러그인이 생성 | 코드 완료 — 외부 SaaS 불필요 |

> 이 프로젝트는 story.to.design 같은 외부 SaaS를 **소비하지 않고 그 기능을 자체 구축**한다.
> 공개 리포 + GitHub Pages/jsdelivr로 디자인시스템 선언(manifest/tokens/docs-content)을
> 호스팅하고, DS Generator 플러그인이 그 URL을 읽어 Figma에 디자인시스템을 생성한다.

## 2. Figma → Storybook 절차

1. `@storybook/addon-designs`는 이미 설치·설정되어 있다 (`.storybook/main.ts`의 addons 참조).
2. 모든 스토리의 `parameters.design.url`은 현재 placeholder다:
   - 공통 파일 URL 상수: [src/shared/figma.ts](../src/shared/figma.ts)의 `FIGMA_FILE`
     (`https://www.figma.com/file/REPLACE_ME/Design-System`)
   - 각 스토리는 `${FIGMA_FILE}?node-id=0-1` 형태를 사용한다.
3. 교체 방법:
   1. Figma에서 대상 파일을 열고 파일 URL을 복사해 `FIGMA_FILE` 값을 교체한다.
   2. 각 스토리에 대응하는 Figma 프레임을 선택 → 우클릭 → *Copy link to selection* →
      URL의 `node-id` 값을 해당 스토리의 `design.url`에 반영한다.
4. Storybook 실행 후 임의 스토리에서 **Design** 탭이 보이고 Figma 프레임이 임베드되면 완료.

## 3. Storybook → Figma 절차 — 자체 구축 (표준 경로)

DS Generator 플러그인이 공개 URL의 디자인시스템 선언(manifest/tokens/docs-content)을 읽어
Figma에 Variables·Text Styles·컴포넌트·문서 페이지를 생성한다. 외부 SaaS 불필요.

### 3-0. 배포 (오너 1회 설정)

1. **GitHub Pages 활성화**: 저장소 Settings → Pages → Source: **GitHub Actions**.
   push하면 `pages.yml`이 문서 사이트 + 선언을
   `https://figam-dev-variable-tools.github.io/Auto-Builder/`에 배포한다.
2. **선언 URL** (Figma가 읽을 곳) — 둘 다 CORS `*`:
   - jsdelivr @gh (퍼블리시·Pages 불필요, 즉시):
     `https://cdn.jsdelivr.net/gh/Figam-Dev-Variable-Tools/Auto-Builder@main/packages/figma-story-tools/manifest.json`
   - Pages 미러(① 완료 후): `https://figam-dev-variable-tools.github.io/Auto-Builder/manifest.json`

### 3-1. 생성 (Figma)

1. Figma 데스크톱 → Plugins → Development → Import plugin from manifest… → `figma-plugin/manifest.json`.
2. 플러그인 [원격에서 가져오기(URL)]에 위 매니페스트 URL 입력 → 로드.
3. [디자인시스템 생성] → Variables·Text Styles·컴포넌트 생성. tokens/docs-content URL도 같은
   버튼으로 로드하면 문서 페이지까지 생성된다.

### 3-2. (선택) 외부 SaaS 대안

필요 시 story.to.design·Storybook Connect 같은 상용 도구도 배포된 Storybook URL로 병행 가능하나,
본 프로젝트의 표준은 위 자체 구축 경로다. (Anima는 설정 복잡으로 비권장.)

## 4. 매핑 검증 절차 (G2)

1. 문서 사이트가 배포되면(§3-0) `https://figam-dev-variable-tools.github.io/Auto-Builder/`에서
   `3. 컴포넌트/Button` 스토리의 args(`variant`/`size`/`disabled`/`label`/`showIcon`)를 확인한다.
2. 플러그인이 생성한 `DS/Button` 컴포넌트의 속성 이름이 스토리 args와 문자열까지 일치하는지
   대조한다(§3 매핑 규약 — `verify-mapping.mjs`가 코드에서 자동 검증).
3. 외부 SaaS(story.to.design)를 병행해 import한 산출물은 별도 페이지 `__imported`에 두고,
   정본은 플러그인(P3) 산출물로 유지한다. 차이 발견 시 **코드(args)가 우선**한다.

## 7. addon-designs 실링크 교체 절차 (G2)

1. DS Generator 플러그인(P2~P4) 실행으로 Figma에 Variables·컴포넌트·문서 페이지를 생성한다.
2. Figma에서 대상 컴포넌트/프레임을 선택 → 우클릭 → **Copy link to selection**.
3. URL의 `node-id` 파라미터를 추출해 해당 스토리 `parameters.design.url`에 반영한다.
   (`src/shared/figma.ts`의 `FIGMA_FILE`은 실제 파일 URL로 선행 교체)
4. D1~D3 스토리 전체에 대해 반복한다.

## 8. 양방향 동기화의 현실적 한계 (부록 F — 반드시 숙지)

1. **토큰(색·타이포·radius·spacing)은 완전 양방향이다.** 플러그인 import/export가 무손실 왕복을 보장한다.
2. **컴포넌트 "구조"의 역방향**(디자이너가 Figma에서 오토레이아웃/레이어를 바꾼 것을 코드로 자동 반영)은
   현존 도구로 불가능하다. 디자이너 변경은 (a) 토큰 값 변경 → P5 경유 자동 반영, 또는
   (b) 구조 변경 요청 → 개발자가 D1 수정 → story.to.design 재import, 두 경로만 허용한다.
3. **차트**: Figma로 가는 것은 렌더 스냅샷/벡터 근사이며, Figma에서 데이터·축을 편집해도 코드로
   돌아오지 않는다. 색상만 토큰 경유로 왕복한다.
4. **선언 호스팅은 공개 URL이 전제다.** GitHub Pages/jsdelivr는 public 리포에서 무료로 CORS `*`
   제공. Pages는 리포 Settings에서 활성화가 선행 조건이며, 활성화 전에는 jsdelivr @gh로 즉시 대체 가능.
5. **Figma 폰트**: 프리셋 폰트(Pretendard/Inter)가 Figma에 설치되어 있지 않으면 Text Style 생성이
   Inter로 폴백된다. 조직 폰트 설치가 선행 조건이다.
6. 플러그인은 "생성·갱신"만 하고 "삭제"는 하지 않는다(§0-15). 정리는 사람이 한다.

## 9. figma-story-tools — SaaS 없이 동일 목적을 달성하는 자체 옵션 (Stage C)

story.to.design(3-3, SaaS)과 병행 가능한 자체 경로다. 빌드 타임에 컴포넌트 매핑
정보를 추출·배포하고, DS Generator 플러그인이 URL로 소비한다.

1. `pnpm build:manifest` — `src/ds` 소스에서 §3 매핑 정보 + tokens 3프리셋을
   [packages/figma-story-tools/manifest.json](../packages/figma-story-tools/manifest.json)으로
   직렬화한다(플러그인 내장 매니페스트와의 동일성을 빌드가 검증).
2. `pnpm --dir packages/figma-story-tools pack`으로 내용 확인 후 **오너 npm 계정으로
   발행** (사람 단계): `pnpm whoami`로 로그인 확인 →
   `pnpm --dir packages/figma-story-tools publish --publish-branch main`.
   (저장소가 `main` 브랜치라 `--publish-branch main` 필수 — pnpm 기본값 `master`와 다름.
   이 저장소는 pnpm 전용이므로 `npm publish`는 쓰지 않는다.)
3. Figma → DS Generator → **[원격에서 가져오기(URL)]** →
   `https://unpkg.com/figma-story-tools@latest/manifest.json`
   (unpkg/jsdelivr는 CORS `*`라 플러그인에서 fetch 가능 — manifest.json
   networkAccess에 허용됨).
4. [디자인시스템 생성] 실행 — 로드된 매니페스트로 P3 생성 로직이 그대로 동작한다.
   컴포넌트 정의를 바꾸려면 코드(D1 props/args) 수정 → 재빌드·재발행이 유일 경로다.

## 10. 문서 페이지 픽셀 미러링 (대안 경로 — 구현 안 함)

픽셀 동일 미러링이 필요하면 서드파티 **html.to.design** 플러그인으로 Storybook 문서 URL을
직접 import할 수 있다(별도 유료 플러그인). 본 프로젝트의 표준 경로는 DS Generator의
docs-content.json 미러링(P4)이다.

## 11. 트러블슈팅

- **"Failed to fetch dynamically imported module"**: 플러그인 팝업을 닫고 재시도한다.
- Design 탭이 비어 있으면 `design.url`의 `node-id`가 실제 프레임을 가리키는지 확인한다.
- Pages 배포가 안 뜨면 저장소 Settings → Pages → Source가 **GitHub Actions**인지, Actions
  탭에서 `Deploy TDS docs to GitHub Pages` 잡이 성공했는지 확인한다.
- 플러그인 원격 로드가 404면 jsdelivr @gh URL은 즉시 동작하지만 Pages URL은 첫 배포 완료 후
  가능하다. jsdelivr는 브랜치 변경 반영에 캐시 지연(수 분)이 있을 수 있다.
