#!/usr/bin/env node
/**
 * verify-bindings — "Figma에 생성되는 모든 요소가 정말 변수에 물려 있는가"
 *
 * 왜 이 게이트가 필요한가:
 *   `verify-parity` 는 **변수가 선언됐는지**만 대조한다(프리셋 3개 × 103개).
 *   그런데 버튼 하나가 raw hex 로 칠해져 있어도 그 검사는 초록이다.
 *   → 사용자가 플러그인 UI 에서 메인 컬러를 바꿔도 **그 버튼만 안 바뀐다.**
 *   "선언됐는가" 와 "요소가 그 변수에 물렸는가" 는 다른 질문이고, 아무도 후자를 묻지 않고 있었다.
 *   이건 이 저장소가 이미 두 번 당한 병이다 — **게이트가 안 보는 코드 경로.**
 *
 * 검사 규칙:
 *   B1  면·선을 raw 색으로 칠하지 마라        → `fills = [solid(…)]`  대신 `bindFillVar(ctx, node, 'color/…', fallback)`
 *       — `fills = [{ type: 'SOLID', color: {...} }]` 같은 **객체 리터럴 직접 대입**도 같은 하드코딩이다(잡는다).
 *         단 `figma.variables.setBoundVariableForPaint({...}, 'color', v)` 의 placeholder 리터럴은 바인딩이므로 제외.
 *   B2  텍스트를 미바인딩으로 만들지 마라      → `txt(…)` 대신 `boundText(…)` (색·크기·굵기·글씨체를 전부 변수에 문다)
 *   B3  폰트를 리터럴로 박지 마라              → `fontSize = 14` · `fontName = { family: 'Inter' }`
 *   B4  바인딩 헬퍼를 복제하지 마라            → 정본 1벌만. (복제되면 사본 하나만 고쳐지고 나머지는 썩는다 —
 *                                               `buildSet` 4벌 · `variantItem` 3벌에서 실제로 그랬다.)
 *   B5  텍스트 노드에 불투명도를 걸지 마라      → 리터럴(`x.opacity = 0.6`)뿐 아니라 삼항식·계산식
 *       (`x.opacity = cond ? a : b`) 도 우변이 **리터럴 1이 아니면** 잡는다 — 정적으로 항상 1임을 증명할 수 없다.
 *
 * ALLOWLIST 에는 **왜 면제인지**를 반드시 적는다. 사유 없는 면제는 부채가 아니라 거짓말이다.
 * 면제는 `file` 전체 또는 `file`+`line` 한 줄 단위로 걸 수 있다 — 한 파일에 진짜 위반과 정당한 예외가
 * 같이 있으면(예: ImageCard 스크림은 정당, 같은 파일의 CTA 오버레이는 진짜 위반) 파일 전체를 면제하면
 * 진짜 위반까지 가려진다. 그래서 `line` 이 있으면 그 줄에만 적용한다.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const GEN = join(root, 'figma-plugin', 'src', 'generators')

/** 바인딩 헬퍼의 정본이 사는 곳. 여기서만 정의될 수 있다. */
const CANON_FILES = ['lib/build-set.ts', 'lib/bind.ts', 'categories-shared.ts']
/** 정본이어야 하는 헬퍼 — 두 곳 이상에서 정의되면 B4 위반. */
const CANON_HELPERS = ['bindFillVar', 'bindStrokeVar', 'bindTokens', 'boundText', 'boundPaint', 'txt', 'variantItem', 'buildSet']

