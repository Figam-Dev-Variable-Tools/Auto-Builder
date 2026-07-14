import type { ReactNode } from 'react'
import {
  mergeLabels,
  resolveLabel,
  type Formatters,
  type SearchLabels,
  type TotalLabels,
} from '../../shared/labels'
import { Select, type SelectOption } from '../Select/Select'
import { SearchField } from '../SearchField/SearchField'
import styles from './ListToolbar.module.css'

/**
 * ListToolbar — 목록 상단 바. `layout` 축으로 두 화면 맥락을 아우른다.
 *
 *  - layout='admin'(기본) : 어드민 목록 상단의 흰 카드 바.
 *    레퍼런스: "전체 상태 ▾ | 검색 | ………… | 순번순 ▾ | 2건"
 *  - layout='site'        : 공개 사이트(쇼핑 등) 목록 상단의 테두리 없는 바(구 SortBar 흡수).
 *    레퍼런스: 좌 "전체 6개" · 우 [leadingActions][Select…][actions]. 카드 크롬이 없고
 *    총계가 좌측에 선다 — admin과 시각 언어가 달라 렌더 분기가 따로지만, prop 타입과
 *    파일은 하나다(SortBar.tsx는 이제 이 layout='site' 분기에 위임하는 얇은 파사드).
 *
 * 드롭다운은 기존 Select, 검색은 기존 SearchField(leading 아이콘)를 그대로 쓴다 — 새로 만들지 않는다.
 * 요소 단위 ON/OFF: prop을 넘기지 않으면 그 요소가 통째로 사라진다(빈 자리·구분선 없음).
 * 아무 요소도 없으면(admin) 카드 자체를 렌더하지 않는다.
 */
export type ListToolbarSelect = {
  /** React key 겸 식별자 */
  key: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  /** 트리거 폭(px) — 옵션 라벨이 길면 넓힌다. 기본 140 */
  width?: number
  /** 트리거의 접근성 이름 — 라벨이 없는 툴바 Select라 필터마다 이름이 다르다(항목이 들고 있는다) */
  ariaLabel?: string
}

export type ListToolbarSearch = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /**
   * Enter 확정 — SearchField가 이미 가진 축을 그대로 통과시킨다.
   * 없으면 목록들이 툴바를 감싼 div에서 keydown을 주워 담는 우회로를 만들게 된다(실제로 그랬다).
   */
  onSearch?: (value: string) => void
  /** 로딩 중 입력 잠금 */
  disabled?: boolean
}

export type ListToolbarSort = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  /** 트리거 폭(px) — 정렬 라벨이 길면 넓힌다. 기본 140(필터 Select와 같은 축) */
  width?: number
  /** 트리거의 접근성 이름 — 기본은 없다(선택된 옵션 라벨이 곧 이름이다) */
  ariaLabel?: string
}

/**
 * 툴바 문구.
 *
 * search는 SearchLabels 전체가 아니라 이 툴바가 실제로 그리는 것만 받는다 —
 * 초기화·검색 버튼은 여기 없다(그건 SearchPanel·FilterBar다).
 * search.search는 검색 입력의 접근성 이름으로 SearchField.ariaLabel까지 그대로 내려간다.
 */
export type ListToolbarLabels = {
  search?: Pick<SearchLabels, 'search' | 'searchPlaceholder'>
  total?: TotalLabels
}

type ListToolbarLabelsResolved = {
  search: Required<Pick<SearchLabels, 'searchPlaceholder'>> & Pick<SearchLabels, 'search'>
  total: Required<Pick<TotalLabels, 'prefix' | 'unit'>> & Pick<TotalLabels, 'count'>
}

export const DEFAULT_LIST_TOOLBAR_LABELS: ListToolbarLabelsResolved = {
  search: { searchPlaceholder: '검색어를 입력하세요' },
  total: {
    // 접두사 없음이 기본이다 — 지금까지 totalLabel을 주지 않으면 숫자만 나왔다(기본 렌더 유지)
    prefix: null,
    unit: '건',
  },
}

/**
 * layout='site'(구 SortBar 흡수)의 총계 기본값 — admin과 갈라진다.
 * 구 SortBar는 접두사 '전체'·단위 '개'를 컴포넌트에 하드코딩했다(admin의 기본은 접두사 없음·단위 '건').
 * 두 레이아웃이 같은 total.prefix/unit 축을 공유하는 이상 기본값도 갈라질 수밖에 없어
 * DEFAULT_LIST_TOOLBAR_LABELS와 분리된 이름 있는 상수로 둔다(§3 naive spread 금지와 같은 이유 —
 * 하나의 기본값 객체에 두 값을 우겨넣으면 어느 레이아웃 것인지 코드만 봐서는 알 수 없다).
 */
const DEFAULT_SITE_TOTAL_PREFIX = '전체'
const DEFAULT_SITE_TOTAL_UNIT = '개'

