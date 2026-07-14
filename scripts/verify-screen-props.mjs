// verify-screen-props — 화면 조립 게이트. **세트 선언이 단일 출처**, 화면의 오버라이드가 그걸 따른다.
//
// ── 왜 이 게이트가 따로 필요한가 (다섯 게이트가 전부 초록인데 화면이 깨진 사고) ────────────
// 화면 생성기(screens.ts · site-screens.ts)는 `inst(ctx, '세트', { props: { 속성이름: 값 } })`으로
// 컴포넌트 인스턴스를 조립한다. 그런데 inst()의 구현은 **모르는 속성 이름을 경고만 하고 무시**한다:
//
//     const key = keys[name]            // propKeys(set) — 표시 이름 → 'Title#12:3'
//     if (key) props[key] = given[name]
//     else missing.push(name)           // ← 여기. 그리고 ctx.warnings.push(...)로 끝난다.
//
// 즉 세트의 속성 이름을 바꾸면 화면의 오버라이드가 **조용히 끊긴다**. 실행은 성공하고, 화면도 그려지고,
// 다만 세트 기본값이 그대로 남는다. 실제 사고:
//   · ProductCard의 'Price' → 'price' 개명 후 상품 카드 10장이 전부 세트 기본가로 렌더(세일가 소실).
//   · MemoBox 'Counter'·'Save', DropZone 'Action' ×3도 같은 방식으로 끊겼다.
// 기존 게이트 5개는 전부 초록이었다. 그들은 "세트 선언 ↔ React 코드"만 보고, 화면이 그 세트를
// **어떤 이름으로 부르는지**는 아무도 보지 않았기 때문이다. 사람이 눈으로 21건을 찾아 고쳤다.
// site-screens.ts의 swaps 경로는 더 나쁘다 — 키를 못 찾으면 warning조차 없이 통째로 삼킨다.
//
// ── 무엇을 검사하는가 ────────────────────────────────────────────────
//   S1  inst()의 대상 세트가 그 화면이 닿을 수 있는 레지스트리에 실재하는가 (없으면 폴백으로 조용히 강등)
//   S2  props: {...}의 키가 세트의 TEXT/BOOLEAN/INSTANCE_SWAP/VARIANT 속성에 실재하는가
//   S3  variant: {...}의 키가 세트의 VARIANT 축 이름인가 (축이 아닌 이름은 setProperties가 던진다 →
//       inst()가 catch로 삼켜 **그 인스턴스의 오버라이드가 전부** 날아간다)
//   S4  variant 값이 그 축의 값 집합에 있는가 (정적으로 읽히는 값만)
//   S5  swaps: {...}의 키가 세트의 INSTANCE_SWAP 속성인가
//
// ── 원칙 (verify-naming과 동일) ──────────────────────────────────────
//  1. 변환하지 않는다. 판정은 문자열 정확 일치다. 비슷한 이름 추측은 리포트를 친절하게 만들 때만 쓴다.
//  2. 검사 대상은 실물이다. 세트 스펙은 scripts/lib/figma-sets.mjs가 정본 생성기에서 뽑은 것을 그대로 쓴다
//     (파서를 복제하지 않는다 — CLAUDE.md §0-2).
//  3. **못 읽으면 실패다.** 파싱 못 한 inst() 호출은 E-UNPARSED로 올린다. 이번 사고의 교훈이
//     "조용히 통과"였으므로, 검사기가 조용히 통과하는 일이 있어서는 안 된다.
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { extractFigmaSets, getValidIconKeys } from './lib/figma-sets.mjs'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GEN_DIR = join(root, 'figma-plugin', 'src', 'generators')

/**
 * 화면 생성기 → 그 화면이 인스턴스를 꺼내 쓸 수 있는 세트 레지스트리.
 *
 * 이 짝은 임의가 아니다. 코드가 정한다:
 *   screens.ts      → import { ADMIN_SETS, adminSet } from './admin'   → admin.ts의 buildSet 세트만
 *   site-screens.ts → import { SITE_SETS, siteSet } from './site'      → site.ts의 buildSet 세트만
 * 그래서 screens.ts가 site.ts 세트('DS/SiteHeader')를 부르면 런타임엔 null → 폴백이다. S1이 그걸 잡는다.
 *
 * 여기 없는 생성기에 inst() 호출이 생기면 그 화면은 검사를 통째로 건너뛴다 —
 * assertNoUnregisteredScreens가 E-UNREGISTERED-SCREEN으로 막는다(figma-sets.mjs의 같은 이름 가드와 동형).
 */
