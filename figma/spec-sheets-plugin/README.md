# TDS Spec Sheets — Figma plugin

Generates, per TDS component, a documentation **spec sheet** on the Figma canvas — backed by
**real Figma Component Sets and real Component Properties** (double-clickable components with a
genuine property panel), not rectangle mockups.

It reads **`spec-data.json`**, which is generated verbatim from every component's `*.meta.ts`
(prop names, options, defaults, figma property types) plus the token export
(`radius` / `spacing` / `shadow` scales). Nothing is invented: the plugin only renders what the
metadata declares. Platform support is reported as **Web only** (the metas don't track
Android/iOS), so only the 🌐 Web pill is drawn.

## What it produces

For each selected component:

- **★ One real Component Set** (`Spec/<Name>`) whose variant axes are the component's
  `variantProps` **plus a `State` axis** from its declared states. To stay usable, the set is
  _sparse_ but still real: a base variant (every axis at its default) + one variant per
  non-default option of each axis + one per non-default state. Every axis and every option
  therefore appears, so Figma infers the same variant properties — while the node count stays
  linear instead of the full cartesian product (Button alone would be 4050 variants).
  - Each variant is a framed, labelled Auto-Layout control styled from the component's `figma`
    spec + variant (fill / border / radius / padding / height from tokens, literal or bound).
  - **Component Properties** are added from `componentProps`: `BOOLEAN` (bound to a flag layer's
    visibility), `TEXT` (bound to a text layer's characters), `INSTANCE_SWAP` (bound to a slot
    instance's main component). Names are used verbatim.
- **A spec sheet card** laid out as:
  1. **Header** — component name + one-line description.
  2. **개발 상태** — platform pills (🌐 Web).
  3. **Prop sections** — one light sub-card per `variantProp` and per discrete `componentProp`
     (boolean → false/true, select → its options). Title reads `name = v1 [default] v2 …`; below
     it a wrapped row of **real instances**, one per value, each configured via
     `instance.setProperties(...)` / a specific variant.
  4. **interaction** — one instance per declared interaction (State axis), inside a purple dashed
     group.
  5. **customize** — only the axes the component exposes (`radius` / `padding` / `shadow`),
     instances bound to each token-scale step and labelled with a code tag.
  6. **Resource** — dashed purple slot previews, one per `INSTANCE_SWAP` prop plus a generic text
     slot.

Everything is Auto Layout; sheets are offset down the page so they never overlap; the Component
Set for each component is placed to the right of its sheet. Each run creates a fresh
**"TDS Spec Sheets"** page.

## Build

```bash
npm run spec:build
```

This runs three steps: `spec:data` (regenerate `spec-data.json` from the metas + token export) →
`spec:typecheck` (`tsc` against `@figma/plugin-typings`) → esbuild bundles
`src/code.ts` → `code.js`.

Regenerate only the data after editing any `*.meta.ts`:

```bash
npm run spec:data
```

## Import into Figma

1. **Plugins → Development → Import plugin from manifest…**
2. Select `figma/spec-sheets-plugin/manifest.json`.
3. Run **Plugins → Development → TDS Spec Sheets**.

## Use

1. In the plugin window, search / tick the components you want (grouped by atom / molecule /
   organism).
2. Click **생성**. Progress logs stream into the window; it finishes with a summary.
3. The new **TDS Spec Sheets** page is focused and zoomed to fit.

## Token binding vs. literal fallback

The `customize` section (and control base styling) prefers **real Figma Variables / Effect
Styles** when they exist in the file (matched by token name, e.g. `radius/md`, `shadow/sm`) — so a
file that already ran the TDS fidelity plugin stays fully token-driven. When those Variables /
styles are absent, the plugin **degrades gracefully to literal values** (mirrored from
`src/tokens/generated/figma.tokens.json`) and still labels each step. It never crashes on a
missing token.

## Known simplifications

- Component art is a **framed, labelled representation** (the reference "Framed Style"), not
  pixel-perfect per-component artwork. It is a real, variant-driven, property-bearing component —
  faithful enough for a spec sheet, but expect a feedback round to match screenshots exactly.
- The Component Set is **sparse** (see above): the property panel exposes every axis/option, but
  arbitrary cross-combinations of axes are not all materialised. The spec sheet only ever
  instantiates combinations that exist.
- **Platform = Web only** — the metadata does not track Android/iOS; those pills are never
  fabricated.
