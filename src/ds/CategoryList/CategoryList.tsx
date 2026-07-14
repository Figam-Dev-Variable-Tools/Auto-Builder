import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  mergeLabels,
  resolveLabel,
  type ColumnLabels,
  type DeepPartialOneLevel,
  type EmptyLabels,
  type LabelFn,
  type RowScopedActionLabels,
  type SearchLabels,
  type TotalLabels,
} from '../../shared/labels'
import { Placeholder } from '../../shared/placeholders'
import styles from './CategoryList.module.css'
import { AdminListPage } from '../AdminListPage/AdminListPage'
import type { AdminBulkAction, AdminColumn, AdminTableLabels } from '../AdminTable/AdminTable'
import { Button } from '../Button/Button'
import type { CategoryTabItem } from '../CategoryTabs/CategoryTabs'
import { RowActions } from '../RowActions/RowActions'
import type { SelectOption } from '../Select/Select'

/*
 * CategoryList — 카테고리 관리(어드민). 골격(헤더·탭·툴바·검색·표·선택·일괄 처리·페이지네이션)은
 * AdminListPage(공용 셸)가 갖는다. 이 파일에 남는 건 컬럼 · 상태/정렬/브랜드 축 · 한국어 문구뿐이다
 * (CustomerList·HistoryList와 같은 결).
 *
 * 상태 필터(status)는 탭이 갖는다(전체/활성/비활성 — 같은 값을 매치 함수 하나로 rows에 적용한다).
 * 브랜드 필터는 툴바 Select 하나로 연다 — 옵션 기본값은 rows에 실제로 등장한 브랜드를 모아 만든다
 * (브랜드 값은 화면마다 다른 사전이라 고정 enum이 아니다). 드래그 재정렬은 정렬이 '순번순'일 때만 연다.
 */

/** 카테고리 한 줄 — 이름 앞 표식은 emoji > image > 대체 그림 순으로 하나만 쓴다 */
export type CategoryRow = {
  id: string
  /** 노출 순번(1부터) — 드래그로 바뀌면 onReorder가 다시 매긴 값을 돌려준다 */
  order: number
  name: string
  emoji?: string
  image?: string
  /** 이 카테고리를 등록한 브랜드 — 표에서 강조색 텍스트로 표시된다. 없으면 '-' */
  brand?: string
  description?: string
  /** 하위(2Depth) 개수 — 표의 '하위' 배지가 이 값을 보여준다. 없으면 0개 */
  childCount?: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  active: boolean
}

/** 상태 필터 — 탭이 쓰는 값이다 */
export type CategoryStatusFilter = 'all' | 'active' | 'inactive'

/** 정렬 키 — 순번순일 때만 드래그로 순서를 바꿀 수 있다 */
export type CategorySortKey = 'order' | 'name' | 'createdAt' | 'updatedAt'

/** 표 컬럼 — labels.columns의 키이자 AdminTable 컬럼 key */
export type CategoryColumnKey =
  | 'order'
  | 'brand'
  | 'name'
  | 'description'
  | 'children'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'active'
  | 'actions'

/* ── 문구(labels) ───────────────────────────────────────────────────────────
   컬럼 머리글·상태 탭·정렬 Select·브랜드 Select·관리 열 접근성 이름을 한 통로로 연다.
   우선순위: 개별 prop(title·emptyText·searchPlaceholder …) > labels.* > 기본값. */
