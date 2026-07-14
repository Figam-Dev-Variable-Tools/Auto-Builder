// 공유 파서 — src/ds TSX props를 네이밍 파리티 규약으로 분류한다. **코드가 단일 출처**다.
// 소비자: scripts/verify-naming.mjs (이름 규약), scripts/verify-mapping.mjs (커버리지),
//         scripts/build-story-manifest.mjs (Stage C 직렬화)
//
// 왜 정규식이 아니라 AST인가: 기존 파서는 `export type \w+Props = {` 한 줄 정규식이라
//   (1) `export type TableProps<T> = {` 같은 제네릭을 통째로 놓쳤고
//   (2) 매칭 안 되는 라인을 조용히 버렸다. "못 읽으면 통과"가 네이밍 드리프트를 숨긴 원인이므로,
//   분류 불가 항목은 버리지 않고 unparsed[]로 올려 호출자가 E-UNPARSED로 실패시킨다.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname, basename } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1

/**
 * 컴포넌트 인덱스 — Figma 세트명(DS/<X>)의 코드 짝을 찾기 위한 단일 조회표.
 * Kr* 는 src/ds/kr/<X>/ 아래, 템플릿은 src/templates/<X>/ 아래에 있으므로 세 뿌리를 훑는다.
 * @returns {Map<string, { name, dir, tsx, cssBase }>}
 */
export function indexComponents(root) {
  const index = new Map()
  const roots = [join(root, 'src', 'ds'), join(root, 'src', 'ds', 'kr'), join(root, 'src', 'templates')]
  for (const base of roots) {
    if (!existsSync(base)) continue
    for (const entry of readdirSync(base)) {
      const dir = join(base, entry)
      if (!statSync(dir).isDirectory() || index.has(entry)) continue
      // <X>.tsx가 정석이지만 Chart처럼 파일명이 다른 경우(DsChart.tsx)도 받는다.
      let tsx = existsSync(join(dir, `${entry}.tsx`)) ? `${entry}.tsx` : null
      if (!tsx) {
        const cands = readdirSync(dir).filter(
          (f) => f.endsWith('.tsx') && !f.includes('.stories.') && !f.includes('.test.'),
        )
        if (cands.length === 1) tsx = cands[0]
      }
      if (!tsx) {
        // 이 폴더에 구현이 없다 — 그런데 §0-2가 정한 단일 출처 프리미티브(Image·Video·EmptyState·
        // AdminTable·CrudDialog가 공유하는 Placeholder처럼)는 구현을 src/shared/*에 두고 여기엔
        // 갤러리 스토리만 둔다(그 이유가 Placeholder.stories.tsx 자체에 주석으로 남아 있다 —
        // §0-4대로 그 결정을 존중한다). "코드가 없다"고 단정하기 전에 그 스토리의 import를 따라가
        // 실제 구현 파일을 찾는다 — 못 찾으면 그때 index에서 빠져 N1(no-code)로 실패한다.
        const resolved = resolveSharedImpl(dir, entry)
        if (resolved) {
          index.set(entry, {
            name: entry,
            dir: dirname(resolved),
            tsx: resolved,
            cssBase: basename(resolved).replace(/\.tsx$/, ''),
          })
        }
        continue
      }
      index.set(entry, { name: entry, dir, tsx: join(dir, tsx), cssBase: tsx.replace(/\.tsx$/, '') })
    }
  }
  return index
}

/**
 * <X>.stories.tsx의 import 선언에서 컴포넌트 이름과 같은 named import를 relative 경로로 찾아
 * 실제 구현 파일(주로 src/shared/*)의 절대 경로를 되짚는다. 여러 후보(default export나 재선언)는
 * 다루지 않는다 — named import 하나로 정확히 잡히지 않으면 추측하지 않고 null을 반환한다.
 */
