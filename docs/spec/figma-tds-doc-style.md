# Toss-TDS Component-Document Style Spec

Single source of truth for how the Figma plugin renders a **category page** (e.g. "Input")
whose every component is a **document section**. Numbers and hex are literal and bindable —
another agent maps them 1:1 to Figma Text Styles and node properties.

**Grounded in this repo's own style:**
- Tokens: `figma-plugin/src/presets.ts` → `toss` preset (the values below are that preset).
- Doc chrome: `src/docs/DocRenderer.tsx` + `DocRenderer.module.css`, `src/docs/TokenRecipe.tsx` + `.module.css`.
- Rendered reference: Storybook DOC snapshots `001-1.png` (컬러), `002-2.png` (타이포그래피),
  and input stories `049-TextField.png`, `040-SearchField.png`
  (in `packages/figma-story-tools/snapshots/`).

Base: font `Pretendard` (fallback `-apple-system`, then `Inter`, `sans-serif`);
`baseSize 16`, `scale 1.2` → size ramp **11 · 13 · 16 · 19 · 23 · 28** (xs…xxl);
weights regular 400 / medium 500 / bold 700; radius 4/8/12 (sm/md/lg);
spacing 4/8/12/16/20/24 (1…6).

---

## 1. Type ramp

Font family for every role: **`Pretendard, -apple-system, Inter, sans-serif`** (Pretendard first,
Inter is the cross-platform fallback). Monospace roles noted explicitly use
`ui-monospace, 'SF Mono', Consolas, monospace`.

| Role | Size (px) | Token | Weight | Line-height | Letter-spacing | Color | Color token |
|---|---|---|---|---|---|---|---|
| **PageTitle** (category, e.g. "Input") | 28 | `font-size-xxl` | 700 bold | 120% | -0.02em | `#191F28` ink | `color/text` |
| **PageSubtitle** (category one-liner) | 16 | `font-size-md` | 400 regular | 170% | 0 | `#4E5968` sub | `color/secondary` |
| **ComponentName** (bold, e.g. "TextField") | 19 | `font-size-lg` | 700 bold | 130% | -0.01em | `#191F28` ink | `color/text` |
| **Eyebrow** (tag, e.g. "Molecule · Input") | 11 | `font-size-xs` | 500 medium | 100% | +0.06em, UPPERCASE latin | `#3D6BFF` accent | `color/primary` |
| **Description** (component one-liner) | 13 | `font-size-sm` | 400 regular | 160% | 0 | `#4E5968` sub | `color/secondary` |
| **Meta** (row: "Platform: Web" · "4 variants") | 11 | `font-size-xs` | 500 medium | 140% | +0.02em | label `#8B95A1` muted / value `#4E5968` sub | muted = literal (see §2) / `color/secondary`; count uses `font-variant-numeric: tabular-nums` |
| **RenderLabel** (tag on render container, e.g. "TEXTFIELD") | 10 | — (fixed, below xs) | 500 medium | 100% | +0.08em, UPPERCASE | `#4E5968` sub | `color/secondary`; **mono** family |

Notes:
- PageTitle carries the repo's signature **accent underline** (see §4 / `.heading::after`): a
  44 × 3 px pill in `#3D6BFF` at the title's bottom-left. Optional but on-brand.
- Eyebrow color may drop to sub `#8B95A1`/`#4E5968` if accent feels loud on a dense page; default accent.
- RenderLabel mirrors `.previewLabel` exactly (10px, uppercase, +0.08em, mono, secondary).

---

## 2. Color roles

| Role | Hex | `color/*` variable (`--ds-color-*`) | Usage |
|---|---|---|---|
| **ink** | `#191F28` | `color/text` | PageTitle, ComponentName, primary text, filled input value |
| **sub** | `#4E5968` | `color/secondary` | subtitles, descriptions, helper text, meta values, RenderLabel |
| **muted** | `#8B95A1` | *(no preset token — fixed Toss neutral)* | placeholders, meta labels, tertiary hints. Bind as a literal `#8B95A1`; if a token is required, fall back to `color/secondary` at reduced emphasis |
| **border** | `#E5E8EB` | `color/border` | hairline borders, render-container edge, row dividers |
| **surface** | `#F5F7FA` | `color/bgSubtle` | soft fills: hatched border ring, disabled input fill, meta chip bg |
| **accent** | `#3D6BFF` | `color/primary` | eyebrow tag, title underline, focus ring, active/selected |
| page/card bg | `#FFFFFF` | `color/bg` | page background, render-container fill, input fill |
| (error, contextual) | `#F04452` | `color/error` | error-state input border + error message text |

---

## 3. Spacing scale

All values are token multiples unless marked *(derived)*.