export type ListToolbarProps = {
  /**
   * 바 레이아웃(기본 'admin'). 'site'는 카드 크롬 없는 좌측 총계 + 우측 컨트롤 배치다(구 SortBar).
   * 'site'에서는 search·sort·appearance가 쓰이지 않는다 — selects가 우측 컨트롤에 전부 들어간다.
   */
  layout?: 'admin' | 'site'
  /** 좌측 필터 Select들 — 상태·카테고리 등. layout='site'에서는 우측 컨트롤에 렌더된다(구 SortBar.selects) */
  selects?: ListToolbarSelect[]
  /** 좌측 검색 입력 */
  search?: ListToolbarSearch
  /** 우측 정렬 Select */
  sort?: ListToolbarSort
  /** 우측 총 건수 — 숫자는 tabular-nums로 폭이 흔들리지 않는다 */
  total?: number
  /**
   * 건수 앞 문구 — "총 24건", "전체 사용자 495명"처럼 목록마다 다른 접두사를 붙인다.
   * 없으면 숫자만 나온다(기존 동작).
   * @deprecated labels.total.prefix를 쓴다. 하위호환으로 유지되며, 넘기면 labels보다 우선한다.
   */
  totalLabel?: string
  /**
   * 건수 단위. 기본 '건' → "2건"
   * @deprecated labels.total.unit을 쓴다. 하위호환으로 유지되며, 넘기면 labels보다 우선한다.
   */
  totalUnit?: string
  /** 우측 끝 추가 액션(등록 버튼·내보내기 등) */
  actions?: ReactNode
  /**
   * 총계 뒤 문장형 문구 — "총 24개**의 상품이 있습니다.**"의 굵지 않은 꼬리말.
   * layout='site' 전용(구 SortBar.totalSuffix). 기본 ''(꼬리말 없음).
   */
  totalSuffix?: string
  /**
   * 총계 옆 · selects 왼쪽에 붙는 선행 액션(뷰 전환 등). layout='site' 전용(구 SortBar.leadingActions).
   */
  leadingActions?: ReactNode
  /**
   * 총 건수 표시 (기본 true).
   * 목록 하단 Pagination이 이미 건수를 말하고 있으면 같은 숫자가 두 번 나오므로 끈다 —
   * total을 undefined로 바꾸지 않고 표시만 멈춘다(집계는 그대로 쓰는 화면이 있다).
   */
  showCount?: boolean
  /**
   * 검색 입력 플레이스홀더 (기본 '검색어를 입력하세요').
   * search.placeholder를 각 항목마다 주지 않고 툴바 전체의 기본 문구만 갈아 끼울 때 쓴다
   * (search.placeholder가 있으면 그쪽이 이긴다).
   * @deprecated labels.search.searchPlaceholder를 쓴다. 하위호환으로 유지되며, 넘기면 labels보다 우선한다.
   */
  searchPlaceholder?: string
  /**
   * 카드 크롬(흰 면 + 1px 보더 + 패딩). 기본 card.
   * 이미 카드 안(AdminListView.toolbar 슬롯)에 넣을 때 plain으로 껍데기를 벗겨 테두리가 겹치지 않게 한다.
   */
  appearance?: 'card' | 'plain'
  /** 문구 — 개별 prop(totalLabel·totalUnit·searchPlaceholder)이 있으면 그쪽이 이긴다 */
  labels?: ListToolbarLabels
  /** 건수 표기 — 1,234를 1.234로 쓰는 것은 문구가 아니라 포맷이다 */
  formatters?: Formatters
}

/** Select 트리거 기본 폭 — '전체 상태' 같은 라벨이 말줄임 없이 들어가는 최소 폭 */
const DEFAULT_SELECT_WIDTH = 140

