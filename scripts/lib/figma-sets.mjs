// Figma 생성기(정본) → FigmaSpec[] 정적 추출기.
//
// 왜 AST인가: 생성기는 `figma` 전역에 의존하므로 런타임 import가 불가능하다.
// 왜 정본만인가: components.ts의 COMPONENT_MANIFEST는 generateComponents가 호출되지 않아
//   그림자 선언이다(ui.html이 components:false로 못박음). 실제 Figma에 그려지는 건
//   GENERATOR_FILES의 buildSet(...) 선언뿐이므로 그것만 본다.
// 왜 조용히 건너뛰지 않는가: 파싱 실패를 continue로 넘기면 "검사하지 않아서 통과"가 된다.
//   그게 이번 네이밍 드리프트를 아무도 못 잡은 근본 원인이다 → 미파싱은 E-UNPARSED 위반이고,
//   추출 개수가 호출 개수와 다르면 E-COVERAGE로 실패한다(파서가 삼키는 걸 막는 안전핀).
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

/**
 * 정본 생성기 — 여기 없는 파일은 Figma에 아무것도 그리지 않는다.
 * categories.ts는 5천 줄이라 categories-{core,nav-overlay,data-kr-media}.ts로 쪼갰다.
 * 남은 categories.ts는 생성 루프만 도는 오케스트레이터라 buildSet 선언이 없다(그래서 목록에 없다).
 * 목록에서 빠진 파일에 buildSet이 생기면 E-UNREGISTERED로 잡는다 — 아래 assertNoUnregisteredSets 참고.
 */
export const CATEGORY_FILES = ['categories-core', 'categories-nav-overlay', 'categories-data-kr-media']

export const GENERATOR_FILES = [...CATEGORY_FILES, 'admin', 'site']

/** INPUTS/makeInputSet 어댑터가 사는 파일 — 분할로 categories.ts에서 categories-core.ts로 옮겨졌다. */
const INPUT_ADAPTER_FILE = 'categories-core'

/**
 * buildSet 정본이 사는 곳. 유령 불리언 자동생성(`Show ${t.prop}`) 스캔은 반드시 여기도 봐야 한다.
 * 예전엔 buildSet이 생성기마다 복붙돼 있어서 생성기 본문만 봐도 됐지만, 이제 본문은 lib에 한 벌뿐이다.
 * 이 경로를 빼먹으면 가드가 구조적으로 죽는다(정본에서 자동생성을 되살려도 영원히 못 잡는다).
 */
const BUILD_SET_LIB = ['figma-plugin', 'src', 'generators', 'lib', 'build-set.ts']

