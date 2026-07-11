# Design QA 플랫폼 운영 가이드

## 자동 게이트 (CI/스크립트)

| 게이트 | 명령 | 검증 내용 |
|---|---|---|
| 통합 빌드 | `pnpm build-storybook` | tokens→tailwind→storybook 체인 에러 0 |
| 타입 게이트 | `pnpm typecheck` | tsc strict 0 에러 (src 전체 — CI에서 빌드 전 실행) |
| 매핑 규약 | `node scripts/verify-mapping.mjs` | DS props ↔ Figma 매니페스트 §3 왕복 동일성 |
| 토큰 스키마 | `node scripts/validate-tokens.mjs` | 부록 C 스키마 (3프리셋 + export 산출물) |
| SSOT 색상 | `grep -rEn '#[0-9a-fA-F]{6}' src/ds src/docs` | hex 0건 (예외: brand.css, SocialLoginButton/logos) |
| 문서 배포 | `pages.yml` (push 시 자동) | Storybook + 선언(manifest/tokens/docs-content)을 GitHub Pages에 배포 |

## 문서 사이트 배포 (GitHub Pages)

1. push → Actions의 `Deploy TDS docs to GitHub Pages` 잡이 typecheck·build:manifest·
   build-storybook 후 배포한다.
2. 배포 URL: `https://figam-dev-variable-tools.github.io/Auto-Builder/`
   (선언: `.../manifest.json`, `.../tokens/<preset>.json`, `.../docs-content.json`)
3. 시각 회귀(스냅샷 diff)는 이 프로젝트 범위 밖 — 필요 시 Chromatic 등을 별도 도입.
   토큰 값 변경은 영향이 넓으므로 커밋을 단독 분리해 리뷰한다.

## 수동 QA 체크리스트 (릴리스 전)

- [ ] 툴바 Preset(bootstrap/tailwind/toss) 전환 시 DS 전 컴포넌트 색·폰트 반영
- [ ] '7. 상태 & 검증' 매트릭스와 각 컴포넌트 States 스토리 일치
- [ ] '8. Playground' 통합 플로우 동작 (입력→검증→Dialog→Snackbar)
- [ ] 오버레이(Modal/Drawer/BottomSheet) 내부에서 프리셋 토큰 적용 확인
  (portal 미사용 규약 — ThemeScope 스코프 유지)
- [ ] Figma: DS Generator 생성 산출물의 모드 전환·속성 패널·슬롯 스왑
- [ ] KR 컴포넌트 검증식(주민/사업자/카드 Luhn) 정상·오류 케이스

## 이슈 기록

발견된 결함은 [known-issues.md](known-issues.md)에 KI-번호로 기록한다
(원인 분석 → 해결 → 검증 근거 순).
