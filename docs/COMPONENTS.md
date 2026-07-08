# TDS Component Catalog

> **Auto-generated** by `npm run catalog:build` — do not edit by hand.
> 60 components. Import any of them from the single barrel:
>
> ```ts
> import { Button, Card, Dropdown } from '@/components';
> ```

## Atoms (24)

| Component | Variants | Props | What it is |
| --- | --- | --- | --- |
| **Avatar** | `size`=xs|sm|md|lg|xl · `shape`=circle|rounded · `status`=none|online|offline|busy|away | `src` `name` | Represents a user or entity via image, initials or icon fallback, with optional status. |
| **Badge** | `variant`=solid|soft|outline · `tone`=brand|neutral|success|warning|danger|info · `size`=sm|md · `shape`=rounded|pill | `children` `dot` `icon` `count` `max` | Compact status/label indicator. Non-interactive. |
| **Button** | `type`=A|B|C · `variant`=solid|outline|ghost|soft|link · `tone`=brand|neutral|success|warning|danger · `size`=sm|md|lg · `shape`=rounded|pill|square | `children` `loading` `disabled` `fullWidth` `iconStart` `iconEnd` | Primary interactive control. Fully token-driven across five visual types and six tones, with loading and icon affordances. |
| **Checkbox** | `size`=sm|md|lg · `tone`=brand|success|danger | `children` `description` `checked` `indeterminate` `disabled` `invalid` | Binary (and indeterminate) selection control with an optional label. |
| **Chip** | `variant`=soft|outline|solid · `tone`=brand|neutral|success|warning|danger|info · `size`=sm|md | `children` `selected` `removable` `disabled` `icon` | Interactive, selectable/removable token for filters and multi-select input. |
| **Divider** | `orientation`=horizontal|vertical · `variant`=solid|dashed · `tone`=subtle|default|strong | `label` `labelPosition` | Visual or semantic separator between content, with an optional inline label. |
| **Icon** | `name`=135 options · `size`=xs|sm|md|lg|xl · `mode`=stroke|filled | `strokeWidth` `color` `spin` `title` | Reusable SVG icon system rendered on a 24×24 grid with `currentColor`. Supports size, color, stroke width and filled/stroke modes. |
| **IconButton** | `variant`=solid|outline|ghost|soft · `tone`=brand|neutral|success|warning|danger · `size`=sm|md|lg · `shape`=rounded|pill|square | `label` `icon` `loading` `pressed` `indicator` `disabled` | Square, icon-only action. Requires an accessible label. |
| **Image** | `fit`=cover|contain|fill · `radius`=none|sm|md|lg|full · `ratio`=auto|square|4:3|16:9|3:2 | `src` `alt` `caption` | Responsive image with aspect-ratio, object-fit, loading skeleton and error fallback. |
| **Input** | `variant`=outline|filled|underline · `size`=sm|md|lg | `placeholder` `value` `status` `disabled` `readOnly` `clearable` `revealable` `loading` `statusIcon` `iconStart` `iconEnd` | Single-line text field with three visual types, adornment slots and the full validation-state matrix. |
| **Label** | `size`=sm|md|lg | `children` `required` `optional` `hint` `disabled` `htmlFor` | Form field label with required/optional and disabled affordances. |
| **Link** | `tone`=brand|neutral|danger · `underline`=hover|always|none · `size`=sm|md|lg | `children` `href` `external` `leadingIcon` `trailingIcon` `disabled` | Navigational text link with tone and underline options; supports external affordance. |
| **Progress** | `tone`=brand|success|warning|danger · `size`=sm|md|lg · `shape`=pill|square | `value` `max` `variant` `indeterminate` `showValue` `label` | Linear progress indicator supporting determinate and indeterminate modes. |
| **Radio** | `size`=sm|md|lg · `tone`=brand|success|danger | `children` `description` `checked` `disabled` `invalid` | Single-choice selection control, grouped by shared `name`. |
| **Skeleton** | `shape`=text|circle|rect|rounded · `animation`=shimmer|pulse|none | `width` `height` `lines` | Loading placeholder that mimics the shape of content while it loads. Text, circle and rectangle shapes with an optional shimmer animation. |
| **Slider** | `size`=sm|md|lg · `tone`=brand|neutral|success|warning|danger | `min` `max` `step` `value` `showValue` `disabled` | Single-value range slider built on a native <input type="range"> for full keyboard and accessibility support, styled across sizes and tones with a live value readout. |
| **SocialLoginButton** | `provider`=kakao|naver|apple|google|facebook|email · `size`=sm|md|lg · `shape`=rounded|pill|square | `label` `fullWidth` `iconOnly` `loading` `disabled` | OAuth continue-with button. One brand-locked variant per provider (Kakao, Naver, Apple, Google, Facebook, email) — each carries its official palette and logo mark. Supports a full-width label form and a compact circular icon-only form. |
| **Sparkline** | `type`=A|B · `color`=1|2|3|4|5|6 | `width` `height` `endDot` | Compact, axis-less trend chart sized to sit inline with text or in a stat tile. Token-driven SVG. Type A: line (with optional emphasized endpoint) · Type B: bars. |
| **Spinner** | `size`=xs|sm|md|lg|xl · `tone`=brand|neutral|success|warning|danger | `label` `labelPlacement` | Indeterminate loading indicator driven by Motion tokens. |
| **Switch** | `size`=sm|md|lg · `tone`=brand|success|danger · `labelPosition`=end|start | `children` `checked` `showIcons` `invalid` `disabled` | On/off toggle for immediate settings changes. |
| **Tag** | `variant`=soft|outline|solid · `tone`=brand|neutral|success|warning|danger|info · `size`=sm|md · `shape`=rounded|pill | `children` `icon` `closable` `disabled` | Static, optionally-dismissable keyword label for categorisation. |
| **Text** | `variant`=11 options · `tone`=default|muted|subtle|brand|success|warning|danger|inverse · `align`=start|center|end | `children` `truncate` `as` | Typography primitive. Every visual style maps to a Text Style token, so React text and Figma Text Styles stay in lockstep. |
| **Textarea** | `variant`=outline|filled · `size`=sm|md|lg · `resize`=none|vertical|both | `placeholder` `rows` `status` `showCount` `autoResize` `disabled` `readOnly` | Multi-line text field sharing the Input visual language and state matrix. |
| **Tooltip** | `placement`=top|right|bottom|left · `tone`=inverse|default | `content` `delay` `closeDelay` `children` | Contextual label revealed on hover/focus of a trigger, with a Motion-token entrance. |