function resolveSharedImpl(dir, componentName) {
  const storyFile = join(dir, `${componentName}.stories.tsx`)
  if (!existsSync(storyFile)) return null
  const sf = ts.createSourceFile(storyFile, readFileSync(storyFile, 'utf8'), ts.ScriptTarget.ES2020, true)
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue
    const spec = stmt.moduleSpecifier.text
    if (!spec.startsWith('.')) continue
    const clause = stmt.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    const hit = clause.namedBindings.elements.some((el) => (el.propertyName ?? el.name).text === componentName)
    if (!hit) continue
    const target = resolvePath(dirname(storyFile), spec)
    if (target && target.endsWith('.tsx')) return target
  }
  return null
}

/**
 * TSX의 export type <X>Props 선언을 AST로 파싱해 props 목록을 반환한다.
 * kind: union | boolean | string | number | swap | children | list | object | callback | other
 */
export function parsePropsFile(root, component, file = component) {
  return parsePropsAt(join(root, 'src', 'ds', component, `${file}.tsx`), root)
}

/** 절대 경로의 TSX를 직접 파싱한다(인덱스가 찾아준 경로용). */
export function parsePropsAt(abs, root = '') {
  const component = abs.replace(/\\/g, '/').split('/').slice(-2)[0]
  const src = readFileSync(abs, 'utf8')
  const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.ES2020, true)

  let decl = null
  for (const stmt of sf.statements) {
    if (!ts.isTypeAliasDeclaration(stmt) || !/Props$/.test(stmt.name.text)) continue
    const exported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (exported && !decl) decl = stmt
  }
  const rel = root ? relative(root, abs).replace(/\\/g, '/') : abs
  // Props 타입이 없는 컴포넌트(템플릿 등)는 "prop이 없다"가 정답이다 — 에러가 아니다.
  if (!decl) return { props: [], src, unparsed: [], component, file: rel, noProps: true }

  const ctx = makeTypeResolver(sf, abs)
  const props = []
  const unparsed = []
  for (const m of collectMembers(decl.type)) {
    const line = lineOf(sf, m)
    const raw = m.getText(sf).slice(0, 80).replace(/\s+/g, ' ')
    if (!ts.isPropertySignature(m) || !m.name || !m.type) {
      unparsed.push({ text: raw, line })
      continue
    }
    const name = ts.isIdentifier(m.name) || ts.isStringLiteral(m.name) ? m.name.text : null
    if (!name) {
      unparsed.push({ text: raw, line })
      continue
    }
    const optional = !!m.questionToken
    const p = classifyType(name, m.type, sf, optional, line, ctx)
    if (!p) {
      unparsed.push({ text: raw, line })
      continue
    }
    // 중첩 객체(labels?: { columns: { name: string } })는 점 표기로 평탄화한다 — 규약 §4.
    if (p.kind === 'object') {
      props.push(...flattenObject(name, p.typeNode ?? m.type, p.sf ?? sf, ctx))
      continue
    }
    props.push(p)
  }

  return { props, src, unparsed, component, file: rel }
}

/**
 * 타입 별칭 해석기 — `labels?: LoadingLabels`처럼 다른 파일(src/shared/labels.ts)에 선언된
 * 별칭을 따라가야 규약 §4의 점 표기 평탄화를 할 수 있다.
 */
function makeTypeResolver(sf, abs) {
  const aliases = new Map()
  const importedFrom = new Map()

  const collect = (source, path) => {
    for (const stmt of source.statements) {
      if (ts.isTypeAliasDeclaration(stmt) && !aliases.has(stmt.name.text)) {
        aliases.set(stmt.name.text, { type: stmt.type, sf: source })
      } else if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const spec = stmt.moduleSpecifier.text
        if (!spec.startsWith('.')) continue
        const clause = stmt.importClause
        if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
        const base = resolvePath(dirname(path), spec)
        if (base) for (const el of clause.namedBindings.elements) importedFrom.set(el.name.text, base)
      }
    }
  }
  collect(sf, abs)

  const loaded = new Set()
  return {
    resolve(name) {
      if (aliases.has(name)) return aliases.get(name)
      const target = importedFrom.get(name)
      if (target && !loaded.has(target)) {
        loaded.add(target)
        collect(ts.createSourceFile(target, readFileSync(target, 'utf8'), ts.ScriptTarget.ES2020, true), target)
      }
      return aliases.get(name) ?? null
    },
  }
}

