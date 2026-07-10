# figma-story-tools

DS Platform의 컴포넌트 매핑 정보(§3 규약)와 디자인 토큰 3프리셋을 담은 배포용
매니페스트 패키지다. **SaaS(story.to.design) 없이** 동일 목적 — Storybook
컴포넌트/args를 Figma 컴포넌트·속성으로 생성 — 을 달성하는 자체 경로를 제공한다.

## 내용물

- `manifest.json` — DS 컴포넌트 5종 + 소셜/차트의 §3 매핑 정보
  (variant 축·TEXT·BOOLEAN·INSTANCE_SWAP·slot, Storybook args와 문자열까지 동일)
  + tokens 3프리셋(bootstrap/tailwind/toss) 임베드
- `tokens/*.json` — 프리셋별 토큰 원본 사본 (부록 C 스키마)

이 파일들은 저장소의 `pnpm build:manifest`(scripts/build-story-manifest.mjs)가
`src/ds` 소스에서 직렬화한 산출물이다 — 수동 편집 금지, 코드가 SSOT다.

## 소비 방법 (Figma 플러그인 "DS Generator")

1. npm 배포 후 CDN URL 사용 (unpkg/jsdelivr는 CORS `*` 허용):
   - `https://unpkg.com/figma-story-tools@latest/manifest.json`
   - `https://cdn.jsdelivr.net/npm/figma-story-tools@latest/manifest.json`
2. 플러그인 UI → **[원격에서 가져오기(URL)]** 에 위 URL 입력 → 매니페스트 로드.
3. **[디자인시스템 생성]** 실행 — 내장 매니페스트 대신 로드된 매니페스트로 동일한
   생성 로직이 실행된다(생성기는 매니페스트 주도).
4. 토큰만 동기화하려면 `tokens/<preset>.json` URL을 같은 채널로 로드하면 된다.

## 발행 (사람 단계)

```bash
pnpm build:manifest                         # 소스에서 재직렬화 + 왕복 동일성 검증
pnpm --dir packages/figma-story-tools pack  # 드라이런(패키징 내용 확인)
# npm publish는 오너 npm 계정으로 수동 수행
```
