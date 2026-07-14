import type { ReactNode } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import {
  mergeLabels,
  resolveLabel,
  type ColumnLabels,
  type DeepPartialOneLevel,
  type EmptyLabels,
  type LabelFn,
  type RowScopedActionLabels,
  type SearchLabels,
} from '../../shared/labels'
import { mockImage } from '../../shared/mediaMock'
import { AdminListPage } from '../AdminListPage/AdminListPage'
import {
  type AdminBulkAction,
  type AdminColumn,
  type AdminColumnTone,
  type AdminTableLabels,
} from '../AdminTable/AdminTable'
import { RowActions } from '../RowActions/RowActions'
import type { SelectOption } from '../Select/Select'
import styles from './MainVisualList.module.css'

/*
 * MainVisualList — 메인 비주얼 관리 목록 화면. 골격(헤더·탭·툴바·표)은 AdminListPage(공용 셸)가 갖는다.
 *
 * 이 화면은 처음부터 무상태였다 — 탭·상태·검색·정렬·페이지·선택 전부 부모(스토리·AdminSuite)가 걸러서
 * 넘긴 rows를 그대로 그렸다. 그 계약을 그대로 지킨다: 셸에 matchTab·matchKeyword·orderRows를
 * 넘기지 않아 rows는 필터링·정렬 없이 그대로 표에 닿는다. 탭·상태·검색·정렬 컨트롤은 값을
 * 보여주고 onXChange로 알리기만 하는 순수 표시 축이다.
 */

/** 메인 비주얼 한 줄 — 표의 컬럼 순서(순번·이미지·타입·제목·일자·담당자·활성)와 1:1 */
export type MainVisualRow = {
  id: string
  order: number
  /** 썸네일 주소 — 없으면 표가 공용 Placeholder를 그린다 */
  image?: string
  /** 타입 배지 문구 — '히어로' · '서브' */
  type: string
  title: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  active: boolean
}

/** 상단 탭 — 중고 2 / 렌탈 3 / 시공 2 */
export type MainVisualTab = {
  value: string
  label: string
  count?: number
}

/** 표 컬럼 — labels.columns의 키이자 AdminTable 컬럼 key */
export type MainVisualColumnKey =
  | 'order'
  | 'image'
  | 'type'
  | 'title'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'active'
  | 'actions'

/* ── 문구(labels) ───────────────────────────────────────────────────────────
   컬럼 머리글·툴바 상태/정렬 Select·관리 열 접근성 이름·드래그 안내문을 한 통로로 연다.
   등록 버튼은 현재 탭 이름을 물고 오므로 인자 1개짜리 함수다.
   우선순위: 개별 prop(title·emptyText·searchPlaceholder …) > labels.* > 기본값. */
type MainVisualListLabelsResolved = {
  title: string
  description: string
  /** 헤더 등록 버튼 — 현재 탭 이름을 받는다('' 이면 접두사 없이 찍는다) */
  create: LabelFn<string>
  columns: Record<MainVisualColumnKey, string>
  /** 툴바 상태 Select — statusOptions prop을 주면 그쪽이 이긴다 */
  status: { all: string; active: string; inactive: string }
  /** 툴바 정렬 Select — sortOptions prop을 주면 그쪽이 이긴다 */
  sort: { order: string; latest: string; title: string }
  /** 관리 열 아이콘 버튼 — 툴팁이자 접근성 이름이다(제목을 끼워 넣는다) */
  rowActions: Required<Pick<RowScopedActionLabels, 'edit' | 'delete'>>
  search: Pick<SearchLabels, 'search' | 'searchPlaceholder'>
  empty: EmptyLabels
  /** 표 아래 드래그 안내 — 재정렬이 실제로 동작할 때만 보인다 */
  reorderHint: string
  /**
   * 표 크롬 문구(선택 바 · 컬럼 피커 · 페이지 크기 …) —
   * 셸(AdminListPage)을 지나 AdminTable로 그대로 흘러간다. 기본값은 AdminTable이 단일 출처라
   * 여기서 다시 적지 않는다(적는 순간 두 값이 갈라진다).
   */
  table?: AdminTableLabels
}