function resolvePath(dir, spec) {
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const p = join(dir, spec + ext)
    if (existsSync(p)) return p
  }
  return null
}

/** 교차 타입(A & B)도 멤버를 모은다. */
function collectMembers(typeNode) {
  if (ts.isTypeLiteralNode(typeNode)) return [...typeNode.members]
  if (ts.isIntersectionTypeNode(typeNode)) {
    const out = []
    for (const t of typeNode.types) if (ts.isTypeLiteralNode(t)) out.push(...t.members)
    return out
  }
  return []
}

const isNullLit = (x) =>
  x.kind === ts.SyntaxKind.NullKeyword ||
  (ts.isLiteralTypeNode(x) && x.literal.kind === ts.SyntaxKind.NullKeyword)

function classifyType(name, t, sf, optional, line, ctx, depth = 0) {
  const base = { name, optional, line }
  if (depth > 4) return null

  if (ts.isUnionTypeNode(t)) {
    // `string | undefined`, `Date | null` 처럼 undefined/null만 곁들인 유니온은 본체로 축약한다.
    const real = t.types.filter((x) => x.kind !== ts.SyntaxKind.UndefinedKeyword && !isNullLit(x))
    if (real.length === 1) return classifyType(name, real[0], sf, optional, line, ctx, depth + 1)

    // 리터럴 유니온 → variant 축 후보 (규약 §2)
    const lits = real.filter((x) => ts.isLiteralTypeNode(x))
    if (lits.length === real.length && lits.length > 0) {
      const values = lits.map((x) => {
        const l = x.literal
        if (ts.isStringLiteral(l)) return l.text
        if (ts.isNumericLiteral(l)) return l.text
        if (l.kind === ts.SyntaxKind.TrueKeyword) return 'true'
        if (l.kind === ts.SyntaxKind.FalseKeyword) return 'false'
        return null
      })
      if (values.every((v) => v !== null)) return { ...base, kind: 'union', values }
    }
    if (real.some((x) => /ReactNode|ReactElement/.test(x.getText(sf)))) {
      return { ...base, kind: name === 'children' ? 'children' : 'swap' }
    }
    // `string | number`(치수 등) — Figma 속성으로 매핑되지 않는 값. 축도 TEXT도 아니다.
    return { ...base, kind: 'other' }
  }

  if (t.kind === ts.SyntaxKind.BooleanKeyword) return { ...base, kind: 'boolean' }
  if (t.kind === ts.SyntaxKind.StringKeyword) return { ...base, kind: 'string' }
  if (t.kind === ts.SyntaxKind.NumberKeyword) return { ...base, kind: 'number' }

  // 함수 타입(onClick 등) — 축/속성 대상이 아니라 검사에서 제외한다.
  if (ts.isFunctionTypeNode(t)) return { ...base, kind: 'callback' }

  // 배열 prop(items[] / columns[]) — Figma 속성으로 1:1 표현 불가.
  // 인덱스 전개(`Item 1`, `Head 2`)는 규약 위반이므로 list로 표시해 N4c가 잡게 한다.
  if (ts.isArrayTypeNode(t)) return { ...base, kind: 'list' }

  if (ts.isTypeLiteralNode(t)) return { ...base, kind: 'object', typeNode: t, sf }

  if (ts.isTypeReferenceNode(t)) {
    const ref = t.typeName.getText(sf)
    if (ref === 'Array' || ref === 'ReadonlyArray') return { ...base, kind: 'list' }
    if (/ReactNode|ReactElement/.test(t.getText(sf))) {
      return { ...base, kind: name === 'children' ? 'children' : 'swap' }
    }
    // 별칭을 따라간다: 문자열 유니온이면 축(MediaRatio), 객체면 점 표기 평탄화(LoadingLabels).
    const alias = ctx?.resolve(ref)
    if (alias) {
      const inner = classifyType(name, alias.type, alias.sf, optional, line, ctx, depth + 1)
      if (inner && inner.kind === 'object') return { ...base, kind: 'object', typeNode: alias.type, sf: alias.sf }
      if (inner) return { ...inner, name, optional, line }
    }
    // Date / Record<> / Partial<> / 도메인 값 객체 — Figma 속성으로 매핑되지 않는다.
    return { ...base, kind: 'other' }
  }

  if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
    return { ...base, kind: 'union', values: [t.literal.text] }
  }

  // 인덱스드 액세스 타입 — `BadgeProps['appearance']`처럼 다른 타입의 멤버 하나를 가리킨다.
  // ConsentList.appearance가 이 형태다: appearance?: BadgeProps['appearance']. 별칭을 따라가
  // 그 멤버(appearance: 'solid'|'soft'|'outline')를 찾으면 재귀 분류로 그대로 풀린다 — 못 찾으면
  // (제네릭 인덱스·계산된 키 등) 지어내지 않고 'other'로 떨어뜨려 축도 TEXT도 요구하지 않는다.
  if (ts.isIndexedAccessTypeNode(t)) {
    const { objectType, indexType } = t
    if (ts.isTypeReferenceNode(objectType) && ts.isLiteralTypeNode(indexType) && ts.isStringLiteral(indexType.literal)) {
      const alias = ctx?.resolve(objectType.typeName.getText(sf))
      const key = indexType.literal.text
      const member = alias && collectMembers(alias.type).find(
        (m) => ts.isPropertySignature(m) && m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) && m.name.text === key,
      )
      if (member?.type) {
        return classifyType(name, member.type, alias.sf, optional || !!member.questionToken, line, ctx, depth + 1)
      }
    }
    return { ...base, kind: 'other' }
  }

  return null
}

