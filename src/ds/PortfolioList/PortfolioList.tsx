import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import {
  mergeLabels,
  resolveLabel,
  type ColumnLabels,
  type DeepPartialOneLevel,
  type EmptyLabels,
  type RowScopedActionLabels,
  type SearchLabels,
  type TotalLabels,
} from '../../shared/labels'
import { AdminListPage } from '../AdminListPage/AdminListPage'
import type { AdminBulkAction, AdminColumn, AdminTableLabels } from '../AdminTable/AdminTable'
import { RowActions } from '../RowActions/RowActions'
import type { SelectOption } from '../Select/Select'

/*
 * PortfolioList — 포트폴리오(시공 내역) 관리 화면. 골격(헤더·탭·툴바·검색·표·선택·일괄 처리·
 * 페이지네이션)은 AdminListPage(공용 셸)가 갖는다. 이 파일에 남는 건 컬럼 · 필터/정렬 축 ·
 * 한국어 문구뿐이다(CategoryList와 같은 결).
 *
 * 카테고리 탭과 툴바의 [전체 카테고리 ▾]는 같은 filter.category를 읽고 쓴다 —
 * 둘 중 하나를 꺼도 나머지로 카테고리를 계속 고를 수 있다.
 * 상태(활성/비활성)는 셸의 tab 축과 별개라 orderRows에서 함께 걸러낸다(아래 buildRows 참고).
 *
 * 순번은 rows의 저장 순서다(카테고리처럼 order 필드가 없다). 드래그 재정렬은 화면 순서와
 * 저장 순서가 같을 때만 연다 — 필터·검색·다른 정렬이 걸린 상태에서 끌면 "보이는 순서"를
 * 저장 순서로 착각하게 되므로 그때는 onReorder를 표에 넘기지 않아 핸들이 잠긴다.
 */