export const DEFAULT_MAIN_VISUAL_LIST_LABELS: MainVisualListLabelsResolved = {
  title: '메인 비주얼 관리',
  description: '메인 화면 상단에 노출되는 비주얼을 등록하고 순서를 관리합니다.',
  create: (tabLabel) => (tabLabel !== '' ? `${tabLabel} 메인 비주얼 등록` : '메인 비주얼 등록'),
  columns: {
    order: '순번',
    image: '이미지',
    type: '타입',
    title: '제목',
    createdAt: '등록일',
    updatedAt: '수정일',
    createdBy: '등록자',
    updatedBy: '수정자',
    active: '활성화',
    actions: '관리',
  },
  status: { all: '전체 상태', active: '활성', inactive: '비활성' },
  sort: { order: '순번순', latest: '최신순', title: '제목순' },
  rowActions: {
    edit: (title) => `${title} 수정`,
    delete: (title) => `${title} 삭제`,
  },
  search: { searchPlaceholder: '제목·문구 검색' },
  empty: { title: '등록된 메인 비주얼이 없습니다.' },
  reorderHint: '핸들을 드래그하거나 화살표 키로 순번을 바꿉니다.',
} as const

export type MainVisualListLabels = DeepPartialOneLevel<MainVisualListLabelsResolved>

/** 컬럼 머리글만 갈아끼울 때 — labels.columns와 같은 모양 */
export type MainVisualColumnLabels = ColumnLabels<MainVisualColumnKey>

/**
 * 섹션 ON/OFF — 기본값은 전부 true.
 * false면 그 영역이 DOM에서 완전히 사라진다(빈 자리·여백·구분선이 남지 않는다).
 * 표의 **열 단위** ON/OFF는 이 객체가 아니라 columnVisibility(AdminTable)로 한다.
 */
export type MainVisualListShow = {
  /** 페이지 헤더 — 타이틀·설명·[+ 등록] */
  header?: boolean
  /** 카테고리 탭(중고/렌탈/시공) */
  tabs?: boolean
  /** 검색·필터·정렬·건수 툴바 */
  toolbar?: boolean
  /** 하단 페이지네이션 + 페이지 크기 */
  pagination?: boolean
  /** 선택 체크박스 열 + 일괄 처리 바 */
  bulk?: boolean
  /** 드래그 핸들 열(순번 변경) */
  reorder?: boolean
  /** 관리 열 — 연필·휴지통(RowActions) */
  rowActions?: boolean
  /**
   * 표 우상단 '컬럼' 피커 버튼.
   * 미지정이면 기존 top-level columnPicker prop을 따른다(기본 false) — 기본 렌더는 바뀌지 않는다.
   */
  columnPicker?: boolean
  /**
   * 표 우상단 '내보내기' 버튼.
   * 이 화면은 원래 내보내기를 쓰지 않으므로 기본은 false다 — 켜야 버튼이 생긴다.
   */
  export?: boolean
}