/** labels?: { columns: { name: string } } → 'labels.columns.name' (규약 §4 점 표기) */
function flattenObject(prefix, typeNode, sf, ctx, depth = 0) {
  const out = []
  if (!ts.isTypeLiteralNode(typeNode) || depth > 4) return out
  for (const m of typeNode.members) {
    if (!ts.isPropertySignature(m) || !m.name || !m.type) continue
    const key = ts.isIdentifier(m.name) || ts.isStringLiteral(m.name) ? m.name.text : null
    if (!key) continue
    const path = `${prefix}.${key}`
    const ln = lineOf(sf, m)
    const node = m.type
    // 중첩 별칭(예: labels.columns: ColumnLabels)도 따라간다.
    if (ts.isTypeReferenceNode(node)) {
      const alias = ctx?.resolve(node.typeName.getText(sf))
      if (alias && ts.isTypeLiteralNode(alias.type)) {
        out.push(...flattenObject(path, alias.type, alias.sf, ctx, depth + 1))
        continue
      }
    }
    if (ts.isTypeLiteralNode(node)) out.push(...flattenObject(path, node, sf, ctx, depth + 1))
    else if (isStringish(node))
      out.push({ name: path, kind: 'string', optional: !!m.questionToken, line: ln, nested: true })
  }
  return out
}

/** string 또는 `string | undefined` — labels 리프가 문구일 때만 TEXT 대상이다(LabelFn 등은 제외). */
function isStringish(node) {
  if (node.kind === ts.SyntaxKind.StringKeyword) return true
  if (ts.isUnionTypeNode(node)) {
    const real = node.types.filter((x) => x.kind !== ts.SyntaxKind.UndefinedKeyword && !isNullLit(x))
    return real.length === 1 && real[0].kind === ts.SyntaxKind.StringKeyword
  }
  return false
}