type CategoryListLabelsResolved = {
  title: string
  description: string
  /** 헤더 등록 버튼 */
  create: string
  columns: Record<CategoryColumnKey, string>
  /** 상태 탭 문구 */
  tabs: Record<CategoryStatusFilter, string>
  /** '하위' 배지 문구 — 기본: (count) => `${count}개` */
  childrenCount: LabelFn<number>
  /** 툴바 브랜드 Select의 '전체' 옵션 문구 — brandOptions prop을 주면 그쪽이 이긴다 */
  brand: { all: string }
  /** 툴바 정렬 Select 문구 — sortOptions prop을 주면 그쪽이 이긴다 */
  sort: Record<CategorySortKey, string>
  /** 관리 열 아이콘 버튼 — 툴팁이자 접근성 이름이다(카테고리명을 끼워 넣는다) */
  rowActions: Required<Pick<RowScopedActionLabels, 'view' | 'edit' | 'delete'>>
  search: Pick<SearchLabels, 'search' | 'searchPlaceholder'>
  empty: EmptyLabels
  /** 툴바 건수 문구(prefix·unit·count 통째 교체). 기본은 접두사 없이 "N건" */
  total: TotalLabels
  /**
   * 표 크롬 문구(선택 바 · 컬럼 피커 · 내보내기 · 페이지 크기 …) —
   * 셸(AdminListPage)을 지나 AdminTable로 그대로 흘러간다. 기본값은 AdminTable이 단일 출처라
   * 여기서 다시 적지 않는다(적는 순간 두 값이 갈라진다).
   */
  table?: AdminTableLabels
}

export const DEFAULT_CATEGORY_LIST_LABELS: CategoryListLabelsResolved = {
  title: '카테고리 관리',
  description: '1Depth 카테고리를 등록하고, 각 카테고리의 하위(2Depth)를 설정합니다.',
  create: '카테고리 등록',
  columns: {
    order: '순번',
    brand: '브랜드',
    name: '카테고리명',
    description: '설명',
    children: '하위',
    createdAt: '등록일',
    updatedAt: '수정일',
    createdBy: '등록자',
    updatedBy: '수정자',
    active: '활성화',
    actions: '관리',
  },
  tabs: { all: '전체', active: '활성', inactive: '비활성' },
  childrenCount: (count) => `${count}개`,
  brand: { all: '전체 브랜드' },
  sort: { order: '순번순', name: '이름순', createdAt: '최근 등록순', updatedAt: '최근 수정순' },
  rowActions: {
    view: (name) => `${name} 상세보기`,
    edit: (name) => `${name} 수정`,
    delete: (name) => `${name} 삭제`,
  },
  search: { searchPlaceholder: '카테고리명·설명 검색' },
  empty: { title: '등록된 카테고리가 없습니다.' },
  // 접두사 없음이 기본이다 — ListToolbar를 직접 쓰던 시절 그대로 "18건"(과거 렌더 유지)
  total: { prefix: null },
} as const

export type CategoryListLabels = DeepPartialOneLevel<CategoryListLabelsResolved>

/** 컬럼 머리글만 갈아끼울 때 — labels.columns와 같은 모양 */
export type CategoryColumnLabels = ColumnLabels<CategoryColumnKey>

/**
 * 화면 ON/OFF — 기본값은 전부 true.
 * false면 그 영역이 DOM에서 완전히 사라진다(빈 자리·여백·구분선이 남지 않는다).
 * 열 단위 ON/OFF는 여기서 다루지 않는다 — AdminTable의 columnVisibility를 쓴다.
 */
export type CategoryListShow = {
  /** 페이지 헤더(타이틀·설명·[+ 카테고리 등록]) */
  header?: boolean
  /** 상태 탭(전체/활성/비활성) */
  tabs?: boolean
  /** 검색·브랜드 필터·정렬·건수 + 표 위 내보내기/컬럼 버튼 */
  toolbar?: boolean
  /** 하단 페이지네이션 + 페이지 크기 */
  pagination?: boolean
  /** 선택 체크박스 열 + 일괄 처리 바 */
  bulk?: boolean
  /**
   * 표 우상단 '컬럼' 피커 버튼. 열 구성을 관리자가 바꾸면 안 되는 화면(고정 리포트)에서 끈다.
   * 툴바를 끄면 함께 사라진다(피커는 툴바에 속한 도구다).
   * 미지정이면 기존 top-level columnPicker prop을 따른다 — 기본 동작은 그대로다.
   */
  columnPicker?: boolean
  /**
   * 표 우상단 '내보내기' 버튼. 개인정보가 섞인 목록에서 CSV 반출을 막을 때 끈다.
   * 미지정이면 기존 top-level exportable prop을 따른다 — 기본 동작은 그대로다.
   */
  export?: boolean
}