| Gap | Value (px) | Token |
|---|---|---|
| Page padding (outer) | 40 top / 32 sides / 64 bottom | *(derived: 40 ≈ spacing-5+5, 32 = spacing-4×2, 64 = spacing-6+... )* |
| Content column max-width | 880 | — (matches `.page` / `.wrap`) |
| **Gap between component-documents** | 48 | *(derived: spacing-6 × 2 = 48)* |
| **Gap within a section** (vertical stack) | eyebrow→name 6 · name→description 8 (`spacing-2`) · description→meta 12 (`spacing-3`) · meta→render-container 16 (`spacing-4`) | mixed |
| **Render-container padding** | 24 | `spacing-6` |
| **Gap between variant items** | 20 (`spacing-5`) for vertical field stacks · 16 (`spacing-4`) for horizontal wrap | spacing-5 / spacing-4 |

---

## 4. Surfaces

**Render container** (from `.previewFrame`):
- Fill: `#FFFFFF` (`color/bg`).
- Border: 1 px solid `#E5E8EB` (`color/border`).
- Radius: 12 (`radius-lg`).
- Padding: 24 (`spacing-6`).
- Width: fills the content column (up to 880 px).
- Layout: for input variants, **vertical stack**, item gap 20; RenderLabel pinned top 10 / right 12.
- **Signature hatched ring** (optional, on-brand): the border-box shows a 45° repeating stripe of
  `#F5F7FA` (`color/bgSubtle`) — 6 px stripe / 6 px gap — while the padding-box stays solid white.
  In Figma: solid white frame + a 1 px `#E5E8EB` stroke; the diagonal hatch is a decorative inset
  and may be omitted if it doesn't translate cleanly. Solid hairline border is the safe default.

**Page background:** `#FFFFFF` (`color/bg`). Sections separate by whitespace + each container's hairline,
not by a tinted page. (Use `#F5F7FA` for the page only if containers need extra lift — not default.)

**Accent underline** (PageTitle decoration, from `.heading::after`): 44 × 3 px, radius 999 (pill),
fill `#3D6BFF` (`color/primary`), positioned at title bottom-left with ~12 px (`spacing-3`) gap above it.

**Row divider** (if listing meta/spec rows, from `.typeRow`/`.varRow`): 1 px top border `#E5E8EB`.

---

## 5. Section anatomy (per component-document)

Exact vertical order, top → bottom. Items marked *(optional)* may be omitted per component.

1. **Eyebrow** tag — e.g. `Molecule · Input` (accent, 11px, uppercase-latin). *(optional)*
2. **ComponentName** — bold, 19px ink. **(required)**
3. **Description** — one line, 13px sub. *(optional)*
4. **Meta row** — inline, ` · `-separated: `Platform: Web` · `4 variants`. 11px, muted labels / sub values. *(optional)*
5. **Render container** — bordered white frame (§4) holding the component's variants stacked
   vertically (gap 20). **(required)**
   - **RenderLabel** — 10px uppercase mono sub, pinned top-right inside the container. *(optional)*
   - **Variant item** — the live component; multi-state variants (default → filled → error →
     disabled) each on their own row, following the input's own label/field/helper anatomy
     (label bold ink above; field white with hairline border, radius 8; helper 13px sub below;
     error state = `#F04452` border + `#F04452` message; disabled = `#F5F7FA` fill).

Vertical rhythm between 1→2→3→4→5: **6 / 8 / 12 / 16 px** (§3).

Category page = PageTitle (+ underline) → PageSubtitle → [48px gap] → repeated component-documents
(each separated by 48px).

---

## 6. Microcopy tone

**Korean-first, plain, calm, precise** — declarative sentences, no marketing adjectives, no exclamation.
Latin is used only for taxonomy, platform, and component/token names.

- **Eyebrow tags** — atomic-design taxonomy + category, mid-dot separated:
  `Atom · Input`, `Molecule · Input`, `Molecule · Form`. Keep latin taxonomy; category may be Korean
  (`분자 · 입력`) if the page is fully Korean. Default: latin taxonomy, restrained.
- **ComponentName** — the component's canonical name as-is: `TextField`, `SearchField`, `PasswordField`.
- **Description** — one plain Korean sentence stating what it is / when to use, ending in a period:
  「이메일·아이디 등 한 줄 텍스트를 입력받는 기본 필드.」 「검색어를 입력하고 지우는 필드.」
- **Meta row** — terse `key: value`, mid-dot separated, mixed KR/EN allowed:
  `Platform: Web · 변형 4개` (or `Platform: Web · 4 variants`). Numbers use tabular figures.
  Keep to 2–3 facts (platform, variant count, optional status like `Stable`).
- **In-render copy** — realistic, restrained sample data in Korean: placeholders like
  `name@example.com`, `검색어를 입력하세요`; helper `업무용 이메일을 입력하세요.`;
  error `올바른 이메일 형식이 아닙니다.` (calm, corrective, period-terminated — matches the snapshots).