const SCREEN_FILES = [
  { file: 'screens.ts', registry: ['admin'] },
  { file: 'site-screens.ts', registry: ['site'] },
]

/** opts 객체에서 검사할 버킷 — 버킷마다 허용되는 속성 종류가 다르다. */
const BUCKETS = {
  variant: { rule: 'S3', kinds: ['VARIANT'] },
  props: { rule: 'S2', kinds: ['VARIANT', 'TEXT', 'BOOLEAN', 'INSTANCE_SWAP'] },
  swaps: { rule: 'S5', kinds: ['INSTANCE_SWAP'] },
}
/** opts에서 속성 이름을 담지 않는 키 — 검사 대상이 아니다. */
const OPT_PASSTHROUGH = new Set(['name'])

// ── CLI ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const asJson = argv.includes('--json')
const filterFile = argv.find((a) => a.startsWith('--file='))?.split('=')[1]

// ── 수집 ─────────────────────────────────────────────────────────────
const violations = []
const errors = []
/** 파싱 못 한 inst() 호출 — 개수를 반드시 보고한다(조용한 통과 금지). */
const unparsed = []

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
const parseFile = (abs) => ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.ES2020, true)

// ── 1) 세트 스펙 — verify-naming과 **같은 추출기**를 쓴다(파서 복제 금지) ──
const { specs, errors: extractErrors } = extractFigmaSets(root)
// 추출기 자체가 못 읽은 게 있으면 그 세트의 속성 목록은 불완전하다 → 대조가 거짓말을 한다. 그대로 올린다.
errors.push(...extractErrors)
// INSTANCE_SWAP 값(아이콘 키) 검증의 단일 출처 — icons-data.ts를 새로 읽지 않고 재사용한다(D4).
const validIconKeys = getValidIconKeys(root)