/** 포트폴리오 카테고리 — 탭·필터·표에 이모지 + 라벨로 찍힌다 */
export type PortfolioCategory = {
  value: string
  label: string
  /** 라벨 앞에 붙는 이모지(예: 🍳) */
  emoji: string
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

/** 시공 내역 한 건 */
export type PortfolioRow = {
  id: string
  /** 썸네일 주소 — 없으면 표가 공용 대체 그림(Placeholder)을 그린다 */
  thumbnail?: string
  title: string
  /** PortfolioCategory.value */
  category: string
  /** 상세 설명 — 목록에서는 쓰지 않고 등록/수정 화면이 쓴다 */
  detail?: string
  /** 외부 링크(시공 사례 페이지 등) */
  link?: string
  createdAt: string
  updatedAt?: string
  createdBy: string
  updatedBy?: string
  active: boolean
}

/** 툴바 정렬 — 순번순일 때만 드래그 재정렬이 열린다 */
export type PortfolioSort = 'order' | 'newest' | 'title'

/** 조회 조건 — 하나라도 바뀌면 통째로 onFilterChange로 나간다 */
export type PortfolioFilter = {
  /** null이면 전체 카테고리 */
  category: string | null
  /** null이면 전체 상태 */
  status: 'active' | 'inactive' | null
  keyword: string
  sort: PortfolioSort
}

/** 표 컬럼 — labels.columns의 키이자 AdminTable 컬럼 key */
export type PortfolioColumnKey =
  | 'index'
  | 'thumbnail'
  | 'title'
  | 'category'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'active'
  | 'actions'

/* ── 문구(labels) ───────────────────────────────────────────────────────────
   컬럼 머리글·카테고리 탭('전체')·툴바 카테고리/상태 Select·정렬 Select·관리 열 접근성 이름을
   한 통로로 연다. 탭의 '전체'와 툴바 Select의 '전체 카테고리'는 원문 문구가 달라 그룹을 분리한다.
   우선순위: 개별 prop(title·emptyText·searchPlaceholder …) > labels.* > 기본값. */
type PortfolioListLabelsResolved = {
  title: string
  description: string
  /** 헤더 등록 버튼 */
  create: string
  columns: Record<PortfolioColumnKey, string>
  /** 카테고리 탭의 '전체' */
  tabs: { all: string }
  /** 툴바 [전체 카테고리 ▾]의 '전체' — 탭의 '전체'와 문구가 다르다 */
  categorySelect: { all: string }
  /** 툴바 상태 Select — statusOptions prop을 주면 그쪽이 이긴다 */
  status: { all: string; active: string; inactive: string }
  /** 툴바 정렬 Select — sortOptions prop을 주면 그쪽이 이긴다 */
  sort: Record<PortfolioSort, string>
  /** 관리 열 아이콘 버튼 — 툴팁이자 접근성 이름이다(제목을 끼워 넣는다) */
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

export const DEFAULT_PORTFOLIO_LIST_LABELS: PortfolioListLabelsResolved = {
  title: '포트폴리오 관리',
  description: '시공 내역(이미지·제목·상세·링크)을 등록·수정·삭제하고 순번/활성화를 관리합니다.',
  create: '포트폴리오 등록',
  columns: {
    index: '순번',
    thumbnail: '이미지',
    title: '제목',
    category: '카테고리',
    createdAt: '등록일',
    updatedAt: '수정일',
    createdBy: '등록자',
    updatedBy: '수정자',
    active: '활성화',
    actions: '관리',
  },
  tabs: { all: '전체' },
  categorySelect: { all: '전체 카테고리' },
  status: { all: '전체 상태', active: '활성화', inactive: '비활성화' },
  sort: { order: '순번순', newest: '최신 등록순', title: '제목순' },
  rowActions: {
    view: (title) => `${title} 상세보기`,
    edit: (title) => `${title} 수정`,
    delete: (title) => `${title} 삭제`,
  },
  search: { searchPlaceholder: '제목 검색' },
  empty: { title: '등록된 포트폴리오가 없습니다.' },
  // 접두사 없음이 기본이다 — ListToolbar를 직접 쓰던 시절 그대로 "N건"(과거 렌더 유지)
  total: { prefix: null },
} as const

export type PortfolioListLabels = DeepPartialOneLevel<PortfolioListLabelsResolved>

/** 컬럼 머리글만 갈아끼울 때 — labels.columns와 같은 모양 */
export type PortfolioColumnLabels = ColumnLabels<PortfolioColumnKey>

/**
 * 섹션 ON/OFF — 기본값은 전부 true. false면 그 영역이 DOM에서 완전히 사라진다.
 *
 * 열 단위 ON/OFF(이미지·카테고리·등록일…)는 여기가 아니라 AdminTable의
 * columnVisibility로 한다. 아래 키는 columnVisibility로 끌 수 없는 것들만 남겼다
 * (선택·드래그·관리 열은 표의 뼈대라 컬럼 피커에서 꺼지지 않는다).
 */
export type PortfolioListShow = {
  /** 페이지 헤더(타이틀·설명·[+ 포트폴리오 등록]) */
  header?: boolean
  /** 카테고리 탭 */
  tabs?: boolean
  /** 검색·필터·정렬·건수·내보내기 */
  toolbar?: boolean
  /** 페이지네이션 + 페이지 크기 */
  pagination?: boolean
  /** 선택 체크박스 열 + 일괄 처리 바 */
  bulk?: boolean
  /** 드래그 핸들 열(순번 재정렬) */
  reorder?: boolean
  /** 관리 열(RowActions) */
  rowActions?: boolean
  /** 표 우상단 '컬럼' 피커 버튼 — 열 구성을 고정해야 하는 화면에서 끈다(툴바를 끄면 함께 사라진다) */
  columnPicker?: boolean
  /** 표 우상단 '내보내기' 버튼 — CSV 반출을 막을 때 끈다(툴바를 끄면 함께 사라진다) */
  export?: boolean
}

export type PortfolioListProps = {
  rows: PortfolioRow[]
  categories: PortfolioCategory[]
  /** @deprecated labels.title 을 쓰세요 (개별 prop이 labels보다 우선한다) */
  title?: string
  /** @deprecated labels.description 을 쓰세요 */
  description?: string
  /** @deprecated labels.create 을 쓰세요 */
  createLabel?: string
  /** 등록 버튼 아이콘 — 없으면 기본 Plus */
  createIcon?: ReactNode
  /** @deprecated labels.search.searchPlaceholder 를 쓰세요 */
  searchPlaceholder?: string
  /** @deprecated labels.empty.title 을 쓰세요 */
  emptyText?: string
  /**
   * 툴바 상태 Select 항목 — 기본은 전체/활성화/비활성화.
   * 운영 화면마다 상태 라벨이 다르므로(노출/숨김 등) 모듈 상수에서 prop으로 연다.
   * value는 ''(전체) · 'active' · 'inactive'와 맞춰야 필터가 동작한다.
   */
  statusOptions?: SelectOption[]
  /**
   * 툴바 정렬 Select 항목 — 기본은 순번순/최신 등록순/제목순.
   * value는 PortfolioSort와 맞춰야 하고, 'order'일 때만 드래그 재정렬이 열린다.
   */
  sortOptions?: SelectOption[]
  loading?: boolean
  /** 한 페이지 행 수 — show.pagination이 false면 무시된다 */
  pageSize?: number
  pageSizeOptions?: number[]
  density?: 'compact' | 'comfortable'
  /** 섹션 ON/OFF — 미지정 키는 true */
  show?: PortfolioListShow
  /** 조회 조건 — 주면 제어(서버 조회), 안 주면 내부 상태로 화면에서 거른다 */
  filter?: PortfolioFilter
  onFilterChange?: (filter: PortfolioFilter) => void
  /** 선택된 행 — 주면 제어, 안 주면 내부 상태 */
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  /** 열 표시 여부(key → boolean) — 열 단위 ON/OFF는 이걸로 한다 */
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void
  onCreate?: () => void
  /** 제목 클릭 · 관리(연필) */
  onEdit?: (row: PortfolioRow) => void
  /** 있으면 관리 열에 눈(상세보기) 아이콘이 붙는다 */
  onView?: (row: PortfolioRow) => void
  onDelete?: (row: PortfolioRow) => void
  onToggleActive?: (row: PortfolioRow, next: boolean) => void
  /** 드래그로 순번을 바꿨을 때 — 재정렬된 rows 전체가 그대로 돌아온다 */
  onReorder?: (rows: PortfolioRow[]) => void
  /** 일괄 처리 — show.bulk가 true여야 바가 뜬다 */
  onBulkDelete?: (ids: string[]) => void
  bulkActions?: AdminBulkAction[]
  /** 화면 문구를 통째로 갈아끼우는 단일 통로 — 개별 카피 prop이 우선한다 */
  labels?: PortfolioListLabels
}

/**
 * '전체' 센티넬 — Select는 선택을 비우는 수단이 없다(값을 고르면 되돌릴 수 없다).
 * 그래서 '전체'를 빈 문자열 옵션으로 두고, 안에서 null로 바꿔 다룬다.
 */
const ALL = ''

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100]

const DEFAULT_FILTER: PortfolioFilter = {
  category: null,
  status: null,
  keyword: '',
  sort: 'order',
}

/** 미지정 키는 전부 켜진 것으로 본다 */
const DEFAULT_SHOW: Required<PortfolioListShow> = {
  header: true,
  tabs: true,
  toolbar: true,
  pagination: true,
  bulk: true,
  reorder: true,
  rowActions: true,
  columnPicker: true,
  export: true,
}

const SORT_ORDER: PortfolioSort[] = ['order', 'newest', 'title']

function matchesCategory(row: PortfolioRow, category: string): boolean {
  return category === ALL || row.category === category
}

/**
 * PortfolioList — 포트폴리오(시공 내역) 관리 화면(AdminListPage 프리셋).
 *
 *   header  = 타이틀 + 설명 + [+ 포트폴리오 등록]
 *   tabs    = 전체 + 카테고리별(이모지 + 라벨) — 툴바 [전체 카테고리 ▾]와 같은 값을 공유한다
 *   toolbar = [전체 카테고리 ▾] · [전체 상태 ▾] · 검색 · [순번순 ▾] · 건수
 *   content = 표(드래그 · 순번 · 이미지 · 제목 · 카테고리 · 등록/수정일 · 등록/수정자 · 활성화 · 관리)
 */
export function PortfolioList({
  rows,
  categories,
  // 카피의 기본값은 DEFAULT_PORTFOLIO_LIST_LABELS가 갖는다 — 여기서 기본값을 주면
  // 넘기지 않은 개별 prop이 labels를 항상 이겨 통로가 막힌다
  title,
  description,
  createLabel,
  createIcon,
  searchPlaceholder,
  emptyText,
  statusOptions,
  sortOptions,
  loading = false,
  pageSize: initialPageSize = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  density = 'compact',
  show,
  filter: filterProp,
  onFilterChange,
  selectedIds: selectedIdsProp,
  onSelectChange,
  columnVisibility,
  onColumnVisibilityChange,
  onCreate,
  onEdit,
  onView,
  onDelete,
  onToggleActive,
  onReorder,
  onBulkDelete,
  bulkActions = [],
  labels,
}: PortfolioListProps) {
  const L = mergeLabels(DEFAULT_PORTFOLIO_LIST_LABELS, labels)
  const [innerFilter, setInnerFilter] = useState<PortfolioFilter>(DEFAULT_FILTER)
  const [innerSelected, setInnerSelected] = useState<string[]>([])
  // 이 화면엔 page를 제어하는 외부 prop이 없다(pageSize만 초기값을 받는다) — 셸이 page는 대신 갖는다
  const [pageSize, setPageSize] = useState(initialPageSize)

  const s = { ...DEFAULT_SHOW, ...show }

  // filter/selectedIds는 주면 제어, 안 주면 내부 상태 — 스토리와 서버 조회를 같은 코드로 쓴다
  const filter = filterProp ?? innerFilter
  const selectedIds = selectedIdsProp ?? innerSelected

  /** 조건 하나가 바뀌면 나머지와 묶어 한 번에 통보한다(페이지·선택 되돌리기는 셸이 한다) */
  const applyFilter = (patch: Partial<PortfolioFilter>) => {
    const next: PortfolioFilter = { ...filter, ...patch }
    if (filterProp == null) setInnerFilter(next)
    onFilterChange?.(next)
  }

  const categoryOf = useMemo(
    () => new Map(categories.map((item) => [item.value, item])),
    [categories],
  )

  // 순번 = rows의 저장 순서(카테고리처럼 order 필드가 없다). 정렬/필터를 바꿔도 순번은 행을 따라간다.
  const seqOf = useMemo(() => new Map(rows.map((row, index) => [row.id, index + 1])), [rows])

  const { category, status, keyword, sort } = filter
  const categoryValue = category ?? ALL

  /**
   * 화면 순서 — 셸이 카테고리(matchTab)·제목 검색(matchKeyword)으로 거른 뒤 이 함수를 부른다.
   * 상태(활성/비활성)는 셸에 축이 하나(matchTab)뿐이라 여기서 함께 거른다 — 독립된 두 축(카테고리·상태)을
   * 동시에 걸러야 하는데, 걸러진 뒤 순서를 매기는 이 함수는 임의의 부분집합을 돌려줘도 되기 때문이다.
   */
  const orderRows = (filteredRows: PortfolioRow[], sortValue: string | null): PortfolioRow[] => {
    const byStatus =
      status == null ? filteredRows : filteredRows.filter((row) => row.active === (status === 'active'))
    if (sortValue === 'newest') {
      return [...byStatus].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    if (sortValue === 'title') {
      return [...byStatus].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    }
    return byStatus
  }

  // 화면 순서 === 저장 순서일 때만 열린다(필터/검색/다른 정렬이 걸리면 잠근다).
  const reorderable =
    s.reorder && onReorder != null && sort === 'order' && category == null && status == null && keyword.trim() === ''

  /** 표는 현재 페이지 행만 재정렬해 돌려준다 — movedIds(집합)로 그 구간을 찾아 전체 목록에 되꽂는다 */
  const handleReorder = (nextPageRows: PortfolioRow[]) => {
    if (onReorder == null) return
    const movedIds = new Set(nextPageRows.map((row) => row.id))
    const start = rows.findIndex((row) => movedIds.has(row.id))
    if (start < 0) return
    const next = [...rows]
    next.splice(start, nextPageRows.length, ...nextPageRows)
    onReorder(next)
  }

  const statusOptionItems: SelectOption[] =
    statusOptions ?? [
      { label: L.status.all, value: ALL },
      { label: L.status.active, value: 'active' },
      { label: L.status.inactive, value: 'inactive' },
    ]

  const sortOptionItems: SelectOption[] =
    sortOptions ?? SORT_ORDER.map((key) => ({ value: key, label: L.sort[key] }))

  // ── 컬럼 ─────────────────────────────────────────────────────────────
  // 데이터 열(이미지·카테고리·등록일…)은 컬럼 피커(columnVisibility)로 끈다.
  // 여기서 조건부로 넣고 빼는 건 피커가 건드리지 못하는 뼈대 열뿐이다.
  const columns: AdminColumn<PortfolioRow>[] = []

  if (s.bulk) columns.push({ kind: 'select', key: 'select' })
  // 핸들 열은 show.reorder(정적 설정)로만 넣고 뺀다 — reorderable(필터/정렬에 따라 흔들리는 값)로 넣고 빼면
  // 필터를 걸 때마다 컬럼 수가 바뀌어 레이아웃이 흔들린다. 대신 onReorder(아래)를 reorderable일 때만 넘겨
  // AdminTable이 핸들을 disabled(잠금)로만 보여주게 한다(§AdminTable 'drag' kind: onReorder==null → 잠금).
  if (s.reorder) columns.push({ kind: 'drag', key: 'drag' })

  columns.push(
    { kind: 'index', key: 'index', header: L.columns.index, value: (row) => seqOf.get(row.id) },
    { kind: 'thumbnail', key: 'thumbnail', header: L.columns.thumbnail, value: (row) => row.thumbnail },
    { kind: 'title', key: 'title', header: L.columns.title, ratio: 3, onClick: onEdit },
    {
      kind: 'category',
      key: 'category',
      header: L.columns.category,
      ratio: 1,
      // 이모지 + 라벨. 정렬·내보내기도 이 문자열(코드값이 아니라)을 쓴다
      value: (row) => {
        const item = categoryOf.get(row.category)
        return item != null ? `${item.emoji} ${item.label}` : row.category
      },
      tone: (row) => categoryOf.get(row.category)?.tone ?? 'secondary',
    },
    { kind: 'date', key: 'createdAt', header: L.columns.createdAt },
    { kind: 'date', key: 'updatedAt', header: L.columns.updatedAt, value: (row) => row.updatedAt ?? '—' },
    { kind: 'user', key: 'createdBy', header: L.columns.createdBy },
    { kind: 'user', key: 'updatedBy', header: L.columns.updatedBy, value: (row) => row.updatedBy ?? '—' },
    { kind: 'status', key: 'active', header: L.columns.active },
  )

  if (s.rowActions) {
    columns.push({
      kind: 'actions',
      key: 'actions',
      header: L.columns.actions,
      pinned: 'right',
      // 표 기본 아이콘 대신 공용 RowActions — 핸들러를 넘긴 버튼만 그려진다
      render: (row) => (
        <RowActions
          size="sm"
          onView={onView != null ? () => onView(row) : undefined}
          onEdit={onEdit != null ? () => onEdit(row) : undefined}
          onDelete={onDelete != null ? () => onDelete(row) : undefined}
          labels={{
            view: L.rowActions.view(row.title),
            edit: L.rowActions.edit(row.title),
            delete: L.rowActions.delete(row.title),
          }}
        />
      ),
    })
  }

  // ── 탭 ───────────────────────────────────────────────────────────────
  // 건수는 rows 전체 기준 — 상태/검색 필터를 바꿔도 탭의 숫자가 흔들리지 않는다(셸이 matchTab으로 센다)
  const tabItems = [
    { label: L.tabs.all, value: ALL, fixed: true },
    ...categories.map((item) => ({
      label: `${item.emoji} ${item.label}`,
      value: item.value,
      fixed: true,
    })),
  ]

  return (
    <AdminListPage
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      loading={loading}
      title={resolveLabel(title, L.title)}
      description={resolveLabel(description, L.description)}
      onCreate={onCreate}
      createLabel={resolveLabel(createLabel, L.create)}
      createIcon={createIcon ?? <Plus size={16} aria-hidden="true" />}
      tabs={tabItems}
      tab={categoryValue}
      onTabChange={(value) => applyFilter({ category: value === ALL ? null : value })}
      matchTab={matchesCategory}
      search="inline"
      keyword={keyword}
      onKeywordChange={(value) => applyFilter({ keyword: value })}
      searchPlaceholder={resolveLabel(searchPlaceholder, L.search.searchPlaceholder)}
      matchKeyword={(row, query) => row.title.toLowerCase().includes(query.toLowerCase())}
      toolbarSelects={[
        {
          key: 'category',
          value: categoryValue,
          width: 170,
          options: [
            { value: ALL, label: L.categorySelect.all },
            ...categories.map((item) => ({ value: item.value, label: `${item.emoji} ${item.label}` })),
          ],
          onChange: (value) => applyFilter({ category: value === ALL ? null : value }),
        },
        {
          key: 'status',
          value: status ?? ALL,
          options: statusOptionItems,
          onChange: (value) =>
            applyFilter({ status: value === ALL ? null : (value as 'active' | 'inactive') }),
        },
      ]}
      sortOptions={sortOptionItems}
      sort={sort}
      onSortChange={(value) => applyFilter({ sort: value as PortfolioSort })}
      orderRows={orderRows}
      selection={s.bulk ? 'multi' : 'none'}
      selectedIds={selectedIds}
      onSelectChange={(ids) => {
        if (selectedIdsProp == null) setInnerSelected(ids)
        onSelectChange?.(ids)
      }}
      bulkActions={bulkActions}
      onBulkDelete={onBulkDelete}
      onReorder={reorderable ? handleReorder : undefined}
      onToggleStatus={onToggleActive}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      // 내보내기·컬럼 피커는 툴바에 속한다 — 툴바를 끄면 함께 사라지고, 각각 따로도 끌 수 있다
      columnPicker={s.toolbar && s.columnPicker}
      exportable={s.toolbar && s.export}
      exportFilename="포트폴리오"
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pageSizeOptions={pageSizeOptions}
      // 페이지 크기 Select·일괄바·페이지네이션이 셋 다 없으면(show.pagination·show.bulk를 모두 끈 조합)
      // 표 하단의 빈 32px footer 줄을 여백으로 남기지 않고 접는다(HEAD의 .noFooter와 같은 결과 —
      // 다만 CSS로 마지막 자식을 숨기는 대신 AdminTable/AdminListPage의 축을 쓴다).
      showFooterWhenEmpty={false}
      emptyText={resolveLabel(emptyText, L.empty.title)}
      // 표 크롬 문구는 셸이 AdminTable로 그대로 통과시킨다 — 넘기지 않으면 undefined라 기본값이 그대로 산다
      labels={{ total: L.total, table: L.table }}
      density={density}
      show={{
        header: s.header,
        tabs: s.tabs,
        toolbar: s.toolbar,
        pagination: s.pagination,
      }}
    />
  )
}