## Molecules (27)

| Component | Variants | Props | What it is |
| --- | --- | --- | --- |
| **Accordion** | `type`=A|B · `variant`=separated|contained|ghost · `size`=sm|md|lg · `mode`=single|multiple | `defaultValue` | Compound disclosure list (Accordion, Accordion.Item, Accordion.Trigger, Accordion.Content) with single/multiple modes and animated expansion. |
| **Autocomplete** | `variant`=outline|filled · `size`=sm|md|lg | `placeholder` `value` `loading` `emptyText` `minChars` `disabled` | Free-text field with live suggestions. Unlike Combobox the typed value is preserved even without a selection — suitable for search boxes and async lookups (loading state included). |
| **BarChart** | `type`=A|B · `color`=1|2|3|4|5|6 | `height` `showValues` | Categorical magnitude chart. Token-driven SVG bars anchored to the baseline with direct value labels (relief for the palette’s low-contrast hues). Type A: vertical columns · Type B: horizontal bars. |
| **Breadcrumb** | `size`=sm|md · `separator`=chevron|slash|dot | `items` `maxItems` | Hierarchical navigation trail with configurable separators and overflow collapsing. |
| **Card** | `type`=A|B|C · `variant`=elevated|outlined|filled · `padding`=none|sm|md|lg · `radius`=md|lg|xl | `interactive` `selected` | Surface container with a compound API (Card, Card.Header, Card.Body, Card.Footer, Card.Media). Card.Header covers the standalone header pattern. |
| **Combobox** | `variant`=outline|filled · `size`=sm|md|lg | `placeholder` `value` `emptyText` `clearable` `disabled` | Single-select with type-to-filter. Composes the Input field with a filtered listbox popup and full keyboard navigation (ARIA combobox pattern). |
| **DatePicker** | `variant`=outline|filled · `size`=sm|md|lg | `placeholder` `value` `min` `max` `disabled` | Single-date field with a calendar popup. Composes the Input with a month grid — pick by click or type an ISO date (YYYY-MM-DD). Min/max bounds disable out-of-range days. |
| **DonutChart** | `type`=A|B | `total` `showLegend` | Part-to-whole chart. Token-driven SVG segments with a 2px surface gap between slices, a legend carrying direct value/percent labels, and an optional center total. Type A: donut · Type B: pie. |
| **Dropdown** | `placement`=bottom-start|bottom-end|top-start|top-end · `size`=sm|md | `trigger` `items` | Menu surface anchored to a trigger, with keyboard navigation and outside-click dismissal. |
| **EmptyState** | `size`=sm|md|lg · `align`=center|start · `tone`=neutral|brand|danger | `title` `description` `icon` `action` `secondaryAction` | Placeholder shown when there is no data, no results or an error — an icon, a title, a supporting message and an optional primary action. |
| **FileUpload** | `type`=A|B · `size`=sm|md|lg · `tone`=neutral|brand | `multiple` `accept` `hint` `disabled` | Drag-and-drop file input with click-to-browse, accept/size/count validation and a removable file list. Single or multiple files. |
| **FormField** | `layout`=vertical|horizontal · `size`=sm|md|lg | `label` `hint` `error` `success` `required` `optional` `labelHint` `disabled` | Composes Label + control + hint/error text and wires the accessibility relationships (id, aria-describedby, aria-invalid). |
| **Gauge** | `type`=A|B · `color`=1|2|3|4|5|6 | `value` `min` `max` `label` `size` | Single-value radial gauge. A recessive track arc with a token-driven value arc filled to the value ratio, plus a large tabular value read-out and label. Type A: 180° semicircle · Type B: 270° arc. |
| **Heatmap** | `type`=A|B | `ariaLabel` | Matrix magnitude chart. A single-hue sequential ramp encodes each cell value (light = low → dark = high) over `var(--chart-1)`, with row/column labels, a hover tooltip and a low→high scale legend. Type A: square cells · Type B: value labels shown in cells. |
| **ImageUpload** | `type`=A|B · `size`=sm|md|lg · `shape`=rounded|square|circle | `multiple` `accept` `hint` `disabled` | Image-specific uploader: drag-and-drop or browse, with a thumbnail preview grid and per-image remove. Defaults to accepting images and rendering object-URL previews. |
| **LineChart** | `type`=A|B | `height` `showDots` | Change-over-time chart. Token-driven SVG with one axis, recessive gridlines, a legend for multiple series and direct end-labels. Type A: lines · Type B: filled area. |
| **ListItem** | `type`=A|B · `variant`=default|interactive · `size`=sm|md|lg | `title` `description` `leading` `trailing` `selected` `withChevron` `dragHandle` `disabled` | Row with leading media, title/description text and trailing content; optionally interactive/selectable. |
| **Menu** | `placement`=bottom-start|bottom-end|top-start|top-end · `size`=sm|md | `trigger` | Composable action menu: a trigger plus freely-arranged MenuItem / MenuLabel / MenuSeparator children, with roving-focus keyboard navigation, icons and shortcut hints. Use over Dropdown when items need grouping, labels or custom content. |
| **Pagination** | `variant`=outline|ghost · `size`=sm|md|lg · `shape`=rounded|pill | `page` `count` `siblingCount` `showEdges` | Page navigation with previous/next controls and truncated page ranges. |
| **Popover** | `side`=top|right|bottom|left · `align`=start|center|end · `size`=sm|md | `arrow` `title` `open` | Anchored overlay that floats arbitrary content next to a trigger. Positioned on a side × align grid with an optional arrow — the base primitive for Menu, Combobox, Autocomplete and DatePicker. |
| **RadarChart** | `type`=A|B | `size` | Multivariate comparison chart. Token-driven SVG polar grid with one axis per variable, recessive concentric gridlines and a legend for multiple series. Type A: filled polygons · Type B: line-only outlines. |
| **ScatterChart** | `type`=A|B | `height` `xLabel` `yLabel` | Correlation chart plotting (x, y) points on two numeric axes. Token-driven SVG with recessive gridlines, per-point hover tooltip and a legend for multiple series. Type A: points · Type B: points + linear (least-squares) trend line. |
| **SearchInput** | `variant`=outline|filled · `size`=sm|md|lg | `placeholder` `value` `loading` `clearable` `filterActive` `disabled` | Search field composing Input with a leading search icon, clear affordance and submit-on-Enter. |
| **Select** | `variant`=outline|filled · `size`=sm|md|lg | `placeholder` `value` `status` `iconStart` `statusIcon` `disabled` | Accessible single-select built on a native <select> styled to match the Input language. |
| **SocialLogin** | `type`=A|B · `size`=sm|md|lg · `shape`=rounded|pill|square | `dividerLabel` `showOthers` `disabled` | OAuth sign-in block. Two layout presets: Type A — full-width labelled buttons stacked with a divider and a secondary icon row; Type B — a compact centered grid of circular provider marks. |
| **Tabs** | `type`=A|B|C · `variant`=line|solid|pill · `size`=sm|md|lg · `align`=start|center|stretch | `value` `defaultValue` | Compound tabbed navigation (Tabs, Tabs.List, Tabs.Tab, Tabs.Panel) with roving-tabindex keyboard support. |
| **TextField** | `type`=A|B|C · `size`=sm|md|lg | `label` `inputType` `placeholder` `hint` `error` `success` `required` `optional` `labelHint` `disabled` `status` `clearable` `revealable` `loading` `iconStart` `iconEnd` | Label + Input composed into a ready-to-use field. Three purpose-built layouts: Type A (stacked label), Type B (floating label), Type C (inline label). Wires the accessibility relationships automatically. |

