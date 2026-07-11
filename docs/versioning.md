# Versioning & 배포 정책

## 버전 대상

| 자산 | 버전 관리 방식 |
|---|---|
| 디자인 토큰 (`tokens/*.json`) | git 이력이 SSOT. 값 변경 = breaking 아님(소비자는 CSS 변수 참조), 키 추가/삭제 = minor/major |
| DS 컴포넌트 (`src/ds/`) | 저장소 단위 버전(package.json `version`). props 제거/이름 변경 = major, 추가 = minor |
| `figma-story-tools` (npm) | 독립 semver(`packages/figma-story-tools/package.json`). 매니페스트 스키마 변경 = major |
| Figma 플러그인 | manifest `id` 고정, 배포는 dist 재빌드 — 코드 버전은 저장소 버전을 따름 |

## 릴리스 절차

1. 변경 후 검증 게이트 통과: `pnpm build-storybook` + `node scripts/verify-mapping.mjs`
   + `node scripts/validate-tokens.mjs` (Design QA 문서 참조)
2. `package.json` version bump (semver) → 커밋 메시지에 변경 요약
3. push → GitHub Actions(`pages.yml`)가 문서 사이트 + 선언을 GitHub Pages에 자동 배포
4. 컴포넌트 props가 바뀐 경우: `pnpm build:manifest` 재실행 → 커밋·push하면 jsdelivr @gh /
   Pages 매니페스트가 갱신되어 플러그인 원격 임포트에 즉시(캐시 지연 감안) 반영.
   (npm 발행은 선택 — 공개 리포 호스팅으로 이미 배포됨)
5. 토큰이 바뀐 경우: Figma에서 DS Generator [원격에서 가져오기]로 pull —
   양방향 동기화 규약은 figma-integration-guide.md 참조

## 호환성 규칙

- 코어 5종(Button/TextField/Card/Alert/Badge) props는 Figma 매니페스트와 왕복
  동일성이 검증된다(verify-mapping) — **이름/유니온 값 변경은 매니페스트·플러그인
  동시 수정 없이는 CI가 거부**한다.
- 함수형 props(onClick 등)는 매핑 파서가 무시하므로 자유롭게 추가 가능.
- 문자열 유니온 prop 추가는 Figma variant 축 증가를 의미 — 변형 수 폭발
  (예: Button 24 → 48 variants)을 검토 후 결정한다.
