/**
 * Icon geometry extractor.
 *
 * Parses `src/components/atoms/Icon/icons.tsx` (the single source of truth for the icon
 * drawings) and returns, per icon name, the raw inner SVG markup — every self-closing shape
 * tag (`path`/`circle`/`rect`/`ellipse`/`line`/`polyline`/`polygon`) that belongs to that icon,
 * concatenated with the `<>`/`</>` React fragment wrappers stripped. The JSX shape attributes
 * (`d`, `cx`, `cy`, `r`, `rx`, `ry`, `x`, `y`, `width`, `height`, …) are already valid SVG and are
 * kept verbatim, so a Figma plugin can wrap the markup in an `<svg>` and call
 * `figma.createNodeFromSvg` to draw the real glyph.
 *
 * Extraction is deterministic (icons are emitted in file order) and never throws: a name with no
 * extractable markup is skipped with a warning.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** A self-closing SVG shape tag, or a `<g>`/`</g>` group wrapper (e.g. a `transform="scale(…)"`
 *  used to fit off-grid brand art into the 24 viewBox). Matched in document order and joined, so a
 *  wrapped group reconstructs faithfully as `<g …><path/>…</g>`. */
const SHAPE_TAG = /<\/?g\b[^>]*>|<(?:path|circle|rect|ellipse|line|polyline|polygon)\b[^>]*\/>/g;

/**
 * A top-level object key inside `export const icons = { … }`. Icon entries are indented exactly
 * two spaces; shape lines inside fragments are indented deeper and comments start with `//`, so
 * neither collides with this pattern.
 */
const ENTRY_KEY = /^ {2}(?:'([\w-]+)'|([\w-]+)):/gm;

export function extractIcons(root: string): Record<string, string> {
  const src = readFileSync(
    resolve(root, 'src/components/atoms/Icon/icons.tsx'),
    'utf8',
  );

  // Isolate the `export const icons = { … }` object body so imports/other exports can't match.
  const start = src.indexOf('export const icons');
  const body = start >= 0 ? src.slice(start) : src;

  // Collect every icon key with its position, then the value of key i is the text between key i
  // and key i+1 (or end of body for the last key).
  const keys: Array<{ name: string; index: number }> = [];
  ENTRY_KEY.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_KEY.exec(body)) !== null) {
    keys.push({ name: m[1] ?? m[2], index: m.index });
  }

  const icons: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) {
    const segment = body.slice(keys[i].index, i + 1 < keys.length ? keys[i + 1].index : body.length);
    const shapes = segment.match(SHAPE_TAG) ?? [];
    const markup = shapes.join('');
    if (markup) icons[keys[i].name] = markup;
    else console.warn(`⚠ icon "${keys[i].name}": no extractable SVG markup — skipped`);
  }

  return icons;
}