export type MainVisualListProps = {
  /** @deprecated labels.title 을 쓰세요 (개별 prop이 labels보다 우선한다) */
  title?: string
  /** @deprecated labels.description 을 쓰세요 */
  description?: string
  show?: MainVisualListShow

  /** 탭 */
  tabs?: MainVisualTab[]
  tab?: string
  onTabChange?: (value: string) => void

  /** 표 — 이미 걸러진 현재 탭의 행들 */
  rows?: MainVisualRow[]
  /** 타입 배지 톤 — 기본: '히어로'만 primary, 나머지 secondary */
  typeTone?: (row: MainVisualRow) => AdminColumnTone

  /** 툴바 — 상태 필터 */
  statusOptions?: SelectOption[]
  status?: string
  onStatusChange?: (value: string) => void
  /** 툴바 — 제목·문구 검색 */
  keyword?: string
  onKeywordChange?: (value: string) => void
  /** @deprecated labels.search.searchPlaceholder 를 쓰세요 */
  searchPlaceholder?: string
  /** 툴바 — 정렬 */
  sortOptions?: SelectOption[]
  sort?: string
  onSortChange?: (value: string) => void
  /** 툴바 우측 건수 — 미지정 시 rows.length */
  total?: number

  /** 헤더 우측 등록 버튼 — 라벨은 현재 탭 이름을 물고 온다('중고 메인 비주얼 등록') */
  onCreate?: () => void
  /** @deprecated labels.create 을 쓰세요(개별 prop이 이긴다) */
  createLabel?: string
  /** 등록 버튼 아이콘 — 없으면 기본 Plus */
  createIcon?: ReactNode

  /** 행 액션 */
  onEdit?: (row: MainVisualRow) => void
  onDelete?: (row: MainVisualRow) => void
  onToggleActive?: (row: MainVisualRow, next: boolean) => void
  /** 드래그로 순번 변경 — 재정렬된 rows 전체를 돌려준다 */
  onReorder?: (rows: MainVisualRow[]) => void

  /** 일괄 처리 */
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  onBulkDelete?: (ids: string[]) => void
  bulkActions?: AdminBulkAction[]

  /** 페이지네이션 — page·totalPages를 함께 줘야 바가 뜬다(둘 다 이 화면이 직접 제어해야 한다) */
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void

  /** 열 단위 ON/OFF — AdminTable의 columnVisibility를 그대로 통과시킨다 */
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void
  /** 표 우상단 '컬럼' 피커 버튼 */
  columnPicker?: boolean

  loading?: boolean
  /** @deprecated labels.empty.title 을 쓰세요 */
  emptyText?: string
  density?: 'comfortable' | 'compact'
  /** 화면 문구를 통째로 갈아끼우는 단일 통로 — 개별 카피 prop이 우선한다 */
  labels?: MainVisualListLabels
}

/** 탭 — 레퍼런스와 같은 결(중고 2 / 렌탈 3 / 시공 2) */
export const MAIN_VISUAL_TABS: MainVisualTab[] = [
  { value: 'used', label: '중고', count: 2 },
  { value: 'rental', label: '렌탈', count: 3 },
  { value: 'build', label: '시공', count: 2 },
]

/** 탭별 목데이터 — 스토리가 탭을 바꾸면 이 표를 갈아 끼운다 */
export const MAIN_VISUAL_ROWS: Record<string, MainVisualRow[]> = {
  used: [
    {
      id: 'mv-used-1',
      order: 1,
      image: mockImage('중고', 'slate'),
      type: '히어로',
      title: '겨울 재고 정리 — 중고 장비 특가전',
      createdAt: '2026-05-12',
      updatedAt: '2026-06-30',
      createdBy: '홍성보',
      updatedBy: '김서연',
      active: true,
    },
    {
      id: 'mv-used-2',
      order: 2,
      image: mockImage('매입', 'sand'),
      type: '히어로',
      title: '검증된 중고 굴착기 상시 매입 안내',
      createdAt: '2026-04-02',
      updatedAt: '2026-04-18',
      createdBy: '박준호',
      updatedBy: '박준호',
      active: false,
    },
  ],
  rental: [
    {
      id: 'mv-rental-1',
      order: 1,
      image: mockImage('렌탈', 'sage'),
      type: '히어로',
      title: '단기 렌탈 3일 무료 체험 이벤트',
      createdAt: '2026-06-01',
      updatedAt: '2026-07-02',
      createdBy: '김서연',
      updatedBy: '홍성보',
      active: true,
    },
    {
      id: 'mv-rental-2',
      order: 2,
      // 썸네일이 없는 행 — 표가 공용 Placeholder를 대신 그린다
      type: '히어로',
      title: '월 렌탈 신규 고객 20% 할인',
      createdAt: '2026-05-21',
      updatedAt: '2026-05-29',
      createdBy: '이지훈',
      updatedBy: '김서연',
      active: true,
    },
    {
      id: 'mv-rental-3',
      order: 3,
      image: mockImage('상담', 'dusk'),
      type: '서브',
      title: '현장 맞춤 장비 렌탈 상담 신청',
      createdAt: '2026-03-14',
      updatedAt: '2026-06-11',
      createdBy: '박준호',
      updatedBy: '이지훈',
      active: false,
    },
  ],
  build: [
    {
      id: 'mv-build-1',
      order: 1,
      image: mockImage('시공', 'slate'),
      type: '히어로',
      title: '시공 실적 500건 돌파 감사 인사',
      createdAt: '2026-02-09',
      updatedAt: '2026-07-01',
      createdBy: '홍성보',
      updatedBy: '홍성보',
      active: true,
    },
    {
      id: 'mv-build-2',
      order: 2,
      image: mockImage('실측', 'sage'),
      type: '서브',
      title: '무료 현장 실측 신청 접수 중',
      createdAt: '2026-01-27',
      updatedAt: '2026-03-03',
      createdBy: '김서연',
      updatedBy: '박준호',
      active: true,
    },
  ],
}

