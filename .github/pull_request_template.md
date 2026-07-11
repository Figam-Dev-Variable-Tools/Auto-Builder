## 요약

<!-- 이 PR이 무엇을 바꾸는지 1~2줄로 -->

## 변경 유형

- [ ] feat — 신규 기능/컴포넌트
- [ ] fix — 버그 수정
- [ ] docs — 문서
- [ ] refactor/chore — 리팩터링·설정

## 체크리스트

- [ ] `pnpm typecheck` 타입 게이트 통과 (0 에러)
- [ ] `pnpm build-storybook` 통합 빌드 통과
- [ ] DS/토큰 변경 시 `pnpm build:manifest` 왕복 동일성 통과
- [ ] SSOT 색상 규약 준수 — `src/ds`·`src/docs`에 hex 리터럴 없음 (예외: brand.css, SocialLoginButton/logos)
- [ ] 신규 스토리는 사이드바 정렬(`.storybook/preview.tsx` storySort) 규약을 따름
