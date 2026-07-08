/* eslint-disable @typescript-eslint/no-explicit-any */
// Headless verification for the plugin generator.
// Figma has no CLI, so we mock just enough of the Figma API, run the real plugin code
// against the real contract (figma/tds.plugin.json), and assert coverage:
// collections, variables, resolved aliases, styles, component sets, variants, and the
// TEXT/BOOLEAN/INSTANCE_SWAP -> layer property wiring. Exits non-zero on any mismatch.

import bundle from '../../tds.plugin.json';
import { PAGE_TITLES } from '../src/pages';

const b = bundle as any;

const stats = {
  collections: 0,
  variables: 0,
  aliasValues: 0,
  effectStyles: 0,
  textStyles: 0,
  sets: 0,
  components: 0,
  instances: 0,
  sections: 0,
  frames: 0,
  createdPages: 0,
  props: { TEXT: 0, BOOLEAN: 0, INSTANCE_SWAP: 0 } as Record<string, number>,
  refs: { characters: 0, visible: 0, mainComponent: 0 } as Record<string, number>,
  boundPaints: 0, // per-variant fills/strokes bound to a token Variable (visual fidelity)
  boundFontSize: 0, // per-variant label font-size bound to a token Variable
  boundVars: 0, // total setBoundVariable calls (padding/gap/radius/height/… → token)
  boundPadding: 0, // padding fields bound to a spacing token
  boundGap: 0, // itemSpacing bound to a spacing token
  boundRadius: 0, // corner radii bound to a radius token
  effectsApplied: 0, // effect-style (shadow) applications
};
const warnings: string[] = [];
const createdSets: any[] = [];
const createdSections: any[] = [];
const createdFrames: any[] = [];
// Which main component each INSTANCE_SWAP slot instance was created from (→ the Icon primitive).
const instanceSources = new Map<any, number>();
let doneLabel = '';
let foundationCards = 0;

let seq = 0;
const uid = (p: string) => `${p}:${seq++}`;

function defineRefs(n: any): void {
  let refs: any = null;
  Object.defineProperty(n, 'componentPropertyReferences', {
    get: () => refs,
    set: (v: any) => {
      refs = v;
      if (v) for (const k of Object.keys(v)) stats.refs[k] = (stats.refs[k] || 0) + 1;
    },
  });
}

// Enforce Figma's real runtime constraint: `layoutPositioning = 'ABSOLUTE'` is only legal
// when the node already has a parent whose layoutMode is an Auto Layout mode (!== 'NONE').
// A plain frame's layoutMode is undefined, which counts as NONE. Real Figma throws this exact
// error at runtime, but the previous mock silently accepted it — masking the crash. Making it
// throw here means a mispositioned absolute child fails the headless build instead of Figma.
function defineLayoutPositioning(n: any): void {
  let lp = 'AUTO';
  Object.defineProperty(n, 'layoutPositioning', {
    get: () => lp,
    set: (v: any) => {
      if (v === 'ABSOLUTE') {
        const parent = n.parent;
        const parentMode = parent && parent.layoutMode;
        if (!parent || parentMode === undefined || parentMode === 'NONE') {
          throw new Error(
            'in set_layoutPositioning: Can only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE',
          );
        }
      }
      lp = v;
    },
  });
}