const STATUS_ORDER: ('all' | 'active' | 'inactive')[] = ['all', 'active', 'inactive']
const SORT_ORDER: ('order' | 'latest' | 'title')[] = ['order', 'latest', 'title']

/** 기본 타입 톤 — 히어로만 강조, 나머지는 중립 */
function defaultTypeTone(row: MainVisualRow): AdminColumnTone {
  return row.type === '히어로' ? 'primary' : 'secondary'
}

/**
 * MainVisualList — 메인 비주얼 관리 목록 화면(AdminListPage 프리셋).
 *
 * 골격(헤더·탭·툴바·표)은 셸이 갖는다. 이 화면은 무상태다 — rows는 이미 걸러진 현재 탭의 행이고,
 * 탭·상태·검색·정렬·페이지·선택은 전부 부모가 값을 쥐고 onXChange로 갱신한다(셸에도 matchTab·
 * matchKeyword·orderRows를 넘기지 않아 rows를 다시 거르거나 정렬하지 않는다).
 */
export function MainVisualList({
  title,
  description,
  show,
  tabs = MAIN_VISUAL_TABS,
  tab,
  onTabChange,
  rows = MAIN_VISUAL_ROWS.used,
  typeTone = defaultTypeTone,
  statusOptions,
  status = 'all',
  onStatusChange,
  keyword = '',
  onKeywordChange,
  searchPlaceholder,
  sortOptions,
  sort = 'order',
  onSortChange,
  total,
  onCreate,
  createLabel,
  createIcon,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  selectedIds = [],
  onSelectChange,
  onBulkDelete,
  bulkActions = [],
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnPicker = false,
  loading = false,
  emptyText,
  density = 'comfortable',
  labels,
}: MainVisualListProps) {
  const L = mergeLabels(DEFAULT_MAIN_VISUAL_LIST_LABELS, labels)

  // 기본값 전부 true — 명시적으로 false를 준 섹션만 사라진다
  const showHeader = show?.header !== false
  const showTabs = show?.tabs !== false && tabs.length > 0
  const showToolbar = show?.toolbar !== false
  const showBulk = show?.bulk !== false
  const showReorder = show?.reorder !== false
  const showRowActions = show?.rowActions !== false
  // 컬럼 피커는 기존 top-level prop(기본 false)이 기본값이고, 내보내기는 이 화면에 원래 없었다.
  const showColumnPicker = show?.columnPicker ?? columnPicker
  const showExport = show?.export ?? false

  const currentTab = tab ?? tabs[0]?.value ?? ''
  const currentTabLabel = tabs.find((item) => item.value === currentTab)?.label ?? ''

  // '중고 메인 비주얼 등록' — 버튼 문구가 현재 탭을 물고 온다
  const addLabel = resolveLabel(createLabel, L.create(currentTabLabel)) ?? L.create(currentTabLabel)

  const statusOptionItems: SelectOption[] =
    statusOptions ?? STATUS_ORDER.map((key) => ({ value: key, label: L.status[key] }))
  const sortOptionItems: SelectOption[] =
    sortOptions ?? SORT_ORDER.map((key) => ({ value: key, label: L.sort[key] }))

  /*
   * 원래 이 화면은 page/totalPages를 둘 다 받아야만(그리고 show.pagination이 켜져 있어야만)
   * 하단 바가 떴다(둘 중 하나라도 없으면 AdminTable이 바를 그리지 않았다). 페이지 크기 Select도
   * pageSize·onPageSizeChange가 둘 다 있어야 떴다. 셸은 값이 없어도 스스로 1페이지를 만들어
   * 내부 상태로 페이지네이션을 켜 버리므로, 그 축까지 명시적으로 꺼서 예전처럼 "값을 받은 만큼만"
   * 켜지게 한다.
   */
  const paginationWired = page != null && totalPages != null
  const pageSizeWired = pageSize != null && onPageSizeChange != null

  // ── 컬럼 조합 ────────────────────────────────────────────────────────
  // select/drag/actions는 columnVisibility로 끌 수 없는 kind라 show 키가 직접 넣고 뺀다.
  const columns: AdminColumn<MainVisualRow>[] = []

  if (showBulk) columns.push({ kind: 'select', key: 'select' })
  if (showReorder) columns.push({ kind: 'drag', key: 'drag' })

  columns.push(
    { kind: 'index', key: 'order', header: L.columns.order },
    { kind: 'thumbnail', key: 'image', header: L.columns.image },
    { kind: 'type', key: 'type', header: L.columns.type, tone: typeTone },
    // 제목은 좁아져도 줄바꿈 없이 말줄임(AdminTable .title)
    { kind: 'title', key: 'title', header: L.columns.title, onClick: onEdit },
    { kind: 'date', key: 'createdAt', header: L.columns.createdAt },
    { kind: 'date', key: 'updatedAt', header: L.columns.updatedAt },
    { kind: 'user', key: 'createdBy', header: L.columns.createdBy },
    { kind: 'user', key: 'updatedBy', header: L.columns.updatedBy },
    { kind: 'status', key: 'active', header: L.columns.active },
  )

  if (showRowActions) {
    columns.push({
      kind: 'actions',
      key: 'actions',
      header: L.columns.actions,
      // 표 기본 액션 대신 공용 RowActions를 쓴다 — 아이콘·툴팁·전파 차단이 한 곳에 있다
      render: (row) => (
        <RowActions
          size="sm"
          onEdit={() => onEdit?.(row)}
          onDelete={() => onDelete?.(row)}
          labels={{ edit: L.rowActions.edit(row.title), delete: L.rowActions.delete(row.title) }}
        />
      ),
    })
  }

  return (
    <AdminListPage
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      total={total}
      loading={loading}
      title={resolveLabel(title, L.title)}
      description={resolveLabel(description, L.description)}
      onCreate={onCreate}
      createLabel={addLabel}
      createIcon={createIcon ?? <Plus size={16} aria-hidden="true" />}
      tabs={tabs}
      tab={currentTab}
      onTabChange={onTabChange}
      search="inline"
      keyword={keyword}
      onKeywordChange={onKeywordChange}
      searchPlaceholder={resolveLabel(searchPlaceholder, L.search.searchPlaceholder)}
      toolbarSelects={[
        {
          key: 'status',
          value: status,
          options: statusOptionItems,
          onChange: (value) => onStatusChange?.(value),
        },
      ]}
      sortOptions={sortOptionItems}
      sort={sort}
      onSortChange={(value) => onSortChange?.(value)}
      // 레퍼런스 표기는 접두사 없는 "2건" — 셸 기본값('총')이 끼어들지 않게 빈 문자열로 지운다
      totalLabel=""
      selection={showBulk ? 'multi' : 'none'}
      selectedIds={selectedIds}
      onSelectChange={onSelectChange}
      bulkActions={bulkActions}
      onBulkDelete={onBulkDelete}
      onReorder={showReorder ? onReorder : undefined}
      onToggleStatus={onToggleActive}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      columnPicker={showColumnPicker}
      exportable={showExport}
      exportFilename="메인비주얼"
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
      emptyText={resolveLabel(emptyText, L.empty.title)}
      // 표 크롬 문구는 셸이 AdminTable로 그대로 통과시킨다 — 넘기지 않으면 undefined라 기본값이 그대로 산다
      labels={{ table: L.table }}
      density={density}
      // 드래그가 실제로 동작할 때만 안내를 남긴다 — 꺼져 있으면 자리도 없다
      footerNote={
        showReorder && onReorder != null && rows.length > 1 ? (
          <p className={styles.hint}>
            <span className={styles.hintIcon} aria-hidden="true">
              <GripVertical size={14} />
            </span>
            {L.reorderHint}
          </p>
        ) : undefined
      }
      show={{
        header: showHeader,
        tabs: showTabs,
        toolbar: showToolbar,
        pagination: (show?.pagination !== false) && paginationWired,
        pageSize: (show?.pagination !== false) && pageSizeWired,
      }}
    />
  )
}