export type CategoryListProps = {
  rows: CategoryRow[]
  /** 섹션 ON/OFF — 생략하면 전부 켜진다 */
  show?: CategoryListShow

  /** @deprecated labels.title 을 쓰세요 (개별 prop이 labels보다 우선한다) */
  title?: string
  /** @deprecated labels.description 을 쓰세요 */
  description?: string
  /** 있으면 헤더 우측 [+ 카테고리 등록] 버튼이 렌더된다 */
  onAdd?: () => void
  /** @deprecated labels.create 을 쓰세요 */
  addLabel?: string
  /** 등록 버튼 아이콘 — 없으면 기본 Plus */
  addIcon?: ReactNode
  /** 기본 등록 버튼 대신 쓸 헤더 액션 — 주면 onAdd 버튼을 대체한다 */
  headerActions?: ReactNode

  /** 상태 필터 — 주면 제어, 안 주면 내부 상태 */
  status?: CategoryStatusFilter
  onStatusChange?: (status: CategoryStatusFilter) => void
  /**
   * 브랜드 필터 — 주면 제어, 안 주면 내부 상태(기본 'all').
   * value는 brandOptions(또는 rows에서 자동으로 모은 브랜드 목록)의 value와 맞아야 한다.
   */
  brand?: string
  onBrandChange?: (brand: string) => void
  /**
   * 툴바 브랜드 Select 항목. 기본은 rows에 실제로 등장한 브랜드를 모아 '전체 브랜드' 앞에 붙인 목록이다
   * (브랜드는 화면마다 다른 사전이라 상태처럼 고정 enum으로 두지 않는다).
   */
  brandOptions?: SelectOption[]
  /**
   * 툴바 정렬 Select 항목. 기본은 순번/이름/등록일/수정일.
   * value는 CategorySortKey와 맞춰야 하고, 'order'일 때만 드래그 재정렬이 열린다.
   */
  sortOptions?: SelectOption[]
  /** 검색어 — 카테고리명·설명을 훑는다. 주면 제어, 안 주면 내부 상태 */
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  /** @deprecated labels.search.searchPlaceholder 를 쓰세요 */
  searchPlaceholder?: string
  /** 정렬 — 주면 제어, 안 주면 내부 상태(기본 순번순) */
  sort?: CategorySortKey
  onSortChange?: (sort: CategorySortKey) => void

  /** 행 선택 — 주면 제어, 안 주면 내부 상태 */
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  bulkActions?: AdminBulkAction[]
  onBulkDelete?: (ids: string[]) => void

  /** 있어야 드래그 핸들 열이 붙는다. 순번(order)을 1부터 다시 매긴 rows 전체를 돌려준다 */
  onReorder?: (rows: CategoryRow[]) => void
  /** 활성화 토글 */
  onToggleActive?: (row: CategoryRow, next: boolean) => void
  /** 관리 열(RowActions) — 넘긴 핸들러의 아이콘만 렌더된다. 셋 다 없으면 열 자체가 사라진다 */
  onView?: (row: CategoryRow) => void
  onEdit?: (row: CategoryRow) => void
  onDelete?: (row: CategoryRow) => void

  /**
   * 열 표시 여부(key → boolean). 미지정 키는 표시.
   * 안 주면 화면이 내부 상태로 관리하되, 시안대로 수정일·등록자·수정자는 기본 숨김이다
   * (열 자체는 지우지 않는다 — 컬럼 피커로 언제든 다시 켤 수 있다).
   */
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void
  columnPicker?: boolean

  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void

  exportable?: boolean
  exportFilename?: string
  loading?: boolean
  /** @deprecated labels.empty.title 을 쓰세요 */
  emptyText?: string
  density?: 'compact' | 'comfortable'

  /** 화면 문구를 통째로 갈아끼우는 단일 통로 — 개별 카피 prop이 우선한다 */
  labels?: CategoryListLabels
}