const ALLOWLIST = [
  {
    file: 'brand-logos.ts',
    rules: ['B1', 'B2', 'B3'],
    reason: '소셜 로고는 브랜드 색을 보존해야 한다 — 페이스북 파랑을 사용자 메인 컬러로 바꾸면 로고가 아니다. verify-parity 도 "fill 보존"으로 같은 판단을 한다.',
    kind: 'permanent',
  },
  {
    file: 'icon-vec.ts',
    rules: ['B1'],
    reason: '아이콘은 벡터 경로의 stroke 만 쓰고 색은 부모가 정한다 — 여기서 칠하는 것은 자리표시자다.',
    kind: 'permanent',
  },
  {
    file: 'tokens.ts',
    rules: ['B1', 'B3'],
    reason: '변수 자체를 만드는 파일이다. 여기의 hex 는 변수의 **값**이지 요소에 칠하는 색이 아니다.',
    kind: 'permanent',
  },
  {
    file: 'reset.ts',
    rules: ['B1', 'B2', 'B3'],
    reason: '페이지를 지우는 파일이라 요소를 그리지 않는다.',
    kind: 'permanent',
  },
  {
    file: 'categories-data-kr-media.ts',
    rules: ['B1'],
    line: 1565,
    reason:
      'ImageCard 오버레이 스크림(scrim="solid")은 테마와 무관하게 항상 어두워야 흰 글자 대비가 유지된다 — ' +
      'React 원본(src/ds/ImageCard/ImageCard.module.css:120-122)도 "테마와 무관하게 항상 어두워야 텍스트(흰색)가 ' +
      '읽히므로, 색 토큰이 아닌 알파 표현(rgb(0 0 0 / a))을 쓴다"고 명시하고 .scrimSolid를 raw rgb(0 0 0 / 0.45)로 ' +
      '고정한다. Figma를 색 변수에 물리면 사용자가 배경색을 밝게 바꿀 때 스크림이 옅어져 정확히 React가 피하려던 ' +
      '대비 붕괴가 재현된다 — 이건 미바인딩이 아니라 React와의 파리티다.',
    kind: 'permanent',
  },
]

const isAllowed = (file, rule, line) =>
  ALLOWLIST.some(
    (a) => file.endsWith(a.file) && a.rules.includes(rule) && (a.line === undefined || a.line === line),
  )

// ── 파일 수집 ────────────────────────────────────────────────────────────
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.name.endsWith('.ts')) out.push(p)
  }
  return out
}
const files = walk(GEN)