/** 'admin' | 'site' 등 생성기 파일 이름 → 그 파일이 선언한 세트들 */
const specsByGenerator = new Map()
for (const s of specs) {
  const gen = s.file.replace(/^.*\//, '').replace(/\.ts$/, '')
  if (!specsByGenerator.has(gen)) specsByGenerator.set(gen, new Map())
  specsByGenerator.get(gen).set(s.setName, s)
}

/**
 * 세트 스펙 → { 속성이름 → 종류 }.
 * inst()가 하는 일을 그대로 모델링한다:
 *   · variant 키는 축 이름 그대로 setProperties에 들어간다.
 *   · props/swaps 키는 propKeys(set)를 거친다 = componentPropertyDefinitions의 표시 이름.
 *     여기엔 VARIANT도 함께 들어 있으므로(키에 '#'이 없을 뿐) props에 축 이름을 넘겨도 먹는다.
 *   · derivedBools는 buildSet이 TEXT마다 자동 생성하던 `Show <prop>` 유령 불리언이다. 지금 정본은
 *     만들지 않지만(=빈 배열), 되살아나면 화면이 그걸 부를 수 있으므로 모델에 포함해 둔다.
 */
function propKindsOf(spec) {
  const kinds = new Map()
  const put = (name, kind) => {
    if (typeof name === 'string' && !kinds.has(name)) kinds.set(name, kind)
  }
  for (const a of spec.axes) put(a.name, 'VARIANT')
  for (const t of spec.texts) put(t.prop, 'TEXT')
  for (const b of spec.bools) put(b.prop, 'BOOLEAN')
  for (const g of spec.derivedBools ?? []) put(g.name, 'BOOLEAN')
  for (const s of spec.swaps) put(s.prop, 'INSTANCE_SWAP')
  return kinds
}

// ── 2) 화면 생성기 밖의 inst() 호출 차단 ──────────────────────────────
// 새 화면 생성기를 만들고 SCREEN_FILES에 등록만 안 하면 위반이 조용히 0으로 떨어진다
// (고쳐서가 아니라 안 봐서). figma-sets.mjs의 E-UNREGISTERED와 같은 실패 모드다 — 구조적으로 막는다.
function assertNoUnregisteredScreens() {
  const registered = new Set(SCREEN_FILES.map((s) => s.file))
  for (const file of readdirSync(GEN_DIR)) {
    if (!file.endsWith('.ts') || registered.has(file)) continue
    const sf = parseFile(join(GEN_DIR, file))
    let hits = 0
    const visit = (n) => {
      if (isInstCall(n)) hits++
      ts.forEachChild(n, visit)
    }
    visit(sf)
    if (hits > 0) {
      errors.push({
        code: 'E-UNREGISTERED-SCREEN',
        file: `figma-plugin/src/generators/${file}`,
        line: 0,
        message:
          `inst() 호출 ${hits}건이 있는데 SCREEN_FILES에 없다 — 이 화면의 오버라이드는 검사를 통째로 건너뛴다. ` +
          `scripts/verify-screen-props.mjs의 SCREEN_FILES에 '${file}'과 그 세트 레지스트리를 등록하라.`,
      })
    }
  }
}

/**
 * inst(ctx, 'DS/X', {...}) 호출인가.
 * 인자 2개 이상 + 식별자 inst — `const inst = set.defaultVariant.createInstance()`(admin/site/categories의
 * 지역 변수)는 CallExpression이 아니므로 걸리지 않는다.
 */
function isInstCall(n) {
  return ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'inst' && n.arguments.length >= 2
}

assertNoUnregisteredScreens()

// ── 3) 화면 파일의 inst() 호출 대조 ───────────────────────────────────
for (const { file, registry } of SCREEN_FILES) {
  if (filterFile && file !== filterFile) continue
  const rel = `figma-plugin/src/generators/${file}`
  const sf = parseFile(join(GEN_DIR, file))

  // 이 화면이 닿을 수 있는 세트만 모은다(레지스트리 = import한 SETS 맵).
  const reachable = new Map()
  for (const gen of registry) {
    for (const [setName, spec] of specsByGenerator.get(gen) ?? []) reachable.set(setName, spec)
  }
  if (reachable.size === 0) {
    errors.push({
      code: 'E-NO-SETS',
      file: rel,
      line: 0,
      message: `레지스트리(${registry.join(', ')})에서 세트를 하나도 추출하지 못했다 — 대조할 기준이 없으므로 이 화면은 검사되지 않은 것이다.`,
    })
    continue
  }

  let calls = 0
  const visit = (node) => {
    if (isInstCall(node)) {
      calls++
      checkCall(node, sf, rel, reachable)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (calls === 0) {
    errors.push({
      code: 'E-NO-CALLS',
      file: rel,
      line: 0,
      message: `SCREEN_FILES에 등록됐는데 inst() 호출이 0건이다 — 호출부가 사라졌거나 헬퍼 이름이 바뀌었다(검사기가 아무것도 안 보고 있다).`,
    })
  }
}

// ── 4) 문서(variantItem) states 대조 — 세 번째 사고를 미리 막는 자리 ──────
// 화면(inst())과 나란한 두 번째 조립 통로다: categories-core.ts 등 5개 생성기가 문서 페이지에
// variantItem(ctx, set, state)로 "이 컴포넌트는 이렇게 생겼다" 예시를 그린다. state.props/texts/swaps의
// 이름이 세트에 없거나 값이 그 축·타입에 안 맞으면(오타 'showFotter' · 없는 축 값 'size: xl' · 'yes' 같은 불리언)
// build-set.ts의 resolveStateProps가 **경고만 남기고 무시한다** — inst()가 화면에서 저지르는 것과 완전히
// 같은 실패 모드다. setName은 이미 figma-sets.mjs가 buildSet 호출과 같은 자리에서 뽑았으므로(resolveDocStates)
// 여기선 그 states 안의 이름·값만 세트 스펙과 대조한다. 이 화면 레지스트리(SCREEN_FILES)와 무관하게
// 5개 생성기 전부를 본다 — 문서는 화면과 달리 admin/site 구분이 없다.
let docStatesChecked = 0
for (const spec of specs) {
  if (!Array.isArray(spec.states)) continue // 추출 자체의 실패는 이미 errors에 올라 있다(E-UNPARSED-STATES 등)
  const kinds = propKindsOf(spec)
  for (const state of spec.states) {
    docStatesChecked++
    checkDocState(spec, state, kinds)
  }
}

/** 문서 상태(state) 하나의 props/texts/swaps를 세트 스펙과 대조한다. 못 읽는 게 아니라 값 자체를 판정한다. */
function checkDocState(spec, state, kinds) {
  const line = state.__line ?? spec.line
  const checkBucket = (bucketName, obj) => {
    if (!obj) return
    for (const name of Object.keys(obj)) {
      const value = obj[name]
      const kind = kinds.get(name)
      if (!kind) {
        violations.push({
          rule: 'D1',
          kind: 'doc-state-unknown',
          file: spec.file,
          line,
          set: spec.setName,
          prop: name,
          near: nearest(name, [...kinds.keys()]),
          fix: `문서 상태 '${state.caption}'(${bucketName}) — '${spec.setName}'에 '${name}' 속성이 없다. variantItem은 경고만 남기고 무시한다(문서에서 그 오버라이드가 조용히 사라진다).`,
        })
        continue
      }
      if (kind === 'BOOLEAN' && value !== 'true' && value !== 'false') {
        violations.push({
          rule: 'D2',
          kind: 'doc-state-bad-bool',
          file: spec.file,
          line,
          set: spec.setName,
          prop: `${name}='${value}'`,
          near: null,
          fix: `문서 상태 '${state.caption}' — BOOLEAN 속성 '${name}'은 'true' 또는 'false' 문자열이어야 한다.`,
        })
        continue
      }
      // D4: INSTANCE_SWAP 값(아이콘 키)이 실재하는가. resolveStateProps는 ICON_COMPONENTS.get(raw)로
      // 대조해 없으면 경고만 남기고 그 오버라이드를 버린다(build-set.ts:191-197) — D1(이름 존재)만 보고
      // 넘어가면 이 실패 모드를 놓친다. kind가 여기 오려면 이름은 이미 세트에 실재하므로(D1 통과),
      // 여기서 판정하는 것은 오직 값(아이콘 키 문자열)이다.
      if (kind === 'INSTANCE_SWAP') {
        if (typeof value !== 'string' || !validIconKeys.has(value)) {
          violations.push({
            rule: 'D4',
            kind: 'doc-state-bad-icon-key',
            file: spec.file,
            line,
            set: spec.setName,
            prop: `${name}='${value}'`,
            near: nearest(String(value), [...validIconKeys]),
            fix: `문서 상태 '${state.caption}' — INSTANCE_SWAP 속성 '${name}'의 아이콘 키 '${value}'가 ICON_COMPONENTS에 없다. resolveStateProps가 경고만 남기고 그 오버라이드를 버린다(세트 기본 아이콘이 그대로 렌더된다).`,
          })
        }
        continue
      }
      if (kind === 'VARIANT') {
        const axis = spec.axes.find((a) => a.name === name)
        if (axis && !axis.values.map(String).includes(String(value))) {
          violations.push({
            rule: 'D3',
            kind: 'doc-state-bad-variant-value',
            file: spec.file,
            line,
            set: spec.setName,
            prop: `${name}='${value}'`,
            near: axis.values.join(' | '),
            fix: `문서 상태 '${state.caption}' — 축 '${name}'의 값이 아니다. setProperties가 던지고 variantItem이 catch로 삼켜 이 문서 아이템의 오버라이드가 전부 날아간다.`,
          })
        }
      }
    }
  }
  checkBucket('props', state.props)
  checkBucket('texts', state.texts)
  checkBucket('swaps', state.swaps)
}

/** inst() 호출 하나를 세트 스펙과 대조한다. 못 읽으면 unparsed에 올린다(건너뛰지 않는다). */
function checkCall(node, sf, rel, reachable) {
  const line = lineOf(sf, node)
  const at = { file: rel, line }
  const src = () => node.getText(sf).slice(0, 90).replace(/\s+/g, ' ')

  // ── 대상 세트 이름 — 정적 문자열이어야 한다.
  const setArg = node.arguments[1]
  if (!ts.isStringLiteral(setArg) && !ts.isNoSubstitutionTemplateLiteral(setArg)) {
    unparsed.push({ ...at, reason: '세트 이름이 정적 문자열이 아니다', snippet: src() })
    return
  }
  const setName = setArg.text

  // ── S1: 세트 실재 여부. 없으면 inst()가 null을 반환 → 화면이 폴백으로 조용히 강등된다.
  const spec = reachable.get(setName)
  if (!spec) {
    violations.push({
      rule: 'S1',
      kind: 'set-missing',
      ...at,
      set: setName,
      prop: null,
      near: nearest(setName, [...reachable.keys()]),
      fix: `이 화면이 닿을 수 있는 레지스트리에 '${setName}' 세트가 없다 — inst()가 null을 반환해 폴백(draw*)으로 조용히 내려간다`,
    })
    return
  }
  const kinds = propKindsOf(spec)

  // ── opts 인자
  const optsArg = node.arguments[2]
  if (!optsArg) return // inst(ctx, 'DS/X') — 오버라이드 없음. 검사할 게 없다(파싱 실패가 아니다).
  if (!ts.isObjectLiteralExpression(optsArg)) {
    unparsed.push({ ...at, reason: 'opts가 객체 리터럴이 아니다', snippet: src() })
    return
  }

  for (const p of optsArg.properties) {
    if (!ts.isPropertyAssignment(p)) {
      unparsed.push({ ...at, reason: `opts에 지원하지 않는 프로퍼티(${ts.SyntaxKind[p.kind]})`, snippet: src() })
      continue
    }
    const bucketName = staticKey(p.name)
    if (bucketName === null) {
      unparsed.push({ ...at, reason: 'opts의 키가 계산된 프로퍼티다', snippet: src() })
      continue
    }
    if (OPT_PASSTHROUGH.has(bucketName)) continue
    const bucket = BUCKETS[bucketName]
    if (!bucket) {
      // InstOpts에 새 버킷이 생겼는데 검사기가 모른다 — 조용히 넘기면 그 버킷은 영영 검사되지 않는다.
      unparsed.push({ ...at, reason: `모르는 opts 버킷 '${bucketName}' — BUCKETS에 등록하라`, snippet: src() })
      continue
    }
    if (!ts.isObjectLiteralExpression(p.initializer)) {
      unparsed.push({ ...at, reason: `${bucketName}이 객체 리터럴이 아니다`, snippet: src() })
      continue
    }

    for (const entry of p.initializer.properties) {
      if (!ts.isPropertyAssignment(entry) && !ts.isShorthandPropertyAssignment(entry)) {
        // 스프레드(...x)는 키를 정적으로 알 수 없다 → 삼키지 않고 올린다.
        unparsed.push({
          ...at,
          reason: `${bucketName}에 정적으로 못 읽는 항목(${ts.SyntaxKind[entry.kind]})`,
          snippet: entry.getText(sf).slice(0, 60).replace(/\s+/g, ' '),
        })
        continue
      }
      const name = staticKey(entry.name)
      if (name === null) {
        unparsed.push({ ...at, reason: `${bucketName}의 속성 이름이 계산된 키다`, snippet: src() })
        continue
      }
      const entryLine = lineOf(sf, entry)
      const kind = kinds.get(name)

      // ── S2/S3/S5: 그 이름이 세트에 실재하는가 + 이 버킷이 받는 종류인가
      if (!kind) {
        violations.push({
          rule: bucket.rule,
          kind: `${bucketName}-unknown`,
          file: rel,
          line: entryLine,
          set: setName,
          prop: name,
          near: nearest(name, [...kinds.keys()].filter((n) => bucket.kinds.includes(kinds.get(n)))),
          fix: `'${setName}'에 '${name}' 속성이 없다 — inst()가 경고만 남기고 무시한다(오버라이드가 조용히 끊긴다)`,
        })
        continue
      }
      if (!bucket.kinds.includes(kind)) {
        violations.push({
          rule: bucket.rule,
          kind: `${bucketName}-wrong-type`,
          file: rel,
          line: entryLine,
          set: setName,
          prop: `${name} (${kind})`,
          near: null,
          fix:
            bucketName === 'variant'
              ? `'${name}'은 축이 아니라 ${kind}다 — variant에 넣으면 setProperties가 던져 이 인스턴스의 오버라이드가 전부 날아간다. props로 옮겨라`
              : `'${name}'은 ${kind}다 — ${bucketName}은 ${bucket.kinds.join('/')}만 받는다`,
        })
        continue
      }

      // ── S4: variant 값이 그 축의 값 집합에 있는가 (정적 문자열만 — String(i+1) 같은 동적 값은 건너뛴다)
      if (bucketName === 'variant' && ts.isPropertyAssignment(entry)) {
        const v = entry.initializer
        const isStatic = ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)
        if (isStatic) {
          const axis = spec.axes.find((a) => a.name === name)
          if (axis && !axis.values.map(String).includes(v.text)) {
            violations.push({
              rule: 'S4',
              kind: 'variant-value',
              file: rel,
              line: entryLine,
              set: setName,
              prop: `${name}='${v.text}'`,
              near: axis.values.join(' | '),
              fix: `축 '${name}'의 값이 아니다 — setProperties가 던지고 inst()가 catch로 삼켜 이 인스턴스의 오버라이드가 전부 날아간다`,
            })
          }
        }
      }
    }
  }
}

/** 프로퍼티 이름 노드 → 정적 문자열(식별자·문자열 리터럴). 계산된 키면 null. */
function staticKey(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNoSubstitutionTemplateLiteral(nameNode))
    return nameNode.text
  if (ts.isNumericLiteral(nameNode)) return nameNode.text
  return null
}

/**
 * 비슷한 실제 이름 — **리포트 문구를 친절하게 만들 때만** 쓴다(통과 판정에는 절대 쓰지 않는다).
 * 1순위: 대소문자·공백만 다른 같은 이름('Brand' → 'brand', 'Total Label' → 'totalLabel'). 이게 개명 사고의 형태다.
 * 2순위: 편집 거리가 이름 길이의 40% 이내인 가장 가까운 이름.
 */
function nearest(name, candidates) {
  if (!candidates.length) return null
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
  const twin = candidates.find((c) => norm(c) === norm(name))
  if (twin) return twin
  let best = null
  let bestD = Infinity
  for (const c of candidates) {
    const d = distance(norm(name), norm(c))
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return bestD <= Math.max(2, Math.floor(norm(name).length * 0.4)) ? best : null
}

function distance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

// ── 출력 ─────────────────────────────────────────────────────────────
violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

const screenCount = SCREEN_FILES.length
const setCount = specs.length
// 못 읽은 호출은 실패다 — "검사하지 않아서 통과"가 이번 사고의 뿌리다(docs/naming-parity.md §조용한 통과 금지).
const failing = violations.length > 0 || errors.length > 0 || unparsed.length > 0

if (asJson) {
  console.log(
    JSON.stringify(
      {
        violations,
        errors,
        unparsed,
        summary: { screens: screenCount, sets: setCount, desync: violations.length, docStatesChecked },
      },
      null,
      2,
    ),
  )
  process.exit(failing ? 1 : 0)
}

for (const e of errors) {
  console.error(`FAIL  ${e.code}\n  ${e.file}:${e.line}\n  ${e.message}\n`)
}
for (const v of violations) {
  console.error(
    `FAIL  ${v.rule}-${v.kind}\n` +
      `  where ${v.file}:${v.line}\n` +
      `  set   ${v.set}\n` +
      `  prop  ${v.prop ?? '(없음)'}${v.near ? `   → 비슷한 실제 이름: ${v.near}` : '   → 비슷한 이름 없음'}\n` +
      `  fix   ${v.fix}\n`,
  )
}
for (const u of unparsed) {
  console.error(`FAIL  E-UNPARSED\n  ${u.file}:${u.line}\n  ${u.reason} — ${u.snippet}\n`)
}

if (failing) {
  const byFile = {}
  for (const v of violations) byFile[v.file.split('/').pop()] = (byFile[v.file.split('/').pop()] || 0) + 1
  const byRule = {}
  for (const v of violations) byRule[v.rule] = (byRule[v.rule] || 0) + 1
  const fmt = (o) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ') || '없음'
  console.error(
    `verify-screen-props FAIL — 화면↔세트 속성 desync ${violations.length}건 / ${screenCount}화면 생성기 / ${setCount}세트 / 문서 states ${docStatesChecked}건 검사\n` +
      `  by rule : ${fmt(byRule)}\n` +
      `  by file : ${fmt(byFile)}\n` +
      `  미파싱 inst() 호출: ${unparsed.length}건${unparsed.length ? '  ← 검사되지 않은 호출이다. 조용히 통과시키지 않는다.' : ''}\n` +
      (errors.length ? `  errors  : ${errors.length}건 (추출기/등록/문서 states 오류 — 위 목록 참조)\n` : '') +
      `\n  inst()는 없는 속성 이름을 경고만 하고 무시한다 — 다른 게이트가 전부 초록이어도 화면 오버라이드는 끊긴다.\n` +
      `  variantItem도 마찬가지다 — 문서 states의 이름·값이 틀려도 경고만 남기고 그 그림은 세트 기본값으로 조용히 렌더된다(D1~D3).\n`,
  )
  process.exit(1)
}
console.log(
  `verify-screen-props OK — ${screenCount}화면 생성기 · ${setCount}세트 · inst() 오버라이드 desync 0건\n` +
    `  미파싱 inst() 호출 0건 (모든 호출을 실제로 대조했다)\n` +
    `  문서 states ${docStatesChecked}건 검사 · variantItem 오버라이드 desync 0건`,
)