/** pageSize prop을 안 주면 이 값으로 시작한다(셸 기본값 20과 달리 이 화면은 10) */
const DEFAULT_PAGE_SIZE = 10

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50]

const STATUS_ORDER: CategoryStatusFilter[] = ['all', 'active', 'inactive']
const SORT_ORDER: CategorySortKey[] = ['order', 'name', 'createdAt', 'updatedAt']

/**
 * 시안 기본 열 구성 — 수정일·등록자·수정자는 시안에 없다.
 * 컬럼 자체는 지우지 않고(컬럼 피커로 되살릴 수 있게) 기본 노출만 끈다.
 */
const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  updatedAt: false,
  createdBy: false,
  updatedBy: false,
}

/** 검색 대상 — 카테고리명·설명 */
function matchesKeyword(row: CategoryRow, query: string): boolean {
  if (query === '') return true
  return [row.name, row.description].some((field) => (field ?? '').toLowerCase().includes(query))
}

function matchesStatus(row: CategoryRow, status: string): boolean {
  if (status === 'all') return true
  return status === 'active' ? row.active : !row.active
}

/** 'all'이면 전부, 아니면 같은 브랜드만 — 브랜드가 없는 행은 'all'에서만 걸린다 */
function matchesBrand(row: CategoryRow, brand: string): boolean {
  if (brand === 'all') return true
  return row.brand === brand
}

/** 최근순(내림차순) — 날짜는 'YYYY-MM-DD' 문자열이라 사전순 비교로 충분하다 */
function compareRows(a: CategoryRow, b: CategoryRow, key: CategorySortKey): number {
  if (key === 'order') return a.order - b.order
  if (key === 'name') return a.name.localeCompare(b.name, 'ko')
  return b[key].localeCompare(a[key])
}

/**
 * CategoryList — 카테고리 관리 화면(AdminListPage 프리셋).
 *
 *   header  = 타이틀 + 설명 + [+ 카테고리 등록]
 *   tabs    = 전체/활성/비활성 상태 탭
 *   toolbar = [전체 브랜드 ▾] · 검색 · [순번순 ▾] · 건수
 *   content = 표(드래그 · 순번 · 브랜드 · 카테고리명 · 설명 · 하위 · 등록일 · 활성화 · 관리)
 *
 * 필터·정렬·페이징·선택은 셸의 축이다. 드래그 재정렬은 정렬이 '순번순'일 때만 연다
 * (다른 정렬이 걸리면 화면 순서와 저장 순서가 달라 재정렬이 거짓말이 된다).
 */