function makeNode(kind: string): any {
  const n: any = {
    kind,
    id: uid(kind),
    key: kind === 'COMPONENT' ? 'mockkey0000000000000000000000000000000000' : undefined,
    name: '',
    description: '',
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    visible: true,
    fills: [] as any[],
    strokes: [] as any[],
    strokeWeight: 1,
    // Auto Layout + styling state the strengthened checks read back after the build.
    layoutMode: 'NONE',
    itemSpacing: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    opacity: 1,
    effectStyleId: '',
    boundFields: [] as string[],
    _props: [] as Array<{ name: string; type: string }>,
    children: [] as any[],
    resize(w: number, h: number) {
      this.width = w;
      this.height = h;
    },
    resizeWithoutConstraints(w: number, h: number) {
      this.width = w;
      this.height = h;
    },
    appendChild(c: any) {
      this.children.push(c);
      c.parent = this;
    },
    insertChild(i: number, c: any) {
      this.children.splice(i, 0, c);
      c.parent = this;
    },
    setBoundVariable(field: string, _v: any) {
      this.boundFields.push(field);
      stats.boundVars++;
      if (field === 'fontSize') stats.boundFontSize++;
      if (field === 'itemSpacing') stats.boundGap++;
      if (/padding/i.test(field)) stats.boundPadding++;
      if (/Radius$/.test(field)) stats.boundRadius++;
    },
    setEffectStyleIdAsync(id: string) {
      this.effectStyleId = id;
      stats.effectsApplied++;
      return Promise.resolve();
    },
    createInstance() {
      stats.instances++;
      const inst = makeNode('INSTANCE');
      inst._source = this;
      instanceSources.set(this, (instanceSources.get(this) || 0) + 1);
      return inst;
    },
    addComponentProperty(name: string, type: string, _def: any, _opts?: any) {
      stats.props[type] = (stats.props[type] || 0) + 1;
      this._props.push({ name, type });
      return `${name}#${uid('p')}`;
    },
  };
  defineRefs(n);
  defineLayoutPositioning(n);
  // Stamp the page a node is created on, so combineAsVariants can enforce that every
  // grouped node shares its parent's page (guards the page-switch ordering).
  n.pageId = (globalThis as any).figma?.currentPage?.id;
  return n;
}

const figma: any = {
  variables: {
    createVariableCollection(name: string) {
      stats.collections++;
      const modes = [{ modeId: uid('mode'), name: 'Mode 1' }];
      return {
        name,
        modes,
        renameMode(id: string, nm: string) {
          const m = modes.find((x) => x.modeId === id);
          if (m) m.name = nm;
        },
        addMode(nm: string) {
          const id = uid('mode');
          modes.push({ modeId: id, name: nm });
          return id;
        },
      };
    },
    createVariable(name: string, _coll: any, type: string) {
      stats.variables++;
      const values: Record<string, any> = {};
      return {
        id: uid('var'),
        name,
        resolvedType: type,
        scopes: [] as string[],
        description: '',
        setValueForMode(mode: string, val: any) {
          values[mode] = val;
          if (val && val.type === 'VARIABLE_ALIAS') stats.aliasValues++;
        },
      };
    },
    setBoundVariableForPaint(paint: any, field: string, variable: any) {
      stats.boundPaints++;
      return { ...paint, boundVariables: { [field]: { type: 'VARIABLE_ALIAS', id: variable.id } } };
    },
  },
  createComponent() {
    stats.components++;
    return makeNode('COMPONENT');
  },
  createText() {
    const t = makeNode('TEXT');
    t.fontName = null;
    t.characters = '';
    t.fontSize = 12;
    return t;
  },
  createEllipse() {
    return makeNode('ELLIPSE');
  },
  createVector() {
    // Tolerant no-op: chart recipes build polylines/areas/trend lines as vectors. The mock
    // only needs a node that accepts appendChild + property writes (vectorPaths/strokes/…).
    return makeNode('VECTOR');
  },
  createNodeFromSvg(_svg: string) {
    // Real Figma parses the SVG into a FrameNode with vector children. The mock returns a
    // FrameNode-like node holding one VectorNode child (type='VECTOR' so renderIcon's traversal
    // finds and recolors it) plus a `rescale` that scales the subtree — enough for the real
    // renderIcon to run and for coverage assertions (children/resize/vector) to hold.
    const frame = makeNode('FRAME');
    frame.width = 24;
    frame.height = 24;
    frame.rescale = function (s: number) {
      this.width *= s;
      this.height *= s;
      for (const c of this.children) {
        c.width *= s;
        c.height *= s;
      }
    };
    const vec = makeNode('VECTOR');
    vec.type = 'VECTOR';
    vec.width = 24;
    vec.height = 24;
    frame.appendChild(vec);
    return frame;
  },
  createFrame() {
    stats.frames++;
    const fr = makeNode('FRAME');
    createdFrames.push(fr);
    return fr;
  },
  createSection() {
    stats.sections++;
    const s = makeNode('SECTION');
    createdSections.push(s);
    return s;
  },
  createPage() {
    stats.createdPages++;
    return makeNode('PAGE');
  },
  createEffectStyle() {
    stats.effectStyles++;
    return { id: uid('eff'), name: '', description: '', effects: [] as any[] };
  },
  createTextStyle() {
    stats.textStyles++;
    return {
      id: uid('txt'),
      name: '',
      description: '',
      fontName: null,
      fontSize: 0,
      lineHeight: null,
      letterSpacing: null,
    };
  },
  combineAsVariants(nodes: any[], parent: any) {
    // Mirror Figma's real constraint: grouped nodes must share the parent's page.
    if (parent && parent.pageId !== undefined) {
      for (const nd of nodes) {
        if (nd.pageId !== parent.pageId) {
          throw new Error(
            'combineAsVariants: Grouped nodes must be in the same page as the parent',
          );
        }
      }
    }
    stats.sets++;
    const s = makeNode('SET');
    s.children = [...nodes];
    if (parent && parent.appendChild) parent.appendChild(s);
    createdSets.push(s);
    return s;
  },
  loadFontAsync() {
    return Promise.resolve();
  },
  clientStorage: {
    getAsync() {
      return Promise.resolve(undefined);
    },
  },
  currentPage: makeNode('PAGE'),
  setCurrentPageAsync(page: any) {
    figma.currentPage = page;
    return Promise.resolve();
  },
  notify() {},
  closePlugin() {},
  showUI() {},
  ui: {
    onmessage: null as any,
    postMessage(m: any) {
      if (m.type === 'log' && m.level === 'warn') warnings.push(m.text);
      if (m.type === 'done') doneLabel = m.label;
      if (m.type === 'foundation-cards') foundationCards = m.count;
    },
  },
};

