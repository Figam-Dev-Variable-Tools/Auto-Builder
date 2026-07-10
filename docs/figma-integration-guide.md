# Figma 양방향 연동 가이드

이 문서는 사람이 직접 수행해야 하는 Figma ↔ Storybook 연동 절차를 정리한다.

## 1. 개요: 방향 2가지

| 방향 | 도구 | 상태 |
|---|---|---|
| Figma → Storybook | `@storybook/addon-designs` (스토리에 Figma Design 탭 임베드) | 코드 완료 (W12) |
| Storybook → Figma | Chromatic 배포 후 Figma 플러그인으로 스토리 임포트 | 코드 준비 완료 (W13) — 배포·연결은 사람 단계 |

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

## 3. Storybook → Figma 절차 — 3개 플러그인 비교

### 3-1. Storybook Connect (Chromatic)

- Chromatic 배포가 선행되어야 하며 **Public 프로젝트**가 필요하다. Private 프로젝트는
  Figma 플러그인에서 접근하지 못하는 한계가 있다.
- Chromatic 도메인 형식만 허용된다: `https://<branch>--<projectId>.chromatic.com`
- 절차: Chromatic 배포 → Figma에서 Storybook Connect 플러그인 실행 → Chromatic 계정
  연결 → 스토리 URL 붙여넣기 → 프레임에 링크.

### 3-2. Anima

- 베타 토큰이 필요하고 설정이 복잡하다 → **비권장** (사용자 판단 기록).

### 3-3. story.to.design ★권장

- 제약이 적고 간단하다. 도달 가능한 Storybook URL(Public 배포 또는 로컬 터널)만 있으면 된다.
- 절차: 플러그인 실행 → Storybook URL 연결 → *Select story* → *args import* →
  *Add to canvas*.

## 4. 권장 워크플로 요약

1. **story.to.design 우선** 사용.
2. 사내 Private Storybook이면 Storybook Connect는 **Public 전환이 필요**하다는 점을 감안한다.

## 5. story.to.design 매핑 검증 절차 (G2)

1. Chromatic으로 Storybook을 배포한다 (`CHROMATIC_PROJECT_TOKEN=xxxx pnpm chromatic`).
2. Figma에서 story.to.design 플러그인을 실행하고 배포된 Storybook URL을 연결한다.
3. `3. 컴포넌트/Button` 스토리를 선택 → args(`variant`/`size`/`disabled`/`label`/`showIcon`)가
   Figma Component Properties로 import되는지 확인한다.
4. §3 매핑 규약 덕에 DS Generator 플러그인(P3)이 만든 수동 컴포넌트와 이름이 같다.
   **중복 방지 규칙**: story.to.design 산출물은 별도 페이지 `__imported`에 두고,
   정본은 P3 산출물로 유지한다. 차이 발견 시 **코드(args)가 우선**한다.

## 6. Storybook Connect 절차 (v1 갱신)

1. Chromatic **Public** 프로젝트 배포가 선행 조건이다 (Private 미지원 — 부록 F-4).
2. Figma에서 Storybook Connect 플러그인 실행 → Chromatic 계정 연결.
3. `DS/Button` 등 P3 산출 컴포넌트를 선택하고 대응 스토리
   (`3. 컴포넌트/Button`) URL을 붙여 링크한다.
4. 링크되면 Storybook Design 탭에서 Figma 상태를 상호 참조할 수 있다.

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
4. **Storybook Connect는 Chromatic Public 프로젝트만 지원**한다. 사내 Private 정책이면
   story.to.design + addon-designs 조합을 표준 경로로 삼는다.
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
   `npm publish`** (사람 단계).
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
- Chromatic 빌드 실패 시 `pnpm build:tw`가 선행 실행되었는지 확인한다
  (`tailwind.generated.css` 필요).