export function CategoryList({
  rows,
  show,
  // 카피의 기본값은 DEFAULT_CATEGORY_LIST_LABELS가 갖는다 — 여기서 기본값을 주면
  // 넘기지 않은 개별 prop이 labels를 항상 이겨 통로가 막힌다
  title,
  description,
  onAdd,
  addLabel,
  addIcon,
  headerActions,
  status,
  onStatusChange,
  brand,
  onBrandChange,
  brandOptions,
  sortOptions,
  keyword,
  onKeywordChange,
  searchPlaceholder,
  sort,
  onSortChange,
  selectedIds,
  onSelectChange,
  bulkActions = [],
  onBulkDelete,
  onReorder,
  onToggleActive,
  onView,
  onEdit,
  onDelete,
  columnVisibility,
  onColumnVisibilityChange,
  columnPicker = true,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  exportable = true,
  exportFilename = '카테고리목록',
  loading = false,
  emptyText,
  density = 'compact',
  labels,
}: CategoryListProps) {
  const L = mergeLabels(DEFAULT_CATEGORY_LIST_LABELS, labels)

  /*
   * 상태·브랜드·정렬은 이 화면이 값을 계속 알아야 한다 —
   *   (a) 브랜드 필터가 표로 내려가는 rows 자체를 좁히고(셸은 이 축을 모른다)
   *   (b) 드래그 재정렬이 정렬 '순번순'일 때만 열린다.
   * 그래서 셸에는 항상 제어로 내려보낸다(비제어 폴백은 이 화면이 대신 갖는다).
   */
  const [innerStatus, setInnerStatus] = useState<CategoryStatusFilter>('all')
  const [innerBrand, setInnerBrand] = useState<string>('all')
  const [innerSort, setInnerSort] = useState<CategorySortKey>('order')
  const [innerPageSize, setInnerPageSize] = useState(pageSize ?? DEFAULT_PAGE_SIZE)
  // 컬럼 표시는 시안 기본값(수정일·등록자·수정자 숨김)에서 시작한다 — 컬럼 자체는 지우지 않는다
  const [innerColumnVisibility, setInnerColumnVisibility] =
    useState<Record<string, boolean>>(DEFAULT_COLUMN_VISIBILITY)

  const statusValue = status ?? innerStatus
  const brandValue = brand ?? innerBrand
  const sortValue = sort ?? innerSort
  const pageSizeValue = pageSize ?? innerPageSize
  const columnVisibilityValue = columnVisibility ?? innerColumnVisibility

  const changeStatus = (next: string) => {
    const value = next as CategoryStatusFilter
    if (status == null) setInnerStatus(value)
    onStatusChange?.(value)
  }

  const changeBrand = (next: string) => {
    if (brand == null) setInnerBrand(next)
    onBrandChange?.(next)
  }

  const changeSort = (next: string) => {
    const value = next as CategorySortKey
    if (sort == null) setInnerSort(value)
    onSortChange?.(value)
  }

  const changePageSize = (next: number) => {
    if (pageSize == null) setInnerPageSize(next)
    onPageSizeChange?.(next)
  }

  const changeColumnVisibility = (next: Record<string, boolean>) => {
    if (columnVisibility == null) setInnerColumnVisibility(next)
    onColumnVisibilityChange?.(next)
  }

  // 고를 이유(일괄 액션·삭제·선택 콜백)가 없으면 체크박스 열도 만들지 않는다 — 빈 열이 남으면 안 된다
  const showBulk =
    show?.bulk !== false &&
    (bulkActions.length > 0 || onBulkDelete != null || onSelectChange != null)
  // show 키가 없으면 기존 top-level prop을 그대로 따른다 — 기본 렌더는 바뀌지 않는다
  const showColumnPicker = show?.columnPicker ?? columnPicker
  const showExport = show?.export ?? exportable
  // 내보내기·컬럼 버튼도 목록 조작 도구다 — 툴바를 끄면 함께 사라진다(PortfolioList와 같은 정책)
  const showToolbar = show?.toolbar !== false

  // 드래그 핸들은 정렬이 '순번순'일 때만 — 다른 정렬이 걸리면 화면 순서와 저장 순서가 어긋난다
  const reorderable = onReorder != null && sortValue === 'order'

  // 브랜드 Select 기본 옵션 — rows에 실제로 등장한 브랜드를 모아 '전체 브랜드' 앞에 붙인다
  const knownBrands = Array.from(
    new Set(rows.map((row) => row.brand).filter((value): value is string => value != null && value !== '')),
  )
  const brandOptionItems: SelectOption[] =
    brandOptions ??
    [{ value: 'all', label: L.brand.all }, ...knownBrands.map((value) => ({ value, label: value }))]
  const sortOptionItems: SelectOption[] =
    sortOptions ?? SORT_ORDER.map((key) => ({ value: key, label: L.sort[key] }))

  const tabItems: CategoryTabItem[] = STATUS_ORDER.map((key) => ({
    label: L.tabs[key],
    value: key,
    fixed: true,
  }))

  // 브랜드 필터는 셸이 모르는 축이라 셸에 넘기기 전에 이 화면이 직접 좁힌다(ProductListScreen과 같은 규약)
  const brandFilteredRows = rows.filter((row) => matchesBrand(row, brandValue))

  /**
   * 재정렬 — 표는 현재 페이지 행만 새 순서로 돌려준다. movedIds(집합이라 순서 무관)로
   * 전체 목록에서 그 자리들을 찾아 되꽂고 순번(order)을 1부터 다시 매긴다.
   */
  const handleReorder = (nextPageRows: CategoryRow[]) => {
    if (onReorder == null) return
    const movedIds = new Set(nextPageRows.map((row) => row.id))
    const base = [...rows].sort((a, b) => a.order - b.order)
    let cursor = 0
    const next = base.map((row) => (movedIds.has(row.id) ? nextPageRows[cursor++] : row))
    onReorder(next.map((row, index) => ({ ...row, order: index + 1 })))
  }

  /** 카테고리명 셀 — 이모지 > 이미지 > 대체 그림 중 하나 + 이름(1줄 말줄임) */
  const renderName = (row: CategoryRow): ReactNode => (
    <span className={styles.name}>
      {row.emoji != null && row.emoji !== '' ? (
        <span className={styles.emoji} aria-hidden="true">
          {row.emoji}
        </span>
      ) : row.image != null && row.image !== '' ? (
        <img className={styles.thumb} src={row.image} alt="" />
      ) : (
        <span className={styles.thumbEmpty} aria-hidden="true">
          <Placeholder kind="image" size="fill" />
        </span>
      )}
      <span className={styles.nameText} title={row.name}>
        {row.name}
      </span>
    </span>
  )

  /** 브랜드 셀 — 강조색(링크색) 텍스트. 없으면 '-' */
  const renderBrand = (row: CategoryRow): ReactNode => (
    <span className={styles.brand}>{row.brand ?? '-'}</span>
  )

  const hasRowActions = onView != null || onEdit != null || onDelete != null

  /*
   * 헤더 우측 — headerActions는 셸의 additive 슬롯(등록 버튼 왼쪽에 얹는 자리)과 달리
   * 이 화면에서는 원래 onAdd 버튼을 통째로 대체하는 자리였다. 셸에 그대로 넘기면 버튼이
   * 두 개 나란히 뜨므로, 버튼은 여기서 직접 만들어 headerActions 하나로만 셸에 넘긴다
   * (onCreate/createLabel/createIcon은 셸에 넘기지 않는다).
   */
  const createButtonNode =
    onAdd != null ? (
      <Button
        variant="primary"
        size="md"
        label={resolveLabel(addLabel, L.create) ?? L.create}
        showLeftIcon
        leftIcon={addIcon ?? <Plus size={16} aria-hidden="true" />}
        onClick={onAdd}
      />
    ) : undefined
  const finalHeaderActions = headerActions ?? createButtonNode

  const columns: AdminColumn<CategoryRow>[] = []

  if (showBulk) columns.push({ kind: 'select', key: 'select' })
  // 핸들 열은 onReorder가 와 있으면(재정렬 기능 자체가 켜진 화면이면) 항상 렌더한다 — sortValue가
  // 'order'가 아니게 되는 순간 reorderable(위)로 넣고 빼면 정렬 Select를 바꿀 때마다 컬럼 수가
  // 바뀌어 레이아웃이 흔들린다. 대신 onReorder(아래 AdminListPage 호출)를 reorderable일 때만 넘겨
  // AdminTable이 핸들을 disabled(잠금)로만 보여주게 한다(PortfolioList와 같은 정책).
  if (onReorder != null) columns.push({ kind: 'drag', key: 'drag' })

  columns.push(
    { kind: 'index', key: 'order', header: L.columns.order, sortable: true },
    {
      kind: 'text',
      key: 'brand',
      header: L.columns.brand,
      ratio: 1,
      value: (row) => row.brand ?? '-',
      render: renderBrand,
    },
    {
      kind: 'title',
      key: 'name',
      header: L.columns.name,
      ratio: 2,
      sortable: true,
      onClick: onView ?? onEdit,
      render: renderName,
    },
    {
      kind: 'text',
      key: 'description',
      header: L.columns.description,
      ratio: 3,
      value: (row) => row.description ?? '-',
    },
    {
      kind: 'badge',
      key: 'children',
      header: L.columns.children,
      value: (row) => L.childrenCount(row.childCount ?? 0),
    },
    { kind: 'date', key: 'createdAt', header: L.columns.createdAt, sortable: true },
    { kind: 'date', key: 'updatedAt', header: L.columns.updatedAt, sortable: true },
    { kind: 'user', key: 'createdBy', header: L.columns.createdBy },
    { kind: 'user', key: 'updatedBy', header: L.columns.updatedBy },
    { kind: 'status', key: 'active', header: L.columns.active, value: (row) => row.active },
  )

  if (hasRowActions) {
    columns.push({
      kind: 'actions',
      key: 'actions',
      header: L.columns.actions,
      // 아이콘 3개(상세·수정·삭제)는 actions 기본 고정폭(96)을 넘긴다 — 비율 열로 풀어 준다
      ratio: 1,
      render: (row) => (
        <RowActions
          size="sm"
          onView={onView == null ? undefined : () => onView(row)}
          onEdit={onEdit == null ? undefined : () => onEdit(row)}
          onDelete={onDelete == null ? undefined : () => onDelete(row)}
          labels={{
            view: L.rowActions.view(row.name),
            edit: L.rowActions.edit(row.name),
            delete: L.rowActions.delete(row.name),
          }}
        />
      ),
    })
  }

  return (
    <AdminListPage
      rows={brandFilteredRows}
      columns={columns}
      rowKey={(row) => row.id}
      loading={loading}
      title={resolveLabel(title, L.title)}
      description={resolveLabel(description, L.description)}
      headerActions={finalHeaderActions}
      tabs={tabItems}
      tab={statusValue}
      onTabChange={changeStatus}
      matchTab={matchesStatus}
      // 탭 배지는 브랜드 필터와 무관한 전체 기준이다(brandFilteredRows가 아니라 rows로 센다)
      tabCountRows={rows}
      search="inline"
      keyword={keyword}
      onKeywordChange={onKeywordChange}
      searchPlaceholder={resolveLabel(searchPlaceholder, L.search.searchPlaceholder)}
      matchKeyword={matchesKeyword}
      toolbarSelects={[
        { key: 'brand', value: brandValue, options: brandOptionItems, onChange: changeBrand },
      ]}
      sortOptions={sortOptionItems}
      sort={sortValue}
      onSortChange={changeSort}
      orderRows={(filteredRows, sortValueArg) =>
        [...filteredRows].sort((a, b) =>
          compareRows(a, b, (sortValueArg ?? 'order') as CategorySortKey),
        )
      }
      selection={showBulk ? 'multi' : 'none'}
      selectedIds={selectedIds}
      onSelectChange={onSelectChange}
      bulkActions={bulkActions}
      onBulkDelete={onBulkDelete}
      onReorder={reorderable ? handleReorder : undefined}
      onToggleStatus={onToggleActive}
      columnVisibility={columnVisibilityValue}
      onColumnVisibilityChange={changeColumnVisibility}
      columnPicker={showToolbar && showColumnPicker}
      exportable={showToolbar && showExport}
      exportFilename={exportFilename}
      pageSize={pageSizeValue}
      onPageSizeChange={changePageSize}
      pageSizeOptions={pageSizeOptions}
      emptyText={resolveLabel(emptyText, L.empty.title)}
      // 표 크롬 문구는 셸이 AdminTable로 그대로 통과시킨다 — 넘기지 않으면 undefined라 기본값이 그대로 산다
      labels={{ total: L.total, table: L.table }}
      density={density}
      show={{
        header: show?.header,
        tabs: show?.tabs,
        toolbar: show?.toolbar,
        pagination: show?.pagination,
      }}
    />
  )
}
