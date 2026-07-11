# Figma Category Page — Auto-Layout Anatomy Spec

> Build contract for the plugin. Target: an **"Input" category page** and its per-component
> document sections, built entirely with **nested auto-layout** via the Figma Plugin API.
> Owner of this doc = **geometry** (layoutMode / sizing / gaps / padding). Type & color tokens
> (Pretendard, `#3D6BFF`, `#191F28`, `#E5E8EB`, `#F5F7FA`, `#4E5968`) come from the TDS spec.
>
> Studied idioms reused from `figma-plugin/src/generators/components.ts`
> (`autoFrame`, `solid`, `getVar`, `makeText`, `boundPaint`, WRAP set in `makeButtonSet`/`makeBadgeSet`)
> and `figma-plugin/src/generators/docs.ts` (VERTICAL page frame, padding, `itemSpacing`,
> `componentDemo` → `set.defaultVariant.createInstance()`).

---

## 0. RULE #1 — nothing overlaps, ever

Every rule below exists to make overlap **structurally impossible**:

1. **No manual `x` / `y` on any node that lives inside an auto-layout frame.** Position is
   emergent from `layoutMode` + `itemSpacing` + padding + child sizing. (The only `x/y` writes
   in the whole build are on the top-level page-root frame's canvas position, never on children.)
2. **Every frame declares all six layout facts**: `layoutMode`, `primaryAxisSizingMode`,
   `counterAxisSizingMode`, plus its width intent (FIXED px / FILL / HUG), `itemSpacing`, and the
   four paddings. No frame is left with defaults.
3. **Three sizing intents, three exact recipes** (never mix them):

   | Intent | How (child of an auto-layout parent) | Notes |
   |---|---|---|
   | **FIXED px** | `counterAxisSizingMode='FIXED'; node.resize(W, node.height)` | Only the page-root uses a hard width (1240). |
   | **FILL parent width** | `node.layoutAlign='STRETCH'` — **do NOT `resize()` the width** | Requires the parent's counter axis to be FIXED (it always is in this chain). |
   | **HUG contents** | `primaryAxisSizingMode='AUTO'; counterAxisSizingMode='AUTO'` | Grows/shrinks to children. Default for tags, rows, variant items. |

4. **WRAP is the only way variant chips flow to new rows.** It requires **all three**:
   `layoutMode='HORIZONTAL'` + `layoutWrap='WRAP'` + a **FIXED primary-axis width**
   (supplied here by `layoutAlign='STRETCH'`). Row gap is a **separate** property
   (`counterAxisSpacing`), and `counterAxisAlignContent` controls how wrapped rows pack.
   Without the fixed width, items overflow horizontally instead of wrapping → overlap.
5. **Borders don't push layout**: `strokeAlign='INSIDE'` so the 1px border sits inside the box
   and doesn't change the frame's layout footprint.
6. **Width-capped text** (subtitle, description) uses `textAutoResize='HEIGHT'` +
   `resize(maxW, h)` so it wraps at a fixed width; **hugging text** uses
   `textAutoResize='WIDTH_AND_HEIGHT'`. Never `'NONE'` (that clips).

The FIXED-width chain that makes every FILL work:
`root (FIXED 1240) → section (STRETCH→fixed 1080) → head / render (STRETCH→fixed 1080)`.
Each stretched child becomes a fixed-width parent for the next level down.

---

## 1. Geometry tokens (this doc owns these)

Spacing / radius come from the toss preset (`spacing/1..6` = 4/8/12/16/20/24, `radius/sm|md|lg` = 4/8/12).

| Purpose | Value | Token (if bound) |
|---|---|---|
| Page padding (root) | 80 | — (page frame) |
| Gap between component-documents | 56 | — |
| Gap inside a component-document (head ↔ render) | 20 | `spacing/5` |
| Gap inside doc-head (eyebrow/name/desc/meta) | 12 | `spacing/3` |
| Gap in eyebrow row / meta row / variant item | 8 | `spacing/2` |
| Render container padding | 24 | `spacing/6` |
| Render container column gap / row gap | 24 / 24 | `spacing/6` |
| Eyebrow tag padding | 4 v / 8 h | `spacing/1` / `spacing/2` |
| Render container radius | 12 | `radius/lg` |
| Eyebrow tag radius | 6 | — |
| Content width (1240 − 80·2) | **1080** | derived |
| Render inner width (1080 − 24·2) | **1032** | derived |

Font sizes (toss scale, base 16 × 1.2ⁿ): `xs 11 / sm 13 / md 16 / lg 19 / xl 23 / xxl 28`.

| Text | px | Weight | Color | Sizing |
|---|---|---|---|---|
| Category title | 40 (display) | Bold | `#191F28` text | HUG |
| Category subtitle | 18 | Regular | `#4E5968` secondary | wrap @ maxW 720 |
| Eyebrow tag label | 12 | Bold | `#3D6BFF` primary | HUG |
| Component name | 28 (`xxl`) | Bold | `#191F28` text | HUG |
| Description | 16 (`md`) | Regular | `#4E5968` secondary | wrap @ maxW 640 |
| Meta item | 13 (`sm`) | Regular | `#8B95A1` | HUG |
| Variant caption | 12 | Regular | `#4E5968` secondary | HUG |

---

## 2. Frame tree

```
Category / Input        [FRAME · VERTICAL]   W=1240 FIXED · H=HUG · pad 80 · gap 56 · fill #F5F7FA
│
├─ Page Header          [FRAME · VERTICAL]   W=FILL · H=HUG · gap 12 · pad 0 · fill none
│  ├─ Category Title     [TEXT]  "Input"                 40/Bold #191F28   (HUG)
│  └─ Category Subtitle  [TEXT]  "텍스트 입력 계열 …"     18 #4E5968  (wrap @720)
│
└─ Doc / <Component>     [FRAME · VERTICAL]   W=FILL · H=HUG · gap 20 · pad 0 · fill none   (×N, gap 56 apart)
   │
   ├─ Doc Head           [FRAME · VERTICAL]   W=FILL · H=HUG · gap 12 · pad 0 · fill none
   │  ├─ Eyebrow Row      [FRAME · HORIZONTAL] W=HUG · H=HUG · gap 8 · center · fill none
   │  │  └─ Eyebrow Tag    [FRAME · HORIZONTAL] W=HUG · H=HUG · pad 4/8 · r6 · fill #F5F7FA
   │  │     └─ Tag Label    [TEXT] "FORM · INPUT"        12/Bold #3D6BFF   (HUG)
   │  ├─ Component Name    [TEXT]  "Text Field"           28/Bold #191F28   (HUG)
   │  ├─ Description       [TEXT]  "이메일·비밀번호 …"     16 #4E5968  (wrap @640)
   │  └─ Meta Row          [FRAME · HORIZONTAL] W=HUG · H=HUG · gap 8 · center · fill none
   │     ├─ Meta Item       [TEXT] "React: TextField"     13 #8B95A1
   │     ├─ Dot             [ELLIPSE 3×3 #C5CCD3]
   │     ├─ Meta Item       [TEXT] "States: 5"            13 #8B95A1
   │     ├─ Dot             [ELLIPSE 3×3 #C5CCD3]
   │     └─ Meta Item       [TEXT] "Size: md"             13 #8B95A1
   │
   └─ Render Container    [FRAME · HORIZONTAL · WRAP]  W=FILL · H=HUG · pad 24 · colGap 24 · rowGap 24
      │                    border #E5E8EB 1px INSIDE · r12 · fill #FFFFFF · alignContent AUTO · items top
      ├─ Variant Item      [FRAME · VERTICAL]  W=HUG · H=HUG · gap 8 · center · fill none
      │  ├─ instance         (native DS component instance, setProperties per state)
      │  └─ Caption          [TEXT] "Default"             12 #4E5968
      ├─ Variant Item …     (Error / Success / Disabled / ReadOnly …)   ← wraps to next row automatically
      └─ …
```

---

## 3. Per-frame spec + exact API

Shared helpers (mirror `components.ts`; add to a new `generators/category.ts`):

```ts
const solid = (hex: string): SolidPaint => ({ type: 'SOLID', color: hexToRgb(hex) })

function autoFrame(name: string, dir: 'HORIZONTAL' | 'VERTICAL'): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'AUTO'   // HUG by default; callers override
  f.counterAxisSizingMode = 'AUTO'
  f.fills = []
  return f
}

function text(name: string, chars: string, size: number, color: string, bold = false): TextNode {
  const t = figma.createText()
  t.name = name
  t.fontName = { family: 'Pretendard', style: bold ? 'Bold' : 'Regular' }
  t.characters = chars
  t.fontSize = size                          // or t.setBoundVariable('fontSize', getVar(ctx,'font/size/md'))
  t.fills = [solid(color)]
  t.textAutoResize = 'WIDTH_AND_HEIGHT'      // HUG; width-capped text overrides below
  return t
}
```

> Fonts: `await figma.loadFontAsync({family:'Pretendard', style:'Regular'})` **and** `'Bold'`
> before creating any text (same fallback-to-Inter pattern as `generateComponents`). Color/size
> may be `setBoundVariable`-bound to `color/*` and `font/size/*` instead of the literals shown.

### 3.1 Category page root — VERTICAL, FIXED 1240, HUG height

| Property | Value |
|---|---|
| layoutMode | `VERTICAL` |
| primaryAxisSizingMode | `AUTO` (hug height) |
| counterAxisSizingMode | `FIXED` (fix width) |
| counterAxisAlignItems | `MIN` (left-align children) |
| width | **1240 FIXED** |
| itemSpacing | **56** (between page-header and each component-document) |
| padding t/r/b/l | 80 / 80 / 80 / 80 |
| fill | `#F5F7FA` (page canvas) |

```ts
const root = figma.createFrame()
root.name = 'Category / Input'
root.layoutMode = 'VERTICAL'
root.counterAxisSizingMode = 'FIXED'          // (a) fix the counter axis first…
root.resize(1240, root.height)                // (b) …then set the 1240 width
root.primaryAxisSizingMode = 'AUTO'           // (c) hug height
root.counterAxisAlignItems = 'MIN'
root.itemSpacing = 56
root.paddingTop = root.paddingRight = root.paddingBottom = root.paddingLeft = 80
root.fills = [solid('#F5F7FA')]
figma.currentPage.appendChild(root)
root.x = 0; root.y = 0                         // ← the ONLY x/y write; positions the root on canvas
```

### 3.2 Page Header — VERTICAL, FILL width, HUG height

| Property | Value |
|---|---|
| layoutMode | `VERTICAL` |
| primaryAxisSizingMode | `AUTO` |
| counterAxisSizingMode | driven by STRETCH |
| width | **FILL** (`layoutAlign='STRETCH'` → 1080) |
| itemSpacing | 12 |
| padding | 0 |

```ts
const header = autoFrame('Page Header', 'VERTICAL')
header.layoutAlign = 'STRETCH'                 // FILL width — do NOT resize()
header.itemSpacing = 12
root.appendChild(header)

const title = text('Category Title', 'Input', 40, '#191F28', true)   // HUG
header.appendChild(title)

const subtitle = text('Category Subtitle',
  '텍스트 입력 계열 — Text · Email · Password · Search · Number · Textarea. 정상 · 포커스 · 에러 · 비활성 · 읽기전용 상태를 모두 렌더한다.',
  18, '#4E5968')
subtitle.textAutoResize = 'HEIGHT'            // wrap, not hug
subtitle.resize(720, subtitle.height)         // maxWidth 720
header.appendChild(subtitle)
```

### 3.3 Component-Document section — VERTICAL, FILL width, HUG height

One per component. Root's `itemSpacing=56` sets the gap between successive sections.

| Property | Value |
|---|---|
| layoutMode | `VERTICAL` |
| primaryAxisSizingMode | `AUTO` |
| counterAxisSizingMode | driven by STRETCH |
| width | **FILL** (1080) |
| itemSpacing | **20** (doc-head ↔ render container) |
| padding | 0 |

```ts
const section = autoFrame('Doc / TextField', 'VERTICAL')
section.layoutAlign = 'STRETCH'               // FILL 1080
section.itemSpacing = 20
root.appendChild(section)
```

### 3.4 Doc Head — VERTICAL, FILL width, HUG height

Holds eyebrow row, component name, description, meta row. `itemSpacing=12` between them.

```ts
const head = autoFrame('Doc Head', 'VERTICAL')
head.layoutAlign = 'STRETCH'
head.itemSpacing = 12
section.appendChild(head)
```

**Eyebrow row + tag pill** (HORIZONTAL, HUG, vertically centered):

```ts
const eyebrow = autoFrame('Eyebrow Row', 'HORIZONTAL')
eyebrow.counterAxisAlignItems = 'CENTER'
eyebrow.itemSpacing = 8
head.appendChild(eyebrow)

const tag = autoFrame('Eyebrow Tag', 'HORIZONTAL')   // pill
tag.counterAxisAlignItems = 'CENTER'
tag.paddingTop = tag.paddingBottom = 4
tag.paddingLeft = tag.paddingRight = 8
tag.cornerRadius = 6
tag.fills = [solid('#F5F7FA')]
tag.appendChild(text('Tag Label', 'FORM · INPUT', 12, '#3D6BFF', true))
eyebrow.appendChild(tag)
```

**Component name** (HUG):

```ts
head.appendChild(text('Component Name', 'Text Field', 28, '#191F28', true))
```

**Description** (wrap @ maxW 640):

```ts
const desc = text('Description',
  '이메일·비밀번호 등 한 줄 입력을 받는 기본 폼 필드. label 위 / helper·error 아래 규약을 따른다.',
  16, '#4E5968')
desc.textAutoResize = 'HEIGHT'
desc.resize(640, desc.height)                 // maxWidth 640
head.appendChild(desc)
```

**Meta row** (HORIZONTAL, HUG, dot separators):

```ts
const meta = autoFrame('Meta Row', 'HORIZONTAL')
meta.counterAxisAlignItems = 'CENTER'
meta.itemSpacing = 8
head.appendChild(meta)

const dot = (): EllipseNode => {
  const e = figma.createEllipse()
  e.name = 'dot'
  e.resize(3, 3)                               // fixed 3×3; centered by row's CENTER align
  e.fills = [solid('#C5CCD3')]
  return e
}
meta.appendChild(text('meta-1', 'React: TextField', 13, '#8B95A1'))
meta.appendChild(dot())
meta.appendChild(text('meta-2', 'States: 5', 13, '#8B95A1'))
meta.appendChild(dot())
meta.appendChild(text('meta-3', 'Size: md', 13, '#8B95A1'))
```

### 3.5 Render Container — HORIZONTAL **WRAP**, FILL width, HUG height ★

The bordered surface. This is the frame where WRAP prevents overlap. Note the property split:
`itemSpacing` = **column** gap, `counterAxisSpacing` = **row** gap, `counterAxisAlignContent`
= how wrapped rows pack along the vertical axis.

| Property | Value | Why |
|---|---|---|
| layoutMode | `HORIZONTAL` | WRAP requires horizontal |
| layoutWrap | `WRAP` | items flow to new rows |
| primaryAxisSizingMode | `FIXED` | WRAP needs fixed main-axis width (supplied by STRETCH) |
| counterAxisSizingMode | `AUTO` | hug height as rows are added |
| width | **FILL** (1080) via `layoutAlign='STRETCH'` | gives the FIXED main-axis width WRAP needs |
| primaryAxisAlignItems | `MIN` | pack items left |
| counterAxisAlignItems | `MIN` | align items to the top of each row |
| counterAxisAlignContent | `AUTO` | pack wrapped rows at top (use `SPACE_BETWEEN` to distribute) |
| itemSpacing (col gap) | 24 | |
| counterAxisSpacing (row gap) | 24 | separate from col gap |
| padding t/r/b/l | 24 / 24 / 24 / 24 | |
| cornerRadius | 12 | |
| fill | `#FFFFFF` | |
| stroke | `#E5E8EB` 1px, `strokeAlign='INSIDE'` | border doesn't grow footprint |

```ts
const render = figma.createFrame()
render.name = 'render'
render.layoutMode = 'HORIZONTAL'
render.layoutWrap = 'WRAP'                     // ① wrap
render.primaryAxisSizingMode = 'FIXED'         // ② fixed main axis (WRAP requirement)…
render.layoutAlign = 'STRETCH'                 // …③ supplied by stretching to 1080
render.counterAxisSizingMode = 'AUTO'          // ④ hug height
render.primaryAxisAlignItems = 'MIN'
render.counterAxisAlignItems = 'MIN'           // top-align items within a row
render.counterAxisAlignContent = 'AUTO'        // pack wrapped rows at top
render.itemSpacing = 24                         // column gap
render.counterAxisSpacing = 24                  // row gap
render.paddingTop = render.paddingRight = render.paddingBottom = render.paddingLeft = 24
render.cornerRadius = 12
render.fills = [solid('#FFFFFF')]
render.strokes = [solid('#E5E8EB')]
render.strokeWeight = 1
render.strokeAlign = 'INSIDE'
section.appendChild(render)
```

> **Why STRETCH is mandatory here:** `layoutAlign='STRETCH'` fixes this HORIZONTAL frame's width
> (its primary axis) to the parent's 1080. A HUG primary axis + WRAP is contradictory — Figma
> would keep everything on one row and items would overflow (overlap). The stretch is what makes
> the row break at 1080.

### 3.6 Variant Item — VERTICAL, HUG both axes

One per rendered state. `counterAxisAlignItems='CENTER'` centers the caption under the instance.

| Property | Value |
|---|---|
| layoutMode | `VERTICAL` |
| primaryAxisSizingMode | `AUTO` (HUG) |
| counterAxisSizingMode | `AUTO` (HUG) |
| counterAxisAlignItems | `CENTER` |
| itemSpacing | 8 |
| padding | 0 |

```ts
function variantItem(set: ComponentSetNode, props: Record<string,string>, caption: string): FrameNode {
  const item = autoFrame('Variant / ' + caption, 'VERTICAL')  // HUG both axes
  item.counterAxisAlignItems = 'CENTER'
  item.itemSpacing = 8

  const inst = set.defaultVariant.createInstance()            // native instance (docs.ts idiom)
  inst.layoutAlign = 'INHERIT'                                // must NOT stretch
  inst.layoutGrow = 0
  try { inst.setProperties(props) } catch {}                  // drive the state
  item.appendChild(inst)

  item.appendChild(text('caption', caption, 12, '#4E5968'))
  return item
}
```

Instances keep their own intrinsic size (e.g. `DS/TextField` is 320 wide) — the item hugs to it,
so items with different widths coexist and wrap cleanly. `320·3 + 24·2 = 1008 ≤ 1032`, so three
TextField cards fit per row before wrapping.

---

## 4. Populating the "Input" category (RULE #1 — render every meaningful state)

Per the Figma quality bar, each component-document renders its **distinct states as separate
variant items** — never one lonely state, and never the same content multiplied per size.
Pull each `DS/*` **component set** by name (docs.ts `componentDemo` idiom) and drive states with
`inst.setProperties(...)`:

```ts
const findSet = (name: string) =>
  figma.root.findOne(n => n.type === 'COMPONENT_SET' && n.name === name) as ComponentSetNode | null
```

| Component-document | Set | Variant items (caption → props) |
|---|---|---|
| **Text Field** | `DS/TextField` | Default `{}` · Filled `{}`(+text) · Error `{error:'true'}` · Success `{success:'true'}` · Disabled `{disabled:'true'}` · ReadOnly `{readOnly:'true'}` |
| **Checkbox** | `DS/Checkbox` | Unchecked `{checked:'false'}` · Checked `{checked:'true'}` · Indeterminate `{indeterminate:'true'}` · Disabled `{disabled:'true'}` |
| **Toggle / Switch** | `DS/Toggle` | Off `{checked:'false',size:'md'}` · On `{checked:'true',size:'md'}` · Disabled `{disabled:'true',size:'md'}` |
| **Chip** | `DS/Chip` | Default `{selected:'false',size:'md'}` · Selected `{selected:'true',size:'md'}` · Disabled `{disabled:'true',size:'md'}` |

(Size axes are collapsed to `md` — showing on/off/error states, not one card per size.)

Assembly loop:

```ts
type DocSpec = { title: string; eyebrow: string; desc: string; setName: string;
                 states: Array<{ caption: string; props: Record<string,string> }> }

function buildDoc(root: FrameNode, d: DocSpec) {
  const section = /* §3.3 */; root.appendChild(section)
  const head    = /* §3.4 head + eyebrow(d.eyebrow) + name(d.title) + desc(d.desc) + meta */
  section.appendChild(head)
  const render  = /* §3.5 */; section.appendChild(render)
  const set = findSet(d.setName)
  if (!set) return  // skip gracefully (docs.ts skipped[] pattern) — never leave a half frame
  for (const s of d.states) render.appendChild(variantItem(set, s.props, s.caption))
}
```

---

## 5. Overlap-proof checklist (run before shipping the build)

- [ ] No `x` / `y` assignment anywhere except the single page-root canvas placement (§3.1).
- [ ] Every frame sets `layoutMode` + `primaryAxisSizingMode` + `counterAxisSizingMode`.
- [ ] All FILL widths are `layoutAlign='STRETCH'`, **not** `resize()`; only the root uses a hard 1240.
- [ ] The render container has **all three** WRAP conditions: `HORIZONTAL` + `layoutWrap='WRAP'`
      + fixed primary width (via STRETCH). Row gap uses `counterAxisSpacing`, not `itemSpacing`.
- [ ] Variant-item instances have `layoutAlign='INHERIT'` and `layoutGrow=0` (never stretch/grow).
- [ ] Width-capped text uses `textAutoResize='HEIGHT'` + `resize(maxW,h)`; hugging text uses
      `'WIDTH_AND_HEIGHT'`. None use `'NONE'`.
- [ ] `strokeAlign='INSIDE'` on the bordered render container.
- [ ] Fonts (`Pretendard` Regular + Bold) loaded before any text is created.
- [ ] Missing component set → skip the doc (record in `skipped[]`); never emit an empty frame.