## Organisms (9)

| Component | Variants | Props | What it is |
| --- | --- | --- | --- |
| **Alert** | `type`=A|B|C · `variant`=subtle|solid|outline · `tone`=info|success|warning|danger|neutral | `title` `children` `showIcon` `closable` `action` | Contextual message with tone-driven icon, optional title, action and dismissal. Type A/B/C are layout presets: A — inline, B — full-width banner, C — prominent (left accent bar). |
| **Drawer** | `type`=A|B|C · `side`=right|left|top|bottom · `size`=sm|md|lg | `open` `title` `closable` `footer` | Edge-anchored panel (portal + focus trap) that slides in from any side. |
| **Footer** | `type`=A|B|C · `variant`=surface|transparent | `brand` `description` `columns` `newsletter` `social` `copyright` `legal` | Site footer. Type A/B/C are layout presets: A — multi-column links + bottom bar, B — simple centered brand + social, C — minimal single row. |
| **Header** | `type`=A|B|C · `variant`=surface|transparent|elevated · `size`=sm|md|lg · `sticky`=false|true | `brand` `search` `actions` `menuOpen` | Application top bar with brand, primary navigation and action slots. Type A/B/C are layout presets: A — standard (brand · nav · actions), B — centered brand with nav below, C — compact (nav hidden). |
| **Modal** | `type`=A|B|C · `size`=sm|md|lg|xl|full · `placement`=center|top | `open` `title` `children` `closable` `footer` | Accessible dialog rendered in a portal with focus trapping, scroll lock and scrim dismissal. |
| **Navbar** | `type`=A|B · `variant`=surface|transparent|elevated · `size`=sm|md|lg · `align`=start|center|end · `sticky`=false|true | `brand` `actions` `menuOpen` | Declarative navigation bar: pass a list of links and it renders them with active-state handling (aria-current), an alignment axis and a responsive collapse into a mobile panel. Slot-based Header is the alternative when you need a custom layout. |
| **Sidebar** | `type`=A|B|C · `variant`=surface|floating · `width`=narrow|default|wide · `collapsed`=false|true | `header` `footer` | Vertical navigation rail with a compound API (Sidebar, Sidebar.Section, Sidebar.Item) and a collapsed icon-only mode. |
| **Table** | `type`=A|B · `variant`=default|striped|bordered · `size`=sm|md|lg | `columns` `data` `stickyHeader` `selectable` `loading` `caption` | Data grid with column config, density, striping/bordering, sticky header, sortable columns, row selection and a loading state. |
| **Toast** | `type`=A|B · `tone`=neutral|info|success|warning|danger · `placement`=bottom-right|bottom-center|top-right|top-center | `title` `description` `duration` `closable` `action` | Transient notification managed by ToastProvider/useToast, with tone, action and auto-dismiss. |