/** buildSet 본문이 텍스트마다 `Show <prop>` 불리언을 자동 생성하는지 — 유령 속성 드리프트 방어. */
const GHOST_RE = /addBoolProp\(\s*set\s*,\s*`Show \$\{/

class UnparsedError extends Error {
  constructor(message, node, sf) {
    super(message)
    this.node = node
    this.line = node && sf ? sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 : 0
    this.snippet = node && sf ? node.getText(sf).slice(0, 100).replace(/\s+/g, ' ') : ''
  }
}

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1

const parseFile = (abs) =>
  ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.ES2020, true)

// ── 정적 평가기 ──────────────────────────────────────────────────────
// 생성기의 buildSet 인자에 실제로 등장하는 문법만 지원한다.
// 그 밖의 문법을 만나면 값을 지어내지 않고 UnparsedError를 던진다(조용한 통과 금지).
function makeEvaluator(sf, absPath) {
  // 모듈 최상위 const 초기값 — flatProps(STEPS.map(...)) 같은 참조를 풀기 위해 필요하다.
  const moduleConsts = new Map()
  // import된 심볼 → 원본 파일 (admin.ts의 ADMIN_ACTIVE_VALUES가 admin-menu.ts에 있다)
  const imports = new Map()

  const collect = (source, path) => {
    for (const stmt of source.statements) {
      if (ts.isVariableStatement(stmt)) {
        for (const d of stmt.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.initializer && !moduleConsts.has(d.name.text)) {
            moduleConsts.set(d.name.text, { node: d.initializer, sf: source })
          }
        }
      } else if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const spec = stmt.moduleSpecifier.text
        if (!spec.startsWith('.')) continue
        const target = resolve(dirname(path), spec + '.ts')
        if (!existsSync(target)) continue
        const clause = stmt.importClause
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) imports.set(el.name.text, target)
        }
      }
    }
  }
  collect(sf, absPath)

  // 임포트된 모듈은 필요할 때만 파싱한다(순환/과다 파싱 방지).
  const loadedModules = new Set()
  function resolveImport(name) {
    const target = imports.get(name)
    if (!target || loadedModules.has(target)) return false
    loadedModules.add(target)
    collect(parseFile(target), target)
    return moduleConsts.has(name)
  }

  function evalNode(node, env = new Map(), sfx = sf) {
    const E = (n, e = env, s = sfx) => evalNode(n, e, s)

    if (ts.isParenthesizedExpression(node)) return E(node.expression)
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression?.(node)) return E(node.expression)
    if (ts.isSatisfiesExpression?.(node)) return E(node.expression)
    if (ts.isNonNullExpression(node)) return E(node.expression)

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return Number(node.text)
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false
    if (node.kind === ts.SyntaxKind.NullKeyword) return null

    // `Step ${i + 1} Meta` — 인덱스 전개 이름(N4c/N5b 위반)이 여기서 나온다.
    if (ts.isTemplateExpression(node)) {
      let out = node.head.text
      for (const span of node.templateSpans) out += String(E(span.expression)) + span.literal.text
      return out
    }

    if (ts.isPrefixUnaryExpression(node)) {
      const v = E(node.operand)
      if (node.operator === ts.SyntaxKind.MinusToken) return -v
      if (node.operator === ts.SyntaxKind.ExclamationToken) return !v
      throw new UnparsedError(`지원하지 않는 단항 연산자`, node, sfx)
    }

    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind
      const K = ts.SyntaxKind
      if (op === K.AmpersandAmpersandToken) return E(node.left) && E(node.right)
      if (op === K.BarBarToken) return E(node.left) || E(node.right)
      if (op === K.QuestionQuestionToken) return E(node.left) ?? E(node.right)
      const l = E(node.left)
      const r = E(node.right)
      if (op === K.PlusToken) return l + r
      if (op === K.MinusToken) return l - r
      if (op === K.AsteriskToken) return l * r
      if (op === K.EqualsEqualsEqualsToken || op === K.EqualsEqualsToken) return l === r
      if (op === K.ExclamationEqualsEqualsToken || op === K.ExclamationEqualsToken) return l !== r
      throw new UnparsedError(`지원하지 않는 이항 연산자: ${K[op]}`, node, sfx)
    }

    if (ts.isConditionalExpression(node)) {
      return E(node.condition) ? E(node.whenTrue) : E(node.whenFalse)
    }

    if (ts.isIdentifier(node)) {
      if (env.has(node.text)) return env.get(node.text)
      if (node.text === 'undefined') return undefined
      if (!moduleConsts.has(node.text)) resolveImport(node.text)
      if (moduleConsts.has(node.text)) {
        const { node: init, sf: owner } = moduleConsts.get(node.text)
        return evalNode(init, new Map(), owner)
      }
      throw new UnparsedError(`해석 불가 식별자: ${node.text}`, node, sfx)
    }

    if (ts.isArrayLiteralExpression(node)) {
      const out = []
      for (const el of node.elements) {
        if (ts.isSpreadElement(el)) {
          const v = E(el.expression)
          if (!Array.isArray(v)) throw new UnparsedError('배열이 아닌 스프레드', el, sfx)
          out.push(...v)
        } else out.push(E(el))
      }
      // 위반 위치를 짚어주려면 각 항목이 어느 줄에서 왔는지 알아야 한다.
      let cursor = 0
      for (const el of node.elements) {
        if (ts.isSpreadElement(el)) {
          const len = E(el.expression).length
          cursor += len
          continue
        }
        const v = out[cursor++]
        if (v && typeof v === 'object' && !Array.isArray(v) && !Object.hasOwn(v, '__line')) {
          Object.defineProperty(v, '__line', { value: lineOf(sfx, el), enumerable: false })
        }
      }
      return out
    }

    if (ts.isObjectLiteralExpression(node)) {
      const out = {}
      for (const p of node.properties) {
        if (ts.isPropertyAssignment(p)) {
          const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : null
          if (key === null) throw new UnparsedError('계산된 프로퍼티 키', p, sfx)
          out[key] = E(p.initializer)
        } else if (ts.isShorthandPropertyAssignment(p)) {
          out[p.name.text] = E(p.name)
        } else if (ts.isSpreadAssignment(p)) {
          Object.assign(out, E(p.expression))
        } else throw new UnparsedError('지원하지 않는 오브젝트 프로퍼티', p, sfx)
      }
      Object.defineProperty(out, '__line', { value: lineOf(sfx, node), enumerable: false })
      return out
    }

    if (ts.isElementAccessExpression(node)) {
      const obj = E(node.expression)
      return obj[E(node.argumentExpression)]
    }

    if (ts.isPropertyAccessExpression(node)) {
      const obj = E(node.expression)
      if (obj === undefined || obj === null) {
        if (node.questionDotToken) return undefined
        throw new UnparsedError(`${node.expression.getText(sfx)}가 undefined`, node, sfx)
      }
      return obj[node.name.text]
    }

    // 즉시실행 함수 — ADMIN_ACTIVE_VALUES가 IIFE로 메뉴에서 축 값을 만든다.
    // `(() => {...})()` 형태라 callee가 괄호로 싸여 있다 — 벗겨내야 화살표 함수가 보인다.
    if (ts.isCallExpression(node)) {
      let callee = node.expression
      while (ts.isParenthesizedExpression(callee)) callee = callee.expression
      if (
        (ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) &&
        node.arguments.length === 0 &&
        ts.isBlock(callee.body)
      ) {
        return execBlock(callee.body, new Map(env), sfx)
      }

      // flatProps(x) — ES2017 타깃이라 flatMap이 없어 생성기가 쓰는 헬퍼. 한 단계 평탄화.
      if (ts.isIdentifier(callee) && callee.text === 'flatProps') {
        const groups = E(node.arguments[0])
        const out = []
        for (const g of groups) out.push(...g)
        return out
      }

      // 배열 고차함수 — map/filter/slice/concat만. (인덱스 전개 이름이 여기서 태어난다)
      if (ts.isPropertyAccessExpression(callee)) {
        const method = callee.name.text
        const recv = E(callee.expression)
        if (Array.isArray(recv)) {
          if (method === 'map' || method === 'filter') {
            const fn = node.arguments[0]
            if (!fn || !ts.isArrowFunction(fn)) throw new UnparsedError(`${method} 인자가 화살표 함수가 아님`, node, sfx)
            const params = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : null))
            const call = (el, i) => {
              const inner = new Map(env)
              if (params[0]) inner.set(params[0], el)
              if (params[1]) inner.set(params[1], i)
              return ts.isBlock(fn.body) ? execBlock(fn.body, inner, sfx) : evalNode(fn.body, inner, sfx)
            }
            return method === 'map' ? recv.map(call) : recv.filter(call)
          }
          if (method === 'slice') return recv.slice(...node.arguments.map((a) => E(a)))
          if (method === 'concat') return recv.concat(...node.arguments.map((a) => E(a)))
          if (method === 'join') return recv.join(...node.arguments.map((a) => E(a)))
        }
        if (typeof recv === 'string') {
          if (method === 'replace' || method === 'slice' || method === 'trim' || method === 'toLowerCase')
            return recv[method](...node.arguments.map((a) => E(a)))
        }
      }
      throw new UnparsedError(`해석 불가 호출: ${callee.getText(sfx).slice(0, 40)}`, node, sfx)
    }

    throw new UnparsedError(`지원하지 않는 문법: ${ts.SyntaxKind[node.kind]}`, node, sfx)
  }

  // 블록 본문 실행기 — IIFE(ADMIN_ACTIVE_VALUES)와 블록 화살표 함수를 위해 필요한 최소 문장만.
  function execBlock(block, env, sfx) {
    for (const stmt of block.statements) {
      const r = execStatement(stmt, env, sfx)
      if (r && r.__return) return r.value
    }
    return undefined
  }

  function execStatement(stmt, env, sfx) {
    if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) throw new UnparsedError('구조분해 선언', d, sfx)
        env.set(d.name.text, d.initializer ? evalNode(d.initializer, env, sfx) : undefined)
      }
      return null
    }
    if (ts.isReturnStatement(stmt)) {
      return { __return: true, value: stmt.expression ? evalNode(stmt.expression, env, sfx) : undefined }
    }
    if (ts.isForOfStatement(stmt)) {
      const iterable = evalNode(stmt.expression, env, sfx)
      const decl = stmt.initializer
      if (!ts.isVariableDeclarationList(decl) || !ts.isIdentifier(decl.declarations[0].name))
        throw new UnparsedError('지원하지 않는 for-of 초기화', stmt, sfx)
      const varName = decl.declarations[0].name.text
      for (const item of iterable) {
        env.set(varName, item)
        const body = stmt.statement
        const r = ts.isBlock(body)
          ? (() => {
              for (const s of body.statements) {
                const rr = execStatement(s, env, sfx)
                if (rr && rr.__return) return rr
              }
              return null
            })()
          : execStatement(body, env, sfx)
        if (r && r.__return) return r
      }
      return null
    }
    if (ts.isIfStatement(stmt)) {
      const branch = evalNode(stmt.expression, env, sfx) ? stmt.thenStatement : stmt.elseStatement
      if (!branch) return null
      if (ts.isBlock(branch)) {
        for (const s of branch.statements) {
          const r = execStatement(s, env, sfx)
          if (r && r.__return) return r
        }
        return null
      }
      return execStatement(branch, env, sfx)
    }
    if (ts.isExpressionStatement(stmt)) {
      const ex = stmt.expression
      // out.push(x) — IIFE가 배열을 채우는 유일한 수단.
      if (
        ts.isCallExpression(ex) &&
        ts.isPropertyAccessExpression(ex.expression) &&
        ex.expression.name.text === 'push'
      ) {
        const arr = evalNode(ex.expression.expression, env, sfx)
        if (!Array.isArray(arr)) throw new UnparsedError('push 대상이 배열이 아님', ex, sfx)
        arr.push(...ex.arguments.map((a) => evalNode(a, env, sfx)))
        return null
      }
      throw new UnparsedError(`지원하지 않는 문장식: ${ex.getText(sfx).slice(0, 40)}`, ex, sfx)
    }
    throw new UnparsedError(`지원하지 않는 문장: ${ts.SyntaxKind[stmt.kind]}`, stmt, sfx)
  }

  return evalNode
}

// ── makeInputSet 어댑터 ──────────────────────────────────────────────
// makeInputSet은 PropSpec을 명령형으로 조립하므로 buildSet 인자가 리터럴이 아니다.
// 파생 규칙을 여기에 명시적으로 재현하되, 원본이 바뀌면 재현이 낡았다는 걸 알아야 하므로
// 본문 지문을 박아두고 불일치 시 E-ADAPTER-STALE로 실패시킨다(생성기 바뀌면 어댑터를 고치라고 강제).
const MAKE_INPUT_SET_FINGERPRINT = [
  "props.texts!.push({prop:'placeholder',layer:'placeholder',def:def.placeholder})",
  "props.texts!.push({prop:'helperText',layer:'helperText',def:def.helper})",
  "if(def.affordance.unit&&def.unitProp)props.texts!.push({prop:def.unitProp,layer:def.unitProp,def:def.affordance.unit})",
  "if(def.description)props.texts!.push({prop:'description',layer:'description',def:def.description})",
  'if(def.bools)props.bools=def.bools',
  "if(def.sizeAxis)axes.unshift({name:'size',values:['md','sm','lg']})",
]

function checkInputAdapterFresh(src) {
  const m = src.match(/function makeInputSet\([\s\S]*?\n\}/)
  if (!m) return '생성기에서 makeInputSet을 찾지 못함'
  const norm = m[0].replace(/\s+/g, '')
  for (const probe of MAKE_INPUT_SET_FINGERPRINT) {
    if (!norm.includes(probe.replace(/\s+/g, ''))) {
      return `makeInputSet 파생 규칙이 바뀐 듯함 — scripts/lib/figma-sets.mjs의 expandInputs를 함께 고쳐라 (누락 지문: ${probe})`
    }
  }
  return null
}

/** makeInputSet(categories.ts)의 파생 규칙 재현 — INPUTS 8종을 FigmaSpec으로 전개 */
function expandInputs(sf, evalNode, file, errors, autoGhost) {
  const specs = []
  let inputsNode = null
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue
    for (const d of stmt.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === 'INPUTS') inputsNode = d.initializer
    }
  }
  if (!inputsNode) {
    errors.push({ code: 'E-UNPARSED', file, line: 0, message: 'INPUTS 배열을 찾지 못함' })
    return specs
  }

  let defs
  try {
    defs = evalNode(inputsNode)
  } catch (e) {
    errors.push({ code: 'E-UNPARSED', file, line: e.line ?? 0, message: `INPUTS 파싱 실패: ${e.message}` })
    return specs
  }

  for (const def of defs) {
    const line = def.__line ?? lineOf(sf, inputsNode)
    const a = def.affordance || {}
    const omit = def.omit || []
    // makeInputSet 재현: label(항상) / placeholder(otp·omit 제외) / helperText(omit 제외)
    //                    + unitProp(단위 표기) + description(설명 줄) + bools(show* 불리언)
    const texts = [{ prop: 'label', layer: 'label', def: def.label, line }]
    if (!a.otp && !omit.includes('placeholder'))
      texts.push({ prop: 'placeholder', layer: 'placeholder', def: def.placeholder, line })
    if (!omit.includes('helperText')) texts.push({ prop: 'helperText', layer: 'helperText', def: def.helper, line })
    if (a.unit && def.unitProp) texts.push({ prop: def.unitProp, layer: def.unitProp, def: a.unit, line })
    if (def.description) texts.push({ prop: 'description', layer: 'description', def: def.description, line })

    const bools = (def.bools || []).map((b) => ({ ...b, line }))
    // INPUT 계열은 INSTANCE_SWAP을 열지 않는다 — 선행/후행 아이콘에 대응하는 ReactNode prop이 코드에 없다
    // (아이콘은 하드코딩된 장식이고, 여닫는 것만 showClear·showToggle BOOLEAN으로 열려 있다).
    const swaps = []

    const axes = (def.axes || []).map((n) => ({ name: n, values: ['false', 'true'], line }))
    if (def.sizeAxis) axes.unshift({ name: 'size', values: ['md', 'sm', 'lg'], line })

    // INPUTS 항목의 states는 INPUTS 배열 리터럴 자체에 이미 있다(evalNode(inputsNode)가 통째로 평가했다) —
    // docs.map(def => ({..., states: def.states}))을 되짚어갈 필요 없이 def.states를 그대로 쓴다.
    if (!Array.isArray(def.states)) {
      errors.push({
        code: 'E-UNPARSED-STATES',
        file,
        line,
        message: `INPUTS 항목 '${def.setName}'의 states가 배열이 아니다(문서 검증 불가) — INPUTS 정의를 확인하라.`,
      })
    }

    specs.push({
      setName: def.setName,
      file,
      line,
      origin: 'makeInputSet',
      axes,
      texts,
      bools,
      swaps,
      states: Array.isArray(def.states) ? def.states : undefined,
      autoGhost,
      ghostLine: line,
    })
  }
  return specs
}

/**
 * GENERATOR_FILES에 없는 생성기가 buildSet을 호출하면 그 세트는 "검사받지 않고" Figma에 그려진다.
 * 이게 categories.ts 분할이 새로 만든 실패 모드다: 세트를 새 파일로 옮기고 목록에 등록만 안 하면
 * 위반이 조용히 0으로 떨어진다(고쳐서가 아니라 안 봐서). 그래서 구조적으로 막는다.
 *
 * 선언(`function buildSet`)이 아니라 호출(CallExpression)만 센다 — lib/build-set.ts 정본은 잡히면 안 된다.
 */
function assertNoUnregisteredSets(root) {
  const errors = []
  const dir = join(root, 'figma-plugin', 'src', 'generators')
  const registered = new Set(GENERATOR_FILES.map((n) => `${n}.ts`))

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts') || registered.has(file)) continue
    const abs = join(dir, file)
    const sf = parseFile(abs)
    let hits = 0
    const visit = (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'buildSet') hits++
      ts.forEachChild(n, visit)
    }
    visit(sf)
    if (hits > 0) {
      errors.push({
        code: 'E-UNREGISTERED',
        file: `figma-plugin/src/generators/${file}`,
        line: 0,
        message:
          `buildSet 호출 ${hits}건이 있는데 GENERATOR_FILES에 없다 — 이 세트들은 네이밍 검사를 통째로 건너뛴다. ` +
          `scripts/lib/figma-sets.mjs의 GENERATOR_FILES에 '${file.replace(/\.ts$/, '')}'를 추가하라.`,
      })
    }
  }
  return errors
}

/**
 * lib/build-set.ts가 정본인 헬퍼들 — 생성기에 사본이 생기면 규약을 한 곳에서 강제할 수 없다.
 * `variantItem`도 여기 포함한다: 문서 states 검사(§verify-screen-props의 D1~D3)는 이 함수의 상태 오버라이드
 * 해석 규칙(resolveStateProps)을 전제로 세트 스펙과 대조한다. 사본이 생기면 그 사본의 states는
 * 검사 대상 밖에서 조용히 다른 규칙으로 렌더된다 — buildSet 사본이 유령 불리언을 재생산했던 것과 같은 병이다.
 */
const CANON_HELPERS = new Set(['buildSet', 'addTextProp', 'addBoolProp', 'addSwapProp', 'propKeys', 'variantItem'])

/**
 * 헬퍼 5번째 사본 차단.
 * 이 헬퍼들은 원래 categories/admin/site에 3벌씩 복붙돼 있었고, 그래서 `Show <prop>` 유령 불리언
 * 자동생성을 한 파일에서 고쳐도 나머지 사본이 계속 재생산했다 — 이번 네이밍 드리프트의 근본 원인이다.
 * 정본을 lib/build-set.ts 한 벌로 합쳤으니, 사본이 다시 생기는 것을 기계로 막는다.
 * (build-set.ts 헤더가 "CI가 grep으로 막는다"고 약속한 가드의 실제 구현부다.)
 */
function assertNoHelperCopies(root) {
  const errors = []
  const dir = join(root, 'figma-plugin', 'src', 'generators')

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts')) continue // lib/ 디렉터리(정본)는 여기서 걸리지 않는다
    const abs = join(dir, file)
    const sf = parseFile(abs)
    for (const st of sf.statements) {
      if (!ts.isFunctionDeclaration(st) || !st.name || !CANON_HELPERS.has(st.name.text)) continue
      errors.push({
        code: 'E-HELPER-COPY',
        file: `figma-plugin/src/generators/${file}`,
        line: lineOf(sf, st),
        message:
          `'${st.name.text}' 사본 — 정본은 figma-plugin/src/generators/lib/build-set.ts 한 벌뿐이다. ` +
          `사본을 만들면 네이밍 규약을 한 곳에서 강제할 수 없다(사본이 위반을 계속 재생산한다). ` +
          `삭제하고 import하라. 생성기별로 다른 동작이 필요하면 정본에 옵션 파라미터를 추가하라.`,
      })
    }
  }
  return errors
}

/**
 * icons-data.ts(정본 ICON_PATHS)의 키 전체 — 유일하게 유효한 INSTANCE_SWAP 아이콘 키 집합.
 * 런타임(build-set.ts의 resolveStateProps · icon-vec.ts의 ICON_COMPONENTS)이 `ICON_COMPONENTS.get(raw)`로
 * 대조하는 것과 **같은 목록**이다 — ICON_COMPONENTS는 이 파일의 키마다 하나씩 채워진다(foundations.ts
 * generateIconSystemPage: `Object.keys(ICON_PATHS)`). verify-parity.mjs도 같은 파일을 기준으로 아이콘
 * 패리티(298개)를 본다 — 여기서 새 목록을 만들지 않고 그 원본을 다시 읽는다.
 */
export function getValidIconKeys(root) {
  const src = readFileSync(join(root, 'figma-plugin', 'src', 'icons-data.ts'), 'utf8')
  const keys = new Set()
  const re = /"(_Icon\/[^"]+)"\s*:/g
  let m
  while ((m = re.exec(src))) keys.add(m[1])
  return keys
}

// ── 메인 추출 ────────────────────────────────────────────────────────
/**
 * 정본 생성기들을 AST로 읽어 FigmaSpec[]과 오류를 반환한다.
 * @returns {{ specs: FigmaSpec[], errors: Array<{code,file,line,message}> }}
 */
export function extractFigmaSets(root) {
  const specs = []
  const errors = []

  // 등록 안 된 생성기에 buildSet이 숨어 있으면 여기서 잡는다(분할이 만든 새 실패 모드).
  errors.push(...assertNoUnregisteredSets(root))
  // 정본 헬퍼의 사본이 되살아나면 여기서 잡는다.
  errors.push(...assertNoHelperCopies(root))

  // 유령 불리언 자동생성은 이제 "전역" 성질이다 — buildSet 본문이 lib에 한 벌뿐이기 때문.
  // 생성기 본문(과거 사본 잔재)도 계속 보되, 정본을 반드시 함께 본다.
  const libAutoGhost = GHOST_RE.test(readFileSync(join(root, ...BUILD_SET_LIB), 'utf8'))

  for (const name of GENERATOR_FILES) {
    const rel = `figma-plugin/src/generators/${name}.ts`
    const abs = join(root, 'figma-plugin', 'src', 'generators', `${name}.ts`)
    const src = readFileSync(abs, 'utf8')
    const sf = parseFile(abs)
    const evalNode = makeEvaluator(sf, abs)

    const autoGhost = libAutoGhost || GHOST_RE.test(src)

    if (name === INPUT_ADAPTER_FILE) {
      const stale = checkInputAdapterFresh(src)
      if (stale) errors.push({ code: 'E-ADAPTER-STALE', file: rel, line: 0, message: stale })
      specs.push(...expandInputs(sf, evalNode, rel, errors, autoGhost))
    }

    // 함수 선언 인덱스 — 팩토리(krFieldDoc 등)의 호출부를 찾기 위해 필요하다.
    const fnDecls = new Map()
    const collectFns = (n) => {
      if (ts.isFunctionDeclaration(n) && n.name) fnDecls.set(n.name.text, n)
      ts.forEachChild(n, collectFns)
    }
    collectFns(sf)

    let callCount = 0
    let extracted = 0
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'buildSet') {
        // makeInputSet 안의 buildSet은 어댑터가 이미 8종으로 전개했다 — 중복 집계 금지.
        const owner = enclosingFunction(node)
        if (!owner || owner.name?.text !== 'makeInputSet') {
          callCount++
          const line = lineOf(sf, node)
          try {
            // 팩토리 안의 buildSet(krFieldDoc/krBespokeDoc)은 호출부마다 실제 세트가 하나씩 생긴다.
            // 파라미터를 호출부 인자로 바인딩해 인스턴스화한다 — 안 하면 30개 세트를 통째로 놓친다.
            const envs = bindFactoryEnvs(owner, node, sf, fnDecls, evalNode)
            for (const { env, fnEnv } of envs) {
              const spec = parseBuildSetCall(node, sf, evalNode, rel, line, autoGhost, env, fnDecls, fnEnv)
              // 문서(variantItem)가 그리는 states — buildSet과 같은 doc 리터럴 옆에 선언되므로
              // setName은 이미 맞아떨어진다. 남은 위험은 그 안의 props/texts/swaps 이름·값이다(아래 검사기 D1~D3).
              resolveDocStates(spec, node, owner, env, sf, evalNode, src, rel, errors)
              specs.push(spec)
            }
            extracted++
          } catch (e) {
            if (e instanceof UnparsedError) {
              errors.push({
                code: 'E-UNPARSED',
                file: rel,
                line: e.line || line,
                message: `buildSet 인자 파싱 실패 (${e.message}) — ${e.snippet}`,
              })
            } else throw e
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)

    // 커버리지 가드 — 파서가 조용히 놓치는 걸 막는 안전핀.
    if (callCount !== extracted) {
      errors.push({
        code: 'E-COVERAGE',
        file: rel,
        line: 0,
        message: `buildSet 호출 ${callCount}건 중 ${extracted}건만 추출됨 (${callCount - extracted}건 누락)`,
      })
    }
  }

  // 유령 불리언 모델링 — buildSet이 texts마다 만들어내는 `Show <prop>`.
  for (const s of specs) {
    s.derivedBools = (s.autoGhost ? s.texts : []).map((t) => ({
      name: `Show ${t.prop}`,
      line: s.ghostLine ?? s.line,
    }))
  }

  return { specs, errors }
}

function enclosingFunction(node) {
  let p = node.parent
  while (p) {
    if (ts.isFunctionDeclaration(p)) return p
    p = p.parent
  }
  return null
}

/**
 * buildSet이 팩토리 함수 안에 있으면 그 함수의 호출부마다 파라미터를 바인딩한 env를 만든다.
 * 팩토리가 아니면 빈 env 하나(=직접 호출).
 *
 * @returns {{ env: Map<string, any>, fnEnv: Map<string, string> }[]}
 *   env — 값으로 평가 가능한 파라미터(axes·props 등). fnEnv — 값으로 평가할 수 없어 버려지던
 *   함수 참조 파라미터(render)의 **식별자 이름**만 기억해 둔 것. N7이 buildSet의 render 인자를
 *   따라가 실제 렌더 함수(fnDecls에서 이 이름으로 찾는다) 본문의 content 프레임을 보려면 필요하다.
 */
function bindFactoryEnvs(owner, callNode, sf, fnDecls, evalNode) {
  if (!owner || !owner.name || owner.parameters.length === 0) return [{ env: new Map(), fnEnv: new Map() }]

  // buildSet 인자가 팩토리 파라미터를 실제로 참조하는가?
  const params = owner.parameters
    .filter((p) => ts.isIdentifier(p.name))
    .map((p) => p.name.text)
  const argText = callNode.arguments.map((a) => a.getText(sf)).join(' ')
  const usesParam = params.some((p) => new RegExp(`\\b${p}\\b`).test(argText))
  if (!usesParam) return [{ env: new Map(), fnEnv: new Map() }]

  // 팩토리 호출부 수집
  const fnName = owner.name.text
  const results = []
  const findCalls = (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === fnName &&
      enclosingFunction(n) !== owner
    ) {
      const env = new Map()
      const fnEnv = new Map()
      owner.parameters.forEach((p, i) => {
        if (!ts.isIdentifier(p.name)) return
        const arg = n.arguments[i]
        if (!arg) return
        try {
          env.set(p.name.text, evalNode(arg, new Map()))
        } catch {
          // 렌더 콜백(render 파라미터) 등은 buildSet 인자 평가에 쓰이지 않으므로 값으로는 미해석이어도
          // 무방하다 — 다만 인자가 함수 식별자(krBespokeDoc(..., renderTplAdminShell, ...)의 renderTplAdminShell)면
          // 그 이름만이라도 남겨 둔다. N7이 render 파라미터를 따라 실제 함수를 찾을 때 쓴다.
          if (ts.isIdentifier(arg)) fnEnv.set(p.name.text, arg.text)
        }
      })
      results.push({ env, fnEnv })
    }
    ts.forEachChild(n, findCalls)
  }
  findCalls(sf)

  if (results.length === 0) {
    throw new UnparsedError(`팩토리 ${fnName}의 호출부를 찾지 못함`, callNode, sf)
  }
  return results
}

/**
 * buildSet의 5번째 인자(render 콜백)가 가리키는 실제 렌더 함수 선언을 찾는다.
 * 지원하는 형태: `(c) => renderXxx(ctx, c)` · `(c) => { return renderXxx(ctx, c) }` · `renderXxx`(직접 참조).
 * 콜백이 팩토리 파라미터(krBespokeDoc의 `render`처럼 값을 알 수 없는 식별자)를 그대로 호출하면
 * fnEnv에서 호출부가 실제로 넘긴 함수 이름을 되짚는다(bindFactoryEnvs 참고).
 * 못 찾으면 null — N7은 이걸 "모른다"로 취급하고 기존 규칙(선언된 texts/bools/swaps)으로만 판정한다
 * (추측해서 통과시키지 않는다).
 */
function resolveRenderFnNode(argNode, fnDecls, fnEnv) {
  if (!argNode) return null
  const calleeOf = (expr) => (expr && ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) ? expr.expression.text : null)

  let calleeName = null
  if (ts.isArrowFunction(argNode) || ts.isFunctionExpression(argNode)) {
    const body = argNode.body
    if (ts.isCallExpression(body)) calleeName = calleeOf(body)
    else if (ts.isBlock(body)) {
      for (const stmt of body.statements) {
        if (ts.isReturnStatement(stmt) && stmt.expression) {
          calleeName = calleeOf(stmt.expression)
          if (calleeName) break
        }
      }
    }
  } else if (ts.isIdentifier(argNode)) {
    calleeName = argNode.text
  }
  if (!calleeName) return null
  if (fnEnv.has(calleeName)) calleeName = fnEnv.get(calleeName)
  return fnDecls.get(calleeName) ?? null
}

const isStrLit = (x) => !!x && (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x))

/**
 * 렌더 함수 본문에 규약 §7의 슬롯 레이어(name='content')를 실제로 만드는 코드가 있는가.
 * 두 관용구만 인정한다(이 저장소에서 'content'로 이름 붙이는 실제 두 가지 방식뿐 — 추측 없음):
 *   (1) `<node>.name = 'content'` 대입
 *   (2) `autoFrame('content', …)` · `fixedFrame('content', …)` 처럼 이름이 'Frame'으로 끝나는
 *       프레임 생성 헬퍼의 첫 인자가 문자열 리터럴 'content'
 * N7(slot-missing)은 지금까지 buildSet의 texts/bools/swaps 선언(=Figma 컴포넌트 *속성*에 바인딩된
 * 레이어)만 보고 렌더 함수가 그리는 실제 프레임 이름은 보지 못했다 — children 슬롯은 속성에
 * 바인딩되지 않는 빈 자리표시 프레임(SiteSection처럼)일 수 있으므로 그 경로를 놓쳤다.
 */
function detectContentFrame(argNode, fnDecls, fnEnv) {
  const fnNode = resolveRenderFnNode(argNode, fnDecls, fnEnv)
  if (!fnNode || !fnNode.body) return false
  let found = false
  const visit = (n) => {
    if (found) return
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      if (ts.isPropertyAccessExpression(n.left) && n.left.name.text === 'name' && isStrLit(n.right) && n.right.text === 'content') {
        found = true
        return
      }
    }
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && /Frame$/.test(n.expression.text)) {
      const a0 = n.arguments[0]
      if (isStrLit(a0) && a0.text === 'content') {
        found = true
        return
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(fnNode.body)
  return found
}

function parseBuildSetCall(node, sf, evalNode, file, line, autoGhost, env = new Map(), fnDecls = new Map(), fnEnv = new Map()) {
  const args = node.arguments
  // buildSet(ctx, page, setName, axes, render, props?)
  if (args.length < 4) throw new UnparsedError('buildSet 인자 수 부족', node, sf)

  const setName = evalNode(args[2], env)
  if (typeof setName !== 'string') throw new UnparsedError('setName이 문자열이 아님', args[2], sf)

  const rawAxes = evalNode(args[3], env)
  if (!Array.isArray(rawAxes)) throw new UnparsedError('axes가 배열이 아님', args[3], sf)
  const axes = rawAxes.map((a) => ({ name: a.name, values: a.values, line: a.__line ?? lineOf(sf, args[3]) }))

  let texts = []
  let bools = []
  let swaps = []
  if (args[5]) {
    const props = evalNode(args[5], env)
    // 6번째 인자가 있는데 평가 결과가 없다 = 우리가 못 읽은 것이다.
    // 조용히 {} 로 넘기면 그 세트의 TEXT/BOOLEAN/SWAP 속성이 검증에서 통째로 빠진다
    // (= 안 봐서 통과). 그래서 크래시 대신 '파싱 실패'로 시끄럽게 보고한다.
    if (props == null || typeof props !== 'object') {
      throw new UnparsedError('buildSet의 props 인자를 평가하지 못함', args[5], sf)
    }
    const at = (x) => x.__line ?? lineOf(sf, args[5])
    texts = (props.texts || []).map((t) => ({ prop: t.prop, layer: t.layer, def: t.def, line: at(t) }))
    bools = (props.bools || []).map((b) => ({ prop: b.prop, layer: b.layer, def: b.def, line: at(b) }))
    swaps = (props.swaps || []).map((s) => ({ prop: s.prop, layer: s.layer, defKey: s.defKey, line: at(s) }))
  }

  const hasContentFrame = detectContentFrame(args[4], fnDecls, fnEnv)

  return { setName, file, line, origin: 'buildSet', axes, texts, bools, swaps, autoGhost, ghostLine: line, hasContentFrame }
}

// ── 문서(variantItem) states — 세 번째 사고를 미리 막는 자리 ──────────────────────
// variantItem(ctx, set, state)의 state.props/texts/swaps는 build-set.ts의 resolveStateProps가
// **표시 이름으로** 세트에 되묻는다. 이름이 없거나(오타) 값이 틀리면(없는 축 값 · 'true'/'false'가 아닌 불리언)
// 경고만 남기고 그 오버라이드가 조용히 사라진다 — inst()가 화면에서 저지르는 것과 완전히 같은 실패 모드다.
// states는 buildSet 호출과 **같은 doc 리터럴**에 선언되므로(예: `{ setName: 'DS/X', build: ..., states: [...] }`)
// setName을 다시 맞출 필요가 없다 — 이 buildSet 호출 노드의 조상에서 그대로 찾는다.

/** buildSet 호출 노드의 조상 중 첫 ObjectLiteralExpression에서 `states` 프로퍼티의 초기화식 노드를 찾는다. */
function findSiblingStatesNode(node) {
  let p = node.parent
  while (p) {
    if (ts.isObjectLiteralExpression(p)) {
      for (const pr of p.properties) {
        if (ts.isPropertyAssignment(pr) && (ts.isIdentifier(pr.name) || ts.isStringLiteral(pr.name)) && pr.name.text === 'states') {
          return pr.initializer
        }
        if (ts.isShorthandPropertyAssignment(pr) && pr.name.text === 'states') {
          return pr.name
        }
      }
      return null // 가장 가까운 객체 리터럴에 states가 없다 — 더 올라가지 않는다(엉뚱한 조상을 줍지 않는다).
    }
    p = p.parent
  }
  return null
}

/**
 * krFieldDoc 하나만 예외다: states가 팩토리 파라미터가 아니라 **함수 본문에서 조건부로 조립되는 로컬 변수**라
 * 정적 평가기가 식별자를 못 푼다(모듈 상수도, 파라미터도 아니다). makeInputSet의 checkInputAdapterFresh와
 * 같은 방식으로 대응한다 — 로직을 여기 재현하고, 원본이 바뀌면 지문이 어긋나 E-ADAPTER-STALE로 실패시킨다.
 * (다른 팩토리가 이렇게 states를 로컬로 조립하면 이 예외를 타지 않고 E-UNPARSED-STATES로 실패한다 — 조용히 넘기지 않는다.)
 */
const KR_FIELD_DOC_FACTORY = 'krFieldDoc'
const KR_FIELD_DOC_FINGERPRINT = [
  "conststates:State[]=[{caption:'Default',props:{}}]",
  "if(opts.success)states.push({caption:'Success',props:{success:'true'}})",
  "if(opts.error)states.push({caption:'Error',props:{error:'true'}})",
  "states.push({caption:'Disabled',props:{disabled:'true'}})",
]
function checkKrFieldDocFresh(src) {
  const m = src.match(/function krFieldDoc\([\s\S]*?\n\}/)
  if (!m) return 'krFieldDoc 함수 선언을 찾지 못함'
  const norm = m[0].replace(/\s+/g, '')
  for (const probe of KR_FIELD_DOC_FINGERPRINT) {
    if (!norm.includes(probe.replace(/\s+/g, ''))) {
      return `krFieldDoc의 states 파생 규칙이 바뀐 듯하다 — scripts/lib/figma-sets.mjs의 reproduceKrFieldDocStates를 함께 고쳐라 (누락 지문: ${probe})`
    }
  }
  return null
}
/** krFieldDoc 본문의 states 조립 로직 재현(위 지문이 그 원본과 여전히 같음을 보장한다). */
function reproduceKrFieldDocStates(opts) {
  const states = [{ caption: 'Default', props: {} }]
  if (opts?.success) states.push({ caption: 'Success', props: { success: 'true' } })
  if (opts?.error) states.push({ caption: 'Error', props: { error: 'true' } })
  states.push({ caption: 'Disabled', props: { disabled: 'true' } })
  return states
}

/**
 * buildSet 호출 하나에 대응하는 문서 states를 찾아 evaluate해 spec.states에 붙인다.
 * 못 찾거나 못 읽으면 **spec.states를 비운 채 조용히 넘기지 않는다** — errors에 올려 게이트가 exit 1로 잡게 한다
 * (checkInputAdapterFresh·E-COVERAGE와 같은 원칙: 검사하지 않은 것을 통과로 세지 않는다).
 */
function resolveDocStates(spec, node, owner, env, sf, evalNode, src, rel, errors) {
  const statesNode = findSiblingStatesNode(node)
  if (!statesNode) {
    errors.push({
      code: 'E-UNPARSED-STATES',
      file: rel,
      line: spec.line,
      message: `'${spec.setName}' — buildSet 호출과 같은 자리에서 states 프로퍼티를 찾지 못했다(문서 states 검증 불가).`,
    })
    return
  }
  try {
    const result = evalNode(statesNode, env)
    // evalNode가 던지지 않고도 배열이 아닌 값(undefined·객체·스칼라)을 돌려줄 수 있다 — 삼항이나 조건부 표현식이
    // 정적 평가기가 다루지 못하는 형태로 접히는 경우. 여기서 조용히 넘기면 verify-screen-props.mjs의
    // `if (!Array.isArray(spec.states)) continue`가 이 세트의 문서 states 검사를 통째로 건너뛰고, 그 스킵은
    // 아무 로그도 남기지 않는다 — expandInputs(위)가 이미 잡는 것과 같은 실패 모드이므로 같은 기준으로 실패시킨다.
    if (!Array.isArray(result)) {
      errors.push({
        code: 'E-UNPARSED-STATES',
        file: rel,
        line: spec.line,
        message: `'${spec.setName}' — states 평가 결과가 배열이 아니다(${typeof result}). 문서 states 검증을 건너뛸 수 없다.`,
      })
      return
    }
    spec.states = result
    return
  } catch (e) {
    if (owner?.name?.text === KR_FIELD_DOC_FACTORY) {
      const stale = checkKrFieldDocFresh(src)
      if (stale) {
        errors.push({ code: 'E-ADAPTER-STALE', file: rel, line: spec.line, message: stale })
        return
      }
      spec.states = reproduceKrFieldDocStates(env.get('opts'))
      return
    }
    errors.push({
      code: 'E-UNPARSED-STATES',
      file: rel,
      line: spec.line,
      message:
        `'${spec.setName}' — states 파싱 실패 (${e.message ?? e}). 팩토리 로컬 변수는 정적 평가기가 못 읽는다 — ` +
        `makeInputSet·krFieldDoc처럼 재현 + 지문가드를 scripts/lib/figma-sets.mjs에 추가하라.`,
    })
  }
}