/**
 * 규약 분류: union → variant 축 / show* boolean → BOOLEAN 속성 / 기타 boolean → variant 축(false·true)
 * string → TEXT / ReactNode → INSTANCE_SWAP / children → slot('content')
 * number·list는 축/속성이 될 수 없다(규약 §2·§4) — 따로 실어 규칙 엔진이 위반으로 잡게 한다.
 * callback·other는 검사 대상이 아니다.
 *
 * optionalText — "Figma에 있으면 정당하지만 코드가 요구하지는 않는" TEXT 이름.
 * children 슬롯 하나가 유일한 출처다: 규약 §7이 슬롯의 레이어 이름을 'content'로 못박았고,
 * 세트가 그 슬롯을 '텍스트 한 줄'로 그릴 때(Callout·Highlight·Card·Modal·Popover·BottomSheet)
 * 그 레이어에 붙는 TEXT 속성의 이름도 'content'가 정답이다 — 규약이 허용하는 유일한 이름이다.
 * 그런데 text에 넣으면 두 곳이 깨진다:
 *   (1) build-story-manifest.mjs가 cls.text를 매니페스트로 직렬화하고 verify-mapping.mjs가
 *       플러그인 내장 COMPONENT_MANIFEST와 deep-equal로 왕복 검증한다 → 없는 TEXT를 요구하게 된다.
 *   (2) 슬롯을 텍스트로 그리지 않는 세트(children을 프레임으로 받는 Upload·Drawer·CrudDialog 등)에
 *       'content' TEXT 누락(N4)을 새로 씌운다 — 그건 이미 N7(slot-missing)이 보는 자리다(중복 보고).
 * 그래서 '요구'가 아니라 '허용'으로만 싣는다. 규칙 엔진은 여분(extra) 판정에서만 이걸 인정한다.
 */
export function classifyProps(props) {
  const axes = []
  const text = []
  const booleans = []
  const swaps = []
  const numbers = []
  const lists = []
  let slot = null
  // 주의: axes 항목에 line 같은 부가 키를 넣지 마라. build-story-manifest.mjs가 이 결과를
  // 플러그인 내장 COMPONENT_MANIFEST와 deep-equal로 왕복 검증하므로 키가 하나만 늘어도 깨진다.
  for (const p of props) {
    if (p.kind === 'union') axes.push({ name: p.name, values: p.values })
    else if (p.kind === 'boolean' && p.name.startsWith('show')) booleans.push(p.name)
    else if (p.kind === 'boolean') axes.push({ name: p.name, values: ['false', 'true'] })
    else if (p.kind === 'string') text.push(p.name)
    else if (p.kind === 'number') numbers.push(p.name)
    else if (p.kind === 'list') lists.push(p.name)
    else if (p.kind === 'swap') swaps.push(p.name)
    else if (p.kind === 'children') slot = 'content'
  }
  // 코드에 진짜 `content: string` prop이 있으면(Tooltip) 이미 text에 있다 — 중복으로 싣지 않는다.
  const optionalText = slot && !text.includes(slot) ? [slot] : []
  return { axes, text, booleans, swaps, numbers, lists, slot, optionalText }
}

/** 컴포넌트 함수 시그니처의 구조분해 기본값 파싱: `showIcon = false` → { showIcon: false } */
export function parseBooleanDefaults(src) {
  const out = {}
  for (const m of src.matchAll(/(\w+)\s*=\s*(true|false)/g)) {
    out[m[1]] = m[2] === 'true'
  }
  return out
}

/** *.stories.tsx의 meta args 블록에서 문자열 기본값 파싱: label: 'Button' */
export function parseStoryTextDefaults(root, component, file = component) {
  const abs = join(root, 'src', 'ds', component, `${file}.stories.tsx`)
  if (!existsSync(abs)) return {}
  const src = readFileSync(abs, 'utf8')
  const m = src.match(/args:\s*\{([\s\S]*?)\n\s*\}/)
  const out = {}
  if (!m) return out
  for (const pm of m[1].matchAll(/(\w+):\s*'([^']*)'/g)) out[pm[1]] = pm[2]
  return out
}