export function ListToolbar({
  layout = 'admin',
  selects = [],
  search,
  sort,
  total,
  totalLabel,
  totalUnit,
  totalSuffix = '',
  actions,
  leadingActions,
  showCount = true,
  searchPlaceholder,
  appearance = 'card',
  labels,
  formatters,
}: ListToolbarProps) {
  // admin·site 두 분기가 같은 포맷터를 쓴다 — 여기 한 번만 만든다
  const formatNumber = formatters?.number ?? ((value: number) => value.toLocaleString('ko-KR'))

  // ── layout='site' — 구 SortBar 흡수. admin과 시각 언어·배치가 달라 렌더 분기를 따로 둔다
  //    (섹션 면 위에 그대로 얹히는 카드 없는 바 · 총계가 좌측 · selects/leadingActions/actions가
  //    하나의 우측 컨트롤 묶음). 값은 그대로 admin과 같은 축(totalLabel·totalUnit·labels.total…)을 쓴다.
  if (layout === 'site') {
    // resolveLabel은 null을 "명시적으로 접두사 없음"으로 존중한다 — undefined일 때만 구 SortBar 기본값을 쓴다
    const rawPrefix = resolveLabel<string | null>(totalLabel, labels?.total?.prefix)
    const resolvedSitePrefix = rawPrefix === undefined ? DEFAULT_SITE_TOTAL_PREFIX : rawPrefix
    // 구 SortBar는 "개"를 컴포넌트에 하드코딩했다 — 이제 축(labels.total.unit)으로 열되 기본값은 그대로 유지한다
    const resolvedSiteUnit = resolveLabel(totalUnit, labels?.total?.unit) ?? DEFAULT_SITE_TOTAL_UNIT
    const siteCountFn = labels?.total?.count
    const siteCountVisible = showCount && total != null

    return (
      <div className={styles.siteBar}>
        {siteCountVisible &&
          (siteCountFn != null ? (
            <p className={styles.siteTotal}>{siteCountFn(total as number)}</p>
          ) : (
            <p className={styles.siteTotal}>
              {resolvedSitePrefix != null && `${resolvedSitePrefix} `}
              {/* 구 SortBar는 "개"까지 굵게 묶었다(<strong>{count}개</strong>) — 그 굵기 경계를 그대로 둔다 */}
              <strong className={styles.siteCount}>
                {formatNumber(total as number)}
                {resolvedSiteUnit}
              </strong>
              {totalSuffix}
            </p>
          ))}

        <div className={styles.siteControls}>
          {leadingActions}
          {selects.map((select) => (
            <div key={select.key} className={styles.siteSelect}>
              <Select
                value={select.value}
                options={select.options}
                onChange={select.onChange}
                ariaLabel={select.ariaLabel}
              />
            </div>
          ))}
          {actions}
        </div>
      </div>
    )
  }

  const L = mergeLabels(DEFAULT_LIST_TOOLBAR_LABELS, labels)

  const resolvedPlaceholder =
    resolveLabel(searchPlaceholder, L.search.searchPlaceholder) ??
    DEFAULT_LIST_TOOLBAR_LABELS.search.searchPlaceholder
  // prefix의 기본값은 null(접두사 없음)이라 ??로 접으면 안 된다 — resolveLabel이 null을 값으로 존중한다
  const resolvedPrefix = resolveLabel<string | null>(totalLabel, L.total.prefix) ?? null
  const resolvedUnit = resolveLabel(totalUnit, L.total.unit) ?? DEFAULT_LIST_TOOLBAR_LABELS.total.unit

  const countVisible = showCount && total != null

  const hasLeft = selects.length > 0 || search != null
  // 건수를 끄면 우측이 통째로 빌 수 있다 — 빈 우측 칸이 남지 않게 계산에 함께 넣는다
  const hasRight = sort != null || countVisible || actions != null

  // 켜진 요소가 하나도 없으면 빈 보더 카드가 남지 않게 통째로 제거한다
  if (!hasLeft && !hasRight) return null

  return (
    <div
      className={[styles.toolbar, appearance === 'plain' ? styles.plain : '']
        .filter(Boolean)
        .join(' ')}
    >
      {hasLeft && (
        <div className={styles.left}>
          {selects.map((select) => (
            <div
              key={select.key}
              className={styles.select}
              style={{ width: select.width ?? DEFAULT_SELECT_WIDTH }}
            >
              <Select
                value={select.value}
                options={select.options}
                onChange={select.onChange}
                ariaLabel={select.ariaLabel}
              />
            </div>
          ))}

          {search != null && (
            <div className={styles.search}>
              <SearchField
                value={search.value}
                onChange={search.onChange}
                // 라벨을 그릴 자리가 없는 툴바다 — 이름은 labels.search.search가 준다(없으면 붙지 않는다)
                ariaLabel={L.search.search}
                placeholder={search.placeholder ?? resolvedPlaceholder}
                onSearch={search.onSearch}
                disabled={search.disabled}
              />
            </div>
          )}
        </div>
      )}

      {hasRight && (
        <div className={styles.right}>
          {sort != null && (
            <div className={styles.select} style={{ width: sort.width ?? DEFAULT_SELECT_WIDTH }}>
              <Select
                value={sort.value}
                options={sort.options}
                onChange={sort.onChange}
                ariaLabel={sort.ariaLabel}
              />
            </div>
          )}

          {countVisible &&
            // count를 주면 문장 전체를 그 함수가 만든다(접두사·단위를 무시한다)
            (L.total.count != null ? (
              <p className={styles.total}>{L.total.count(total)}</p>
            ) : (
              <p className={styles.total}>
                {resolvedPrefix != null && `${resolvedPrefix} `}
                <strong className={styles.count}>{formatNumber(total)}</strong>
                {resolvedUnit}
              </p>
            ))}

          {actions}
        </div>
      )}
    </div>
  )
}