// ── 규칙 ────────────────────────────────────────────────────────────────
const RULES = [
  {
    code: 'B1',
    // `fills = [solid('#fff')]` — 변수를 거치지 않고 색을 직접 칠한다
    re: /(?:fills|strokes)\s*=\s*\[\s*solid\(/,
    msg: '면·선을 raw 색으로 칠했다 — 사용자가 컬러를 바꿔도 이 요소는 안 바뀐다',
    fix: "bindFillVar(ctx, node, 'color/<key>', fallbackHex) / bindStrokeVar(...) 를 써라",
  },
  {
    code: 'B3',
    re: /fontSize\s*=\s*\d|fontName\s*=\s*\{/,
    msg: '폰트를 리터럴로 박았다 — 사용자가 글씨체·크기를 바꿔도 이 요소는 안 바뀐다',
    fix: "boundText(ctx, chars, size, 'color/<key>', fallbackHex) 를 써라 (fontSize·fontWeight·fontFamily 를 전부 변수에 문다)",
  },
]

const violations = []

for (const abs of files) {
  const rel = relative(GEN, abs).replaceAll('\\', '/')
  const src = readFileSync(abs, 'utf8')
  const lines = src.split(/\r?\n/)
  const canon = CANON_FILES.includes(rel)

  /**
   * B5 준비: `<id>.opacity = …` 의 `<id>` 가 **텍스트 노드**인지 판정한다.
   * 같은 이름이 한 파일에서 여러 번 선언되므로(admin.ts 의 `ph` 는 921행에서 아이콘, 1675행에서 텍스트)
   * 파일 전역으로 모으면 오탐이 난다 → **가장 가까운 앞선 선언**을 찾아 판정한다.
   */
  const isTextNodeAt = (id, lineIdx) => {
    const decl = new RegExp(`(?:const|let)\\s+${id}\\b\\s*(?::[^=]*)?=\\s*(.*)$`)
    for (let i = lineIdx; i >= 0; i--) {
      const m = lines[i].match(decl)
      if (!m) continue
      // 텍스트로 만든 것 / TextNode 로 단언한 것 (`scrim.children[1] as TextNode`) 둘 다 텍스트다.
      return /^\s*(?:boundText|txt)\s*\(/.test(m[1]) || /\bas\s+TextNode\b|:\s*TextNode\b/.test(lines[i])
    }
    return false
  }

  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '') // 주석 제거 — 문서에 적는 것은 위반이 아니다
    if (!code.trim()) return

    for (const r of RULES) {
      if (!r.re.test(code)) continue
      // 정본 헬퍼 안에서는 폴백 경로가 필요하다 (변수가 없을 때만 raw 색을 쓴다)
      if (canon) continue
      if (isAllowed(rel, r.code, i + 1)) continue
      violations.push({ code: r.code, file: rel, line: i + 1, src: code.trim(), msg: r.msg, fix: r.fix })
    }

    // B1b: `fills = [{ type: 'SOLID', ... }]` / `return { type: 'SOLID', ... }` — solid() 헬퍼를
    // 거치지 않고 Paint 객체 리터럴을 직접 대입·반환한다. `solid(...)` 호출형만 보는 위 정규식의 사각지대다.
    // `figma.variables.setBoundVariableForPaint({...placeholder...}, 'color', v)` 의 placeholder 리터럴은
    // 그 자체가 바인딩 메커니즘(boundPaint()와 동일한 관용구, lib/bind.ts:20-22)이므로 제외한다 — 같은 줄이나
    // 바로 앞 줄에 열린 `setBoundVariableForPaint(` 가 있으면 그 안이다.
    if (!canon && /\{\s*type:\s*['"]SOLID['"]\s*,\s*color:/.test(code) && !isAllowed(rel, 'B1', i + 1)) {
      const boundOpen = /setBoundVariableForPaint\s*\(\s*$/
      const prev1 = lines[i - 1] ? lines[i - 1].replace(/\/\/.*$/, '') : ''
      const prev2 = lines[i - 2] ? lines[i - 2].replace(/\/\/.*$/, '') : ''
      const insideBoundCall = /setBoundVariableForPaint\s*\(/.test(code) || boundOpen.test(prev1) || boundOpen.test(prev2)
      if (!insideBoundCall) {
        violations.push({
          code: 'B1',
          file: rel,
          line: i + 1,
          src: code.trim(),
          msg: '면·선을 raw 색 객체 리터럴로 칠했다 — 사용자가 컬러를 바꿔도 이 요소는 안 바뀐다',
          fix:
            "bindFillVar(ctx, node, 'color/<key>', fallbackHex) 를 써라. 색은 유지하되 불투명도만 얹고 싶으면 " +
            "바인딩 후 스프레드하라: node.fills = [{ ...(node.fills[0] as SolidPaint), opacity }] " +
            '(categories-shared.ts의 overlayAlpha가 이 패턴이다).',
        })
      }
    }

    // B5: 텍스트 노드에 불투명도를 걸었다.
    // 오너: "폰트에 불투명도 적용되어있던데 그거 100%로 해야지."
    // 흐린 글자는 **불투명도가 아니라 색 토큰**으로 표현한다 — React 는 `--ds-color-secondary` 를 쓰고
    // 텍스트에 opacity 를 걸지 않는다. Figma 만 `color/secondary + opacity 0.6` 을 발명했다(screens.ts tMuted).
    // 불투명도를 쓰면 (a) 글자가 배경과 섞여 대비가 깨지고 (b) 사용자가 폰트 색을 바꿔도 흐림이 남는다.
    // 우변이 숫자 리터럴이 아니어도(삼항식·계산식) 정적으로 항상 1임을 증명할 수 없는 한 잡는다.
    if (!isAllowed(rel, 'B5', i + 1)) {
      const m = code.match(/([A-Za-z0-9_]+)\.opacity\s*=\s*([^;]+?);?\s*$/)
      if (m) {
        const rhs = m[1] && m[2] != null ? m[2].trim() : ''
        const isLiteral = /^[\d.]+$/.test(rhs)
        const provablyFull = isLiteral && Number(rhs) >= 1
        if (!provablyFull && isTextNodeAt(m[1], i)) {
          violations.push({
            code: 'B5',
            file: rel,
            line: i + 1,
            src: code.trim(),
            msg: isLiteral
              ? `텍스트 '${m[1]}' 에 불투명도 ${rhs} — 폰트는 100% 여야 한다`
              : `텍스트 '${m[1]}' 에 계산식 불투명도 '${rhs}' — 리터럴이 아니라 항상 1임을 증명할 수 없다`,
            fix: '불투명도를 지우고 **색 토큰**으로 표현하라 (예: color/secondary). React 는 텍스트에 opacity 를 쓰지 않는다.',
          })
        }
      }
    }

    // B2: 정본 밖에서 미바인딩 텍스트 헬퍼를 호출한다
    if (!canon && !isAllowed(rel, 'B2')) {
      const m = code.match(/(?:^|[^A-Za-z0-9_.])txt\(/)
      if (m && !/function\s+txt\(/.test(code)) {
        violations.push({
          code: 'B2',
          file: rel,
          line: i + 1,
          src: code.trim(),
          msg: '미바인딩 텍스트 — 색·크기·굵기·글씨체가 변수에 물리지 않는다',
          fix: 'boundText(...) 를 써라',
        })
      }
    }
  })
}

// ── B4: 헬퍼 복제 ────────────────────────────────────────────────────────
const defs = new Map() // helper → [file:line]
for (const abs of files) {
  const rel = relative(GEN, abs).replaceAll('\\', '/')
  readFileSync(abs, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const m = line.match(/^\s*(?:export\s+)?function\s+([A-Za-z0-9_]+)\s*\(/)
      if (!m || !CANON_HELPERS.includes(m[1])) return
      if (!defs.has(m[1])) defs.set(m[1], [])
      defs.get(m[1]).push(`${rel}:${i + 1}`)
    })
}
for (const [name, sites] of defs) {
  if (sites.length <= 1) continue
  violations.push({
    code: 'B4',
    file: sites[0].split(':')[0],
    line: Number(sites[0].split(':')[1]),
    src: `function ${name}(...)`,
    msg: `바인딩 헬퍼 '${name}' 이(가) ${sites.length}벌 복제됐다 — ${sites.join(' · ')}`,
    fix: 'lib/ 로 정본 1벌만 두고 나머지는 import 하라. (복제되면 사본 하나만 고쳐지고 나머지는 썩는다)',
  })
}

// ── 보고 ────────────────────────────────────────────────────────────────
const byCode = (c) => violations.filter((v) => v.code === c)
const LABEL = {
  B1: '미바인딩 면·선 (raw 색)',
  B2: '미바인딩 텍스트',
  B3: '하드코딩 폰트',
  B4: '복제된 바인딩 헬퍼',
  B5: '텍스트에 걸린 불투명도 (폰트는 100%여야 한다)',
}

if (violations.length === 0) {
  console.log(
    `verify-bindings OK — 생성기 ${files.length}개 · 미바인딩 0건\n` +
      `  UI 에서 고른 색·폰트가 생성되는 모든 요소에 실제로 물린다 (allowlist ${ALLOWLIST.length}건 적용)`,
  )
  process.exit(0)
}

console.error(`verify-bindings FAIL — 미바인딩 ${violations.length}건\n`)
for (const c of ['B4', 'B5', 'B1', 'B3', 'B2']) {
  const list = byCode(c)
  if (!list.length) continue
  console.error(`── ${c}: ${LABEL[c]} (${list.length}건) ──`)
  console.error(`   ${list[0].fix}`)
  const byFile = new Map()
  for (const v of list) {
    if (!byFile.has(v.file)) byFile.set(v.file, [])
    byFile.get(v.file).push(v)
  }
  for (const [file, vs] of byFile) {
    console.error(`   ${file} (${vs.length}건)`)
    for (const v of vs.slice(0, 3)) console.error(`     :${v.line}  ${v.src.slice(0, 88)}`)
    if (vs.length > 3) console.error(`     … 외 ${vs.length - 3}건`)
  }
  console.error('')
}
console.error(
  '색·폰트를 변수에 물리지 않으면, 사용자가 플러그인 UI 에서 메인/서브/에러/정상 컬러와 글씨체를 바꿔도\n' +
    '위 요소들은 **바뀌지 않는다**. 그게 이 게이트가 존재하는 이유다.',
)
process.exit(1)