(globalThis as any).figma = figma;
(globalThis as any).__html__ = '<ui/>';

async function main(): Promise<void> {
  await import('../src/code.ts'); // registers figma.showUI + figma.ui.onmessage
  await figma.ui.onmessage({ type: 'run' });

  // Expected values derived from the real contract.
  const cols = b.tokens.collections;
  const expVars = cols.reduce((a: number, c: any) => a + c.variables.length, 0);
  const expAlias = cols.reduce(
    (a: number, c: any) =>
      a +
      c.variables.reduce(
        (aa: number, v: any) =>
          aa +
          Object.values(v.valuesByMode).filter((mv: any) => mv.type === 'VARIABLE_ALIAS').length,
        0,
      ),
    0,
  );
  const comps = b.design.components;
  const expVariants = comps.reduce((a: number, c: any) => a + c.figmaVariantCombinations, 0);

  // Plugin-side build transforms the harness must mirror when computing expectations:
  //  • SPLIT_BY: Icon/Text render ONE set per value of the split axis (per-px cards), so a split
  //    component contributes N sets and registers its props N times (once per card).
  //  • INTERACTIVE: Radio/Switch gain a synthetic On/Off `State` variant (checked → variant), which
  //    doubles their variant count and drops the `checked` BOOLEAN property.
  const SPLIT_BY: Record<string, string> = { icon: 'size', text: 'variant' };
  const INTERACTIVE = new Set(['radio', 'switch']);
  const splitAxisOf = (c: any) => c.variantAxes.find((a: any) => a.name === SPLIT_BY[c.slug]);
  const cardsFor = (c: any) => {
    const ax = splitAxisOf(c);
    return ax ? ax.options.length : 1;
  };
  const stateFactor = (c: any) => (INTERACTIVE.has(c.slug) ? 2 : 1);
  const compByNameAll = new Map<string, any>();
  for (const c of comps) compByNameAll.set(c.name, c);
  const baseName = (setName: string) => String(setName).split(' / ')[0];
  const compForSet = (s: any) => compByNameAll.get(baseName(s.name));

  // Expected number of Component Sets: split components fan out to one set per split-axis option.
  const expSets = comps.reduce((a: number, c: any) => a + cardsFor(c), 0);
  // Expected variant components built: split preserves the total (Σ over cards = full cartesian);
  // interactive doubles via the synthetic State axis.
  const expVariantsBuilt = comps.reduce(
    (a: number, c: any) => a + c.figmaVariantCombinations * stateFactor(c),
    0,
  );
  // A property is registered once per card; interactive components drop the `checked` BOOLEAN
  // (it is promoted to the synthetic State variant).
  const countProp = (t: string) =>
    comps.reduce((a: number, c: any) => {
      let n = (c.figmaProperties || []).filter((p: any) => p.figmaPropertyType === t).length;
      if (t === 'BOOLEAN' && INTERACTIVE.has(c.slug)) {
        n -= (c.figmaProperties || []).filter(
          (p: any) => p.figmaPropertyType === 'BOOLEAN' && p.propName === 'checked',
        ).length;
      }
      return a + n * cardsFor(c);
    }, 0);

  // Each set's first variant must be the all-defaults combination (contract defaults). Sets are
  // built grouped by page, so match by name. Iterate the ACTUAL sets so split cards (one per px)
  // and interactive sets (with the synthetic On/Off `State` axis) are each verified.
  const setByName = new Map<string, any>();
  for (const s of createdSets) setByName.set(s.name, s);
  const displayNameFor = (c: any, axis: any) => {
    const fp = (c.figmaProperties || []).find(
      (p: any) => p.figmaPropertyType === 'VARIANT' && p.propName === axis.name,
    );
    return (fp && fp.name) || axis.label || axis.name;
  };
  let defaultFirstOk = 0;
  for (const set of createdSets) {
    const c = compForSet(set);
    if (!c || !set.children[0]) continue;
    const splitAxis = splitAxisOf(c);
    // The axes that name this set's variants: split axis excluded (fixed per card); interactive
    // adds the synthetic State axis (default 'Off') at the end — mirrors buildCardSet's nameAxes.
    let axes = c.variantAxes.filter((a: any) => !splitAxis || a.name !== splitAxis.name);
    if (INTERACTIVE.has(c.slug)) {
      axes = [...axes, { name: 'State', label: 'State', default: 'Off' }];
    }
    const expected = axes
      .map((a: any) => `${displayNameFor(c, a)}=${a.default}`)
      .join(', ');
    if (set.children[0].name === expected) defaultFirstOk++;
  }

  // Every set description must carry the contract docs (Accessibility spec included).
  const describedOk = createdSets.filter(
    (s) => typeof s.description === 'string' && s.description.includes('Accessibility'),
  ).length;

  // ---- Strengthened Storybook→Figma fidelity checks -------------------------------------
  const compByName = new Map<string, any>();
  for (const c of comps) compByName.set(c.name, c);

  const isAL = (n: any) => n.layoutMode === 'HORIZONTAL' || n.layoutMode === 'VERTICAL';

  // Graphic/canvas primitives (a single icon glyph, SVG charts, gauges, bars, the progress
  // track, the divider rule) and overlay backdrops (modal/drawer scrims — whose inner panel IS
  // auto-layout) are faithfully FIXED-layout at the root: auto-layout is neither how they render
  // in Storybook nor meaningful for a lone glyph or a plotted canvas. Every OTHER (structural /
  // composed) component MUST be Auto Layout so it resizes with its content, like Storybook.
  const FIXED_ROOT_SLUGS = new Set([
    'icon', 'spinner', 'progress', 'slider', 'skeleton', 'divider',
    'sparkline', 'bar-chart', 'line-chart', 'donut-chart', 'radar-chart',
    'gauge', 'scatter-chart', 'heatmap', 'modal', 'drawer',
  ]);

  const subtreeBoundPaints = (n: any): number => {
    let c = 0;
    for (const p of [...(n.fills || []), ...(n.strokes || [])]) if (p && p.boundVariables) c++;
    for (const ch of n.children || []) c += subtreeBoundPaints(ch);
    return c;
  };
  // A variant "renders" if anything in its subtree paints (token-bound or literal-brand), types
  // text, or places a graphic/instance child — i.e. it is not an empty fallback box.
  const isRendered = (n: any): boolean => {
    if ([...(n.fills || []), ...(n.strokes || [])].some((p: any) => p && p.type === 'SOLID')) return true;
    if (n.kind === 'TEXT' && typeof n.characters === 'string' && n.characters.length > 0) return true;
    if (n.kind === 'INSTANCE' || n.kind === 'ELLIPSE' || n.kind === 'VECTOR') return true;
    return (n.children || []).some(isRendered);
  };

  // (1) Auto Layout — every Component Set frame, plus every structural variant root.
  const setsAutoLayout = createdSets.filter(isAL).length;
  const variantRoots: any[] = [];
  let structuralRoots = 0;
  let structuralAL = 0;
  for (const s of createdSets) {
    const slug = compForSet(s)?.slug; // split sets are "Name / Axis=opt" — resolve the base comp
    for (const ch of s.children) {
      if (ch.kind !== 'COMPONENT') continue;
      variantRoots.push(ch);
      if (!FIXED_ROOT_SLUGS.has(slug)) {
        structuralRoots++;
        if (isAL(ch)) structuralAL++;
      }
    }
  }
  const graphicRoots = variantRoots.length - structuralRoots;

  // (2) A/B/C Type split: each "X Type - …" set must expose a Type variant pinned to its letter.
  const typeSets = createdSets.filter((s) => /^[ABC] Type - /.test(s.name));
  const typeVariantOk = typeSets.filter(
    (s) => s.children[0] && String(s.children[0].name).includes(`Type=${s.name[0]}`),
  ).length;

  // (3) Component properties: every set must register exactly its contract's non-variant
  // properties (text / boolean / instance-swap) — the "컴포넌트 속성 만들기" surface.
  let propsComplete = 0;
  let swapSlotSets = 0; // sets that declare ≥1 instance-swap slot
  let swapSlotOk = 0;
  for (const s of createdSets) {
    const c = compForSet(s); // resolve base comp for split sets ("Name / Axis=opt")
    if (!c) continue;
    let nonVariant = (c.figmaProperties || []).filter((p: any) => p.figmaPropertyType !== 'VARIANT');
    // Interactive Radio/Switch drop the `checked` BOOLEAN (promoted to the synthetic State variant).
    if (INTERACTIVE.has(c.slug)) {
      nonVariant = nonVariant.filter((p: any) => p.propName !== 'checked');
    }
    if (s._props.length === nonVariant.length) propsComplete++;
    const swaps = nonVariant.filter((p: any) => p.figmaPropertyType === 'INSTANCE_SWAP');
    if (swaps.length) {
      swapSlotSets++;
      if (s._props.filter((p: any) => p.type === 'INSTANCE_SWAP').length === swaps.length) swapSlotOk++;
    }
  }

  // (4) Composition description: Dev Mode must show the variant/property spec, not just a blurb.
  const composedOk = createdSets.filter(
    (s) =>
      typeof s.description === 'string' &&
      s.description.includes('Composition') &&
      s.description.includes('Variants:'),
  ).length;

  // (5) CSS 1:1 styling: no variant may be an empty box (every variant renders content), and the
  // token pipeline must be broadly applied (≥90% of variants carry a Variable-bound paint; the
  // rest are intentionally chromeless icon-only or literal official-brand fills).
  const renderedVariants = variantRoots.filter(isRendered).length;
  const tokenStyledVariants = variantRoots.filter((v) => subtreeBoundPaints(v) > 0).length;
  const tokenStyledFloor = Math.floor(variantRoots.length * 0.9);

  // (6) Icon slots: every INSTANCE_SWAP slot instantiates ONE shared, token-colored Icon
  // primitive (the Storybook Icon), so buttons/dropdowns/links/fields carry a real, swappable
  // icon — never a grey placeholder box.
  const iconSources = [...instanceSources.keys()];
  const iconMain = iconSources.length === 1 ? iconSources[0] : null;
  const iconMainOk =
    iconMain &&
    iconMain.kind === 'COMPONENT' &&
    iconMain.name === 'Icon' &&
    subtreeBoundPaints(iconMain) > 0
      ? 1
      : 0;

  // (7) Chart series palette: chart/1..6 must exist as Theme COLOR Variables AND be theme-aware
  // (distinct light/dark values), so chart series recolor in dark mode instead of a frozen hue.
  const themeCol = (b.tokens.collections as any[]).find((c) => c.name === 'Theme');
  const chartVars = ((themeCol && themeCol.variables) || []).filter((v: any) =>
    /^chart\/[1-6]$/.test(v.name),
  );
  const chartThemeAware = chartVars.filter((v: any) => {
    const l = v.valuesByMode.light;
    const d = v.valuesByMode.dark;
    return l && d && JSON.stringify(l.value ?? l) !== JSON.stringify(d.value ?? d);
  }).length;

  // (8) Real icon geometry: the Icon set's variants now draw a parsed SVG vector glyph (not a
  // bare ellipse), proving design.icons flows through renderIcon into every Icon variant.
  const hasVector = (n: any): boolean =>
    n.kind === 'VECTOR' || (n.children || []).some(hasVector);
  // Icon is now split into one set per size ("Icon / Size=…"); gather variants across all of them.
  const iconSets = createdSets.filter((s) => compForSet(s)?.slug === 'icon');
  const iconVariants = iconSets.flatMap((s: any) =>
    s.children.filter((v: any) => v.kind === 'COMPONENT'),
  );
  const iconVariantsWithVector = iconVariants.filter(hasVector).length;

  const checks: Array<[string, number, number]> = [
    ['collections', stats.collections, cols.length],
    ['variables', stats.variables, expVars],
    ['alias values resolved', stats.aliasValues, expAlias],
    ['effect styles', stats.effectStyles, b.tokens.effectStyles.length],
    ['text styles', stats.textStyles, b.tokens.textStyles.length],
    ['component sets', stats.sets, expSets],
    ['variant components', stats.components, expVariantsBuilt + 1 /* +1 placeholder */],
    ['pages (Foundation reused + 7 created)', 1 + stats.createdPages, PAGE_TITLES.length],
    // Cover is a doc CARD (auto-layout frame named 'Cover') on the Foundation page, not a Section.
    ['cover card present', createdFrames.filter((f) => f.name === 'Cover').length, 1],
    ['foundation token cards', foundationCards, 6],
    ['TEXT props', stats.props.TEXT, countProp('TEXT')],
    ['BOOLEAN props', stats.props.BOOLEAN, countProp('BOOLEAN')],
    ['INSTANCE_SWAP props', stats.props.INSTANCE_SWAP, countProp('INSTANCE_SWAP')],
    ['default variant first', defaultFirstOk, createdSets.length],
    ['descriptions with a11y', describedOk, createdSets.length],
    // Visual fidelity: CSS-derived bindings must actually paint variants. A floor of
    // variants/10 proves styling is broadly applied (regression guard for empty boxes).
    [
      'bound paints ≥ variants/10 (styling applied)',
      stats.boundPaints >= Math.floor(expVariants / 10)
        ? Math.floor(expVariants / 10)
        : stats.boundPaints,
      Math.floor(expVariants / 10),
    ],
    ['label font-size bound to token (>0)', stats.boundFontSize > 0 ? 1 : 0, 1],

    // ---- Storybook→Figma fidelity ----
    ['component sets are Auto Layout', setsAutoLayout, createdSets.length],
    ['structural variant roots are Auto Layout', structuralAL, structuralRoots],
    ['A/B/C Type split produced sets (>0)', typeSets.length > 0 ? 1 : 0, 1],
    ['A/B/C Type sets pin their Type variant', typeVariantOk, typeSets.length],
    ['every set registers its contract properties', propsComplete, createdSets.length],
    ['instance-swap slots wired on every slot set', swapSlotOk, swapSlotSets],
    ['descriptions carry the Composition spec', composedOk, createdSets.length],
    ['no empty variant (every variant renders content)', renderedVariants, variantRoots.length],
    [
      'token-styled variants ≥ 90% (CSS→token 1:1)',
      tokenStyledVariants >= tokenStyledFloor ? tokenStyledFloor : tokenStyledVariants,
      tokenStyledFloor,
    ],
    ['padding bound to spacing tokens (>0)', stats.boundPadding > 0 ? 1 : 0, 1],
    ['item-spacing bound to spacing tokens (>0)', stats.boundGap > 0 ? 1 : 0, 1],
    ['corner radii bound to radius tokens (>0)', stats.boundRadius > 0 ? 1 : 0, 1],
    ['shadow effect styles applied (>0)', stats.effectsApplied > 0 ? 1 : 0, 1],
    ['icon slots share one swap source', instanceSources.size, 1],
    ['swap source is the token-colored Icon primitive', iconMainOk, 1],
    ['icon slot instances created (>0)', stats.instances > 0 ? 1 : 0, 1],
    ['chart series palette present (chart/1..6)', chartVars.length, 6],
    ['chart palette is theme-aware (light≠dark ≥4)', chartThemeAware >= 4 ? 4 : chartThemeAware, 4],
    ['Icon variants draw a real vector glyph', iconVariantsWithVector, iconVariants.length],
  ];

  let ok = true;
  console.log('\n=== Plugin generator — headless coverage ===');
  for (const [name, got, exp] of checks) {
    const pass = got === exp;
    ok = ok && pass;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}: ${got} / ${exp}`);
  }

  console.log('\n--- property -> layer wiring ---');
  console.log(`characters refs (TEXT):     ${stats.refs.characters}`);
  console.log(`visible refs (BOOLEAN):     ${stats.refs.visible}`);
  console.log(`mainComponent refs (SWAP):  ${stats.refs.mainComponent}`);
  console.log(`instance slots created:     ${stats.instances}`);

  console.log('\n--- Storybook→Figma fidelity ---');
  console.log(`auto-layout sets:           ${setsAutoLayout}/${createdSets.length}`);
  console.log(
    `structural roots AL:        ${structuralAL}/${structuralRoots} (+${graphicRoots} fixed graphic/overlay roots)`,
  );
  console.log(`A/B/C Type sets:            ${typeSets.length}`);
  console.log(`token-styled variants:      ${tokenStyledVariants}/${variantRoots.length}`);
  console.log(
    `bound dims:                 pad ${stats.boundPadding} · gap ${stats.boundGap} · radius ${stats.boundRadius} · shadow ${stats.effectsApplied}`,
  );
  console.log(
    `icon swap source:           ${iconMain ? iconMain.name : '(none)'} × ${instanceSources.size} · ${stats.instances} slot instances`,
  );

  const unresolved = warnings.filter((w) => /Unresolved alias|unknown mode|not found/i.test(w));
  console.log(`\nblocking warnings: ${unresolved.length}`);
  for (const w of unresolved.slice(0, 10)) console.log('  ! ' + w);
  const otherWarnCount = warnings.length - unresolved.length;
  console.log(
    `other (expected) notes: ${otherWarnCount} (e.g. transition has no Figma equivalent)`,
  );
  console.log(`\ndone message: ${doneLabel}`);

  if (!ok || unresolved.length > 0) {
    console.error('\nHEADLESS VERIFICATION FAILED');
    process.exit(1);
  }
  console.log('\nHEADLESS VERIFICATION PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
