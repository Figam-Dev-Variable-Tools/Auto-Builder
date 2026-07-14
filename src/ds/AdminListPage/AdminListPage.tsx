import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  mergeLabels,
  resolveLabel,
  resolveText,
  type BulkLabels,
  type ConfirmDialogLabels,
  type EmptyLabels,
  type Formatters,
  type LoadingLabels,
  type SearchLabels,
  type TotalLabels,
} from '../../shared/labels'
import styles from './AdminListPage.module.css'
import { AdminPageLayout } from '../AdminPageLayout/AdminPageLayout'
import { AdminListView } from '../AdminListView/AdminListView'
import {
  AdminTable,
  type AdminBulkAction,
  type AdminColumn,
  type AdminColumnKind,
  type AdminTableLabels,
} from '../AdminTable/AdminTable'
import { Button } from '../Button/Button'
import {
  CategoryTabs,
  type CategoryTabItem,
  type CategoryTabsLabels,
} from '../CategoryTabs/CategoryTabs'
import { CrudDialog } from '../CrudDialog/CrudDialog'
import { ListToolbar, type ListToolbarSelect } from '../ListToolbar/ListToolbar'
import { Loading } from '../Loading/Loading'
import {
  SearchPanel,
  type SearchFieldDef,
  type SearchPanelLabels,
  type SearchValues,
} from '../SearchPanel/SearchPanel'
import type { SelectOption } from '../Select/Select'
import type { ViewSwitchValue } from '../ViewSwitch/ViewSwitch'

/*
 * 왜 이 컴포넌트가 있나 —
 * 어드민 목록 화면 13종은 골격이 한 글자도 다르지 않다.
 *   AdminPageLayout(헤더 · 탭 · 툴바) → SearchPanel|ListToolbar → AdminTable(선택·일괄·페이징·컬럼·내보내기)
 * 화면마다 진짜로 다른 건 세 가지뿐이다 — 컬럼 배열, 상태 enum(라벨/톤), 한국어 문구.
 * 그 세 가지만 화면에 남기고 골격·상태(선택/페이지/탭/검색어)·조립은 전부 이 셸이 갖는다.
 * 화면은 이 셸을 조합해서 쓰고, 공용 조각(AdminTable·SearchPanel…)은 절대 다시 만들지 않는다.
 *
 * 본문은 세 갈래다(선언한 prop이 고른다) —
 *   기본        : AdminTable
 *   renderCard  : AdminListView(카드형/게시물형 전환 + 카드 그리드) — 상품 목록
 *   renderBody  : 표가 아닌 목록(행이 곧 카드인 주문 목록) — 셸은 골격만 주고 본문은 화면이 그린다
 */

/**
 * 요소 ON/OFF — 전부 기본 true(오너 확정 규약).
 * false면 그 요소가 DOM에서 통째로 사라진다(빈 자리·여백·구분선이 남지 않는다).
 * 열 단위 ON/OFF는 여기가 아니라 AdminTable의 columnPicker가 담당한다.
 */
export type AdminListPageShow = {
  /** 페이지 헤더 — 타이틀 · 설명 · 등록 버튼 */
  header?: boolean
  /** 상태 탭(CategoryTabs) */
  tabs?: boolean
  /** 흰 카드 툴바(ListToolbar) — 건수·정렬·인라인 검색의 부모다 */
  toolbar?: boolean
  /** 검색 — search='panel'이면 SearchPanel, 'inline'이면 툴바 안 검색 입력 */
  search?: boolean
  /** 툴바 안 "총 N건" */
  count?: boolean
  /** 표 하단 페이지네이션 + 페이지 크기 — false면 rows를 자르지 않고 전부 그린다 */
  pagination?: boolean
  /**
   * 표 하단 '20개씩' 페이지 크기 Select — false면 페이지네이션은 두되 크기 선택만 감춘다.
   * 크기를 고정해 쓰는 화면(InquiryManageList처럼 원래 이 컨트롤이 없던 목록)을 위한 축이다.
   */
  pageSize?: boolean
  /** 선택 시 표 하단에 뜨는 일괄 처리 버튼들(선택 삭제 포함) */
  bulk?: boolean
  /** 행의 관리/케밥 컬럼 — false면 그 컬럼만 표에서 빠진다 */
  rowActions?: boolean
  /** 표 우상단 '컬럼' 피커 */
  columnPicker?: boolean
  /** 표 우상단 CSV/Excel 내보내기 */
  export?: boolean
}

/** 컬럼 선언 안에서 셸의 기능을 부르기 위한 통로 — 지금은 삭제 확인창 하나뿐 */
export type AdminListRowContext = {
  /**
   * 삭제 확인창을 연다(deleteConfirm이 없으면 즉시 onBulkDelete).
   * 행 케밥의 '삭제'처럼 컬럼 안에서 확인창을 띄워야 할 때 쓴다 — 확인창 상태는 셸이 갖는다.
   */
  confirmDelete: (ids: string[]) => void
}

/** 컬럼 — 배열이거나, 셸 기능이 필요하면 ctx를 받는 함수 */
export type AdminListColumns<T> =
  | AdminColumn<T>[]
  | ((ctx: AdminListRowContext) => AdminColumn<T>[])

/** panel=상단 SearchPanel(다중 조건) / inline=툴바 안 한 줄 검색 / false=검색 없음 */
export type AdminListSearchMode = 'panel' | 'inline' | false

/**
 * 화면 골격 —
 *   page  : AdminPageLayout(헤더·탭·좌측 레일·툴바·본문). 페이지 컨테이너(패딩 40)를 겸한다.
 *   plain : 골격 없이 조각(검색 패널 · 탭 · 툴바 · 본문)만 세로로 쌓는다.
 *           바깥이 이미 PageContainer인 '끼워 넣는 목록 프리셋'용 — 패딩이 두 번 먹지 않게.
 *   card  : plain + 카드 껍데기(보더·radius). 모달·탭 패널 안에 얹는 목록이
 *           div를 덧대지 않아도 되게 한다.
 */
export type AdminListChrome = 'page' | 'plain' | 'card'

/**
 * 행 선택 축 —
 *   multi : 체크박스 다중 선택(기본, 지금까지의 동작)
 *   single: 한 번에 한 건만 — 새로 고른 행이 이전 선택을 대체한다(선택 컬럼은 그대로 둔다)
 *   none  : 선택 없음 — 선택 컬럼과 일괄 처리 바가 통째로 사라진다(읽기 전용 목록)
 *
 * 지금까지 이 축은 columns 배열의 kind='select' 선언에 묻혀 있어 prop 하나로 표현할 수 없었다.
 */
export type AdminListSelection = 'multi' | 'single' | 'none'

/**
 * 삭제 확인창 — 공용 ConfirmDialogLabels를 그대로 쓰고 title만 필수로 좁힌다(재정의 금지).
 * 제목이 있어야 확인창이 열리기 때문이다. description의 함수형 인자는 삭제 대상 id들이다.
 */
export type AdminListDeleteConfirm = ConfirmDialogLabels & { title: string }

/**
 * 셸의 문구 — 타입은 전부 src/shared/labels.ts의 공용 타입을 그대로 쓴다(재정의 금지).
 *
 * 두 갈래다.
 *  1) 셸이 직접 그리는 것(등록 버튼·카드형 선택 바·로딩·건수·빈 상태·삭제 확인창)
 *  2) 자식에게 그대로 통과시키는 것(table · searchPanel · tabs) — 자식의 labels 타입을 그대로 받는다.
 *     자식이 이미 완결된 문구 타입을 갖고 있으므로 여기서 키를 다시 세지 않는다.
 */
export type AdminListPageLabels = {
  /** 카드형 로딩 오버레이 + 표 로딩 오버레이 — 기본 '불러오는 중' */
  loading?: LoadingLabels['loading']
  /** 헤더 등록 버튼 — 기본 '등록' */
  create?: string
  /** 툴바·카드뷰 건수 — count(통째 교체)까지 ListToolbar·AdminListView로 내려간다 */
  total?: TotalLabels
  /** 툴바 안 한 줄 검색 — search는 입력의 접근성 이름이다(검색 패널 문구는 searchPanel이 맡는다) */
  search?: Pick<SearchLabels, 'search' | 'searchPlaceholder'>
  /** 선택 바 — 카드형은 셸이 그리고, 표 하단은 AdminTable이 그린다(같은 문구가 둘 다에 닿는다) */
  bulk?: BulkLabels
  /** 삭제 확인창 — 개별 prop deleteConfirm이 이긴다 */
  deleteDialog?: ConfirmDialogLabels
  /** 데이터가 0건일 때 — actionLabel을 주면 onEmptyAction과 짝이 되어 CTA 버튼이 뜬다 */
  empty?: EmptyLabels
  /** 탭·검색으로 걸러져 0건일 때 — 개별 prop이 없는 새 표면이라 걸러진 상태에서는 이쪽이 먼저 쓰인다 */
  emptyFiltered?: EmptyLabels
  /** 표 — AdminTable로 그대로 통과(컬럼 헤더·행 액션·메모·내보내기·페이지 크기 …) */
  table?: AdminTableLabels
  /** 검색 패널(다중 조건) — SearchPanel로 그대로 통과(초기화·검색·상세검색·기간 프리셋 …) */
  searchPanel?: SearchPanelLabels
  /** 상태 탭 — CategoryTabs로 그대로 통과(탭 삭제·카테고리 추가) */
  tabs?: CategoryTabsLabels
}

/*
 * 기본 문구 값의 단일 출처 —
 * Button.label처럼 string이 필수인 자리에서 최종 폴백으로도 쓰이므로 상수로 뽑는다(같은 값을 두 번 적지 않는다).
 */
const DEFAULT_CREATE_LABEL = '등록'
const DEFAULT_BULK_DELETE_LABEL = '선택 삭제'

/**
 * 문구 기본값.
 * bulk.selectedCount는 일부러 비워 둔다 — 넘기지 않으면 셸이 지금까지처럼 '선택 <strong>3</strong>건'을
 * 그리고(숫자만 강조), 함수를 주면 그 문자열로 통째 교체한다.
 * empty/emptyFiltered도 비워 둔다 — 빈 상태 기본 문구는 AdminTable이 단일 출처다.
 */
export const DEFAULT_ADMIN_LIST_PAGE_LABELS: AdminListPageLabels = {
  loading: '불러오는 중',
  create: DEFAULT_CREATE_LABEL,
  total: { prefix: '총', unit: '건' },
  bulk: { delete: DEFAULT_BULK_DELETE_LABEL },
  deleteDialog: { cancelLabel: '취소' },
}

export type AdminListPageProps<T> = {
  /* ── 데이터 ── */
  /** 전체 행 — 탭·검색·페이징은 셸이 이 배열에 대해 처리한다 */
  rows: T[]
  /** 표 컬럼 — renderBody로 표를 대체하는 화면에서는 비워 둔다 */
  columns?: AdminListColumns<T>
  rowKey: (row: T) => string
  /** 서버 페이징 시 전체 건수 — 없으면 걸러진 rows 길이를 쓴다 */
  total?: number
  /**
   * 서버 페이징 시 전체 페이지 수 — 주면 rows를 자르지 않는다(서버가 이미 잘라 보냈다).
   * 없으면 걸러진 rows를 pageSize로 셸이 직접 자른다(클라이언트 페이징).
   */
  totalPages?: number
  loading?: boolean

  /* ── 골격 ── */
  /** 기본 'page'(AdminPageLayout). 'plain'이면 헤더·좌측 레일 없이 조각만 쌓는다 */
  chrome?: AdminListChrome

  /* ── 헤더 ── */
  title?: string
  description?: string
  /** 등록 버튼 왼쪽에 붙는 추가 액션(엑셀 다운로드 등) */
  headerActions?: ReactNode
  /** 있으면 헤더 우측에 등록 버튼 */
  onCreate?: () => void
  /**
   * 등록 버튼 문구 (기본 '등록').
   * @deprecated labels.create를 쓴다(개별 prop이 이긴다 — 기존 화면은 그대로 동작한다)
   */
  createLabel?: string
  /** 등록 버튼 아이콘 (기본 Plus) */
  createIcon?: ReactNode

  /* ── 탭 ── */
  /** 탭 목록 — count를 비워 두면 matchTab으로 rows에서 센다 */
  tabs?: CategoryTabItem[]
  /** 선택된 탭 — 주지 않으면 셸이 내부 상태로 관리한다(비제어) */
  tab?: string
  onTabChange?: (value: string) => void
  /** 있으면 탭 끝에 '+ 추가'가 생긴다 — 없으면 탭은 고정 목록이다 */
  onTabAdd?: (label: string) => void
  /** 탭 필터 — 없으면 탭은 표시만 하고 rows를 좁히지 않는다(서버 필터 전제) */
  matchTab?: (row: T, tab: string) => boolean
  /**
   * 탭 배지 건수 계산에 쓰는 전체 행 — 미지정이면 rows를 그대로 쓴다.
   * 화면이 셸이 모르는 축(브랜드 등)으로 rows를 이미 좁혀서 넘기는 경우(CategoryList의 브랜드 필터처럼)
   * 탭 배지는 그 축과 무관하게 전체 기준이어야 한다 — 그 필터 전의 전체 집합을 여기로 넘긴다.
   */
  tabCountRows?: T[]

  /* ── 검색 ── */
  search?: AdminListSearchMode
  /** panel 모드의 조건 필드 */
  searchFields?: SearchFieldDef[]
  /** 검색 조건 값 — 주지 않으면 비제어 */
  searchValues?: SearchValues
  onSearchValuesChange?: (values: SearchValues) => void
  /** 검색 실행 — panel은 현재 조건, inline은 { keyword } 를 넘긴다 */
  onSearch?: (values: SearchValues) => void
  /** 초기화 — 셸이 조건을 비우고 onSearch(빈 조건)를 부른 뒤 호출한다 */
  onReset?: () => void
  /** inline 모드 검색어 — 주지 않으면 비제어 */
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  /**
   * 한 줄 검색 입력의 플레이스홀더.
   * @deprecated labels.search.searchPlaceholder를 쓴다(개별 prop이 이긴다)
   */
  searchPlaceholder?: string
  /** inline 모드의 클라이언트 필터 — 없으면 검색어가 rows를 좁히지 않는다(서버 검색 전제) */
  matchKeyword?: (row: T, keyword: string) => boolean

  /* ── 툴바 ── */
  /** 툴바 좌측 필터 Select들(검색 유형·상태 등) — 검색 입력 왼쪽에 붙는다 */
  toolbarSelects?: ListToolbarSelect[]
  sortOptions?: SelectOption[]
  /** 선택된 정렬 — 주지 않으면 비제어(첫 옵션) */
  sort?: string
  onSortChange?: (value: string) => void
  /**
   * 건수 앞 문구 (기본 '총'). null이면 접두사 없이 숫자만 — "135건"
   * @deprecated labels.total.prefix를 쓴다(개별 prop이 이긴다)
   */
  totalLabel?: string | null
  /**
   * 건수 단위 (기본 '건')
   * @deprecated labels.total.unit을 쓴다(개별 prop이 이긴다)
   */
  totalUnit?: string
  /** 툴바 우측 끝 추가 액션 */
  toolbarActions?: ReactNode
  /**
   * 화면 순서 — 탭·검색으로 걸러진 뒤, 페이지로 자르기 전에 부른다.
   * 정렬 Select(sort)의 현재 값을 함께 받는다(고정 공지 우선처럼 sort와 무관한 정렬도 여기서).
   */
  orderRows?: (rows: T[], sort: string | null) => T[]

  /* ── 표 ── */
  /** 행 선택 축 (기본 multi) */
  selection?: AdminListSelection
  /** 선택된 행 — 주지 않으면 비제어 */
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  /** 선택 시 표 하단에 뜨는 버튼들 — 실행 후 선택은 셸이 비운다 */
  bulkActions?: AdminBulkAction[]
  /**
   * 일괄 처리 후 선택 해제 (기본 true).
   * false면 셸이 손대지 않는다 — 버튼이 확인창을 여는 화면(담당자 변경·카테고리 변경)은
   * 확인/취소가 끝난 뒤에 스스로 정리해야 하므로 여기서 미리 비우면 대상 건수를 잃는다.
   */
  clearSelectionOnBulk?: boolean
  /** 선택 삭제 — deleteConfirm이 있으면 확인 후에만 호출된다 */
  onBulkDelete?: (ids: string[]) => void
  /** 제목 클릭 — 컬럼이 onClick을 직접 선언하지 않았으면 첫 제목 컬럼에 물린다 */
  onRowOpen?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onToggleStatus?: (row: T, next: boolean) => void
  onReorder?: (rows: T[]) => void
  onMemoChange?: (row: T, memo: string) => void
  columnPicker?: boolean
  /**
   * 열 표시 상태(제어) — AdminTable의 같은 prop으로 그대로 넘어간다.
   * 셸이 이걸 막고 있으면 화면이 컬럼 배열을 미리 걸러야 하고, 그러면 표의 '컬럼' 피커로
   * 다시 켤 수가 없다(피커가 모르는 컬럼이 된다). 그래서 통과시킨다.
   */
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void
  exportable?: boolean
  exportFilename?: string
  /** 페이지 — 주지 않으면 비제어 */
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  density?: 'compact' | 'comfortable'
  /**
   * AdminTable의 같은 prop을 그대로 통과시킨다 — 페이지 크기 Select·일괄 처리 바·페이지네이션이
   * 셋 다 없을 때도 하단 footer 줄(32px)을 그릴지. 기본 true(= 지금 화면 그대로).
   * false로 주는 화면은 셋 다 없을 때 그 빈 줄이 여백으로 남지 않고 접힌다.
   */
  showFooterWhenEmpty?: boolean
  /**
   * 빈 표 문구 (기본 AdminTable의 '데이터가 없습니다.').
   * @deprecated labels.empty.title을 쓴다(개별 prop이 이긴다).
   * 탭·검색으로 걸러져 0건인 상태는 labels.emptyFiltered가 따로 맡는다 — 이 prop 하나로는 두 상태를 가를 수 없었다.
   */
  emptyText?: string
  /** 빈 목록의 CTA — labels.table.empty.actionLabel과 짝이어야 버튼이 뜬다 */
  onEmptyAction?: () => void

  /* ── 본문 갈아끼우기 ── */
  /**
   * 카드형 렌더러 — 주면 본문이 AdminListView를 지난다(게시물형=AdminTable, 카드형=카드 그리드).
   * 페이지네이션은 AdminListView 하단 하나로 모이고, 표는 하단 바를 그리지 않는다.
   */
  renderCard?: (row: T) => ReactNode
  /** 카드형/게시물형 — 주지 않으면 셸이 내부 상태로 관리한다(비제어, 기본 게시물형) */
  view?: ViewSwitchValue
  onViewChange?: (view: ViewSwitchValue) => void
  /** AdminListView 상단 바 좌측 슬롯(내보내기·새로고침 등) — renderCard가 있을 때만 쓰인다 */
  viewToolbar?: ReactNode
  /**
   * 표를 통째로 대신하는 본문(행이 곧 카드인 주문 목록처럼).
   * 이걸 주면 AdminTable/AdminListView를 그리지 않는다 — 선택·페이징·빈 상태는 본문의 몫이다.
   * 셸은 헤더·탭·툴바·검색만 맡는다.
   */
  renderBody?: (rows: T[]) => ReactNode

  /**
   * 있으면 선택 삭제·행 삭제가 확인창을 거친다.
   * @deprecated labels.deleteDialog를 쓴다(개별 prop이 이긴다). labels.deleteDialog.title만 줘도 확인창이 열린다.
   */
  deleteConfirm?: AdminListDeleteConfirm
  /** 좌측 레일(카테고리 트리 등) */
  side?: ReactNode
  /** 좌측 레일 폭 (기본 240) */
  sideWidth?: number
  /**
   * 우측 레일 — '목록 + 우측 요약·미리보기' 화면.
   * 레이아웃에는 있던 자리인데 셸이 통과시키지 않아 그런 화면은 셸을 버리고 레이아웃을 직접 조립하고 있었다.
   */
  aside?: ReactNode
  /** 우측 레일 폭 (기본 360) */
  asideWidth?: number
  /** 우측 레일을 스크롤에 고정 (기본 true) */
  asideSticky?: boolean
  /** 콘텐츠 최대폭 — 1920 규격(full=1600 / lg=1200 / md=768). 기본 full */
  maxWidth?: 'md' | 'lg' | 'full'
  /**
   * 표 아래 슬롯 — '핸들을 드래그하거나 화살표 키로 순번을 바꿉니다' 같은 안내문 자리.
   * 이런 한 줄 때문에 화면이 셸을 못 쓰고 표를 직접 조립하던 것을 막는다.
   */
  footerNote?: ReactNode

  show?: AdminListPageShow
  /** 문구 통로 — 개별 prop > labels.* > 기본값 */
  labels?: AdminListPageLabels
  /**
   * 숫자·통화·날짜 포맷 — 문구가 아니라 포맷이라 labels가 아니다(§labels 규약 4).
   * 표(가격·수량 셀)와 건수 표기(툴바·카드뷰)가 같은 포맷을 쓰도록 한 통로로 내려보낸다.
   */
  formatters?: Formatters
}

/** 오너 규격 — 한 화면 20행, 페이지 크기 20/50/100 */
const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** 제목으로 읽히는 컬럼 — onRowOpen을 물릴 자리 */
const TITLE_KINDS: AdminColumnKind[] = ['title', 'titleTags', 'thumbTitle']

/** 행 액션 컬럼 — show.rowActions=false면 이것만 빠진다 */
const ROW_ACTION_KINDS: AdminColumnKind[] = ['actions', 'kebab']

/** 선택 컬럼 — selection='none'이면 이것만 빠진다 */
const SELECT_KIND: AdminColumnKind = 'select'

/** 검색 조건이 하나라도 걸려 있는가 — '데이터 0건'과 '걸러져서 0건'을 가르는 판단 */
function hasAnyValue(values: SearchValues): boolean {
  return Object.values(values).some((value) => {
    if (value == null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    // daterange — 시작·끝 중 하나라도 있으면 조건이 걸린 것이다
    return value.start != null || value.end != null
  })
}

/** 단일 선택 — 새로 고른 행이 이전 선택을 대체한다(체크박스 UI는 그대로 두고 결과만 한 건으로 좁힌다) */
function keepOne(prev: string[], next: string[]): string[] {
  if (next.length <= 1) return next
  const added = next.filter((id) => !prev.includes(id))
  // 새로 추가된 게 없으면(전체 선택 등) 마지막 행 하나만 남긴다
  return [added.at(-1) ?? next[next.length - 1]]
}

/**
 * show 기본값 — 전부 true.
 * 스프레드로 합치면 `show={{ header: undefined }}` 같은 명시적 undefined가 기본값을 덮어써
 * 헤더가 통째로 사라진다 — 그래서 키마다 ?? true 로 푼다(CustomerList와 같은 규약).
 */
function resolveShow(show: AdminListPageShow = {}): Required<AdminListPageShow> {
  return {
    header: show.header ?? true,
    tabs: show.tabs ?? true,
    toolbar: show.toolbar ?? true,
    search: show.search ?? true,
    count: show.count ?? true,
    pagination: show.pagination ?? true,
    pageSize: show.pageSize ?? true,
    bulk: show.bulk ?? true,
    rowActions: show.rowActions ?? true,
    columnPicker: show.columnPicker ?? true,
    export: show.export ?? true,
  }
}

/** 필드 선언 → 빈 값 객체 (초기 상태·초기화 공용) */
function emptyValues(fields: SearchFieldDef[]): SearchValues {
  const next: SearchValues = {}
  for (const field of fields) {
    if (field.kind === 'multiselect') next[field.key] = []
    else if (field.kind === 'daterange') next[field.key] = { start: null, end: null }
    else if (field.kind === 'select') next[field.key] = null
    else next[field.key] = ''
  }
  return next
}

/**
 * AdminListPage — 어드민 목록 화면의 공용 셸.
 *
 *   header  : title · description · headerActions · [등록]           (show.header)
 *   tabs    : CategoryTabs — count는 matchTab으로 rows에서 센다      (show.tabs)
 *   toolbar : search='panel' → SearchPanel(레이아웃 툴바 슬롯)
 *             search='inline'|false → ListToolbar(검색·정렬·건수·액션)
 *   content : [건수 바(panel 모드에서만 표 위로 내려온다)] + 본문(표 | 카드 뷰 | renderBody)
 *   dialog  : deleteConfirm이 있으면 CrudDialog(delete)
 *
 * 상태(탭·검색어·검색 조건·정렬·페이지·페이지 크기·선택·확인창·카드/게시물 전환)는 셸이 갖는다.
 * 같은 이름의 prop을 주면 그 값이 이긴다(제어) — 안 주면 내부 상태로 굴러간다(비제어).
 * 조건이 바뀌면(탭·검색 확정·페이지 크기) 페이지와 선택을 되돌린다 — 보이지 않는 행이 선택된 채 남지 않게.
 */
export function AdminListPage<T>({
  rows,
  columns = [],
  rowKey,
  total,
  totalPages,
  loading = false,
  chrome = 'page',
  title,
  description,
  headerActions,
  onCreate,
  createLabel,
  createIcon,
  tabs = [],
  tab,
  onTabChange,
  onTabAdd,
  matchTab,
  tabCountRows,
  search = 'panel',
  searchFields = [],
  searchValues,
  onSearchValuesChange,
  onSearch,
  onReset,
  keyword,
  onKeywordChange,
  searchPlaceholder,
  matchKeyword,
  toolbarSelects,
  sortOptions = [],
  sort,
  onSortChange,
  totalLabel,
  totalUnit,
  toolbarActions,
  orderRows,
  selection = 'multi',
  selectedIds,
  onSelectChange,
  bulkActions = [],
  clearSelectionOnBulk = true,
  onBulkDelete,
  onRowOpen,
  onEdit,
  onDelete,
  onToggleStatus,
  onReorder,
  onMemoChange,
  columnPicker = true,
  columnVisibility,
  onColumnVisibilityChange,
  exportable = true,
  exportFilename,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  density = 'compact',
  showFooterWhenEmpty = true,
  emptyText,
  onEmptyAction,
  renderCard,
  view,
  onViewChange,
  viewToolbar,
  renderBody,
  footerNote,
  deleteConfirm,
  side,
  sideWidth,
  aside,
  asideWidth,
  asideSticky,
  maxWidth = 'full',
  show,
  labels,
  formatters,
}: AdminListPageProps<T>) {
  const on = resolveShow(show)
  const L = mergeLabels(DEFAULT_ADMIN_LIST_PAGE_LABELS, labels)

  // 개별 prop > labels.* > 기본값 (기존 화면은 개별 prop만 쓰므로 화면이 바뀌지 않는다)
  const createText = resolveLabel(createLabel, L.create) ?? DEFAULT_CREATE_LABEL
  const bulkDeleteText = L.bulk?.delete ?? DEFAULT_BULK_DELETE_LABEL
  const totalPrefix = resolveLabel<string | null>(totalLabel, L.total?.prefix)
  const totalUnitText = resolveLabel(totalUnit, L.total?.unit)
  const searchPlaceholderText = resolveLabel(searchPlaceholder, L.search?.searchPlaceholder)

  // 제어값을 주면 그 값이 이긴다 — 안 주면 셸이 직접 들고 있는다
  const [innerTab, setInnerTab] = useState(tabs[0]?.value ?? '')
  const [innerKeyword, setInnerKeyword] = useState('')
  const [innerValues, setInnerValues] = useState<SearchValues>(() => emptyValues(searchFields))
  const [innerSort, setInnerSort] = useState(sortOptions[0]?.value ?? '')
  const [innerPage, setInnerPage] = useState(1)
  const [innerPageSize, setInnerPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [innerSelected, setInnerSelected] = useState<string[]>([])
  const [innerView, setInnerView] = useState<ViewSwitchValue>('board')
  // 삭제 확인 대기 중인 id들 — null이면 확인창이 닫힌 상태
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)

  const tabValue = tab ?? innerTab
  const keywordValue = keyword ?? innerKeyword
  const values = searchValues ?? innerValues
  const sortValue = sort ?? innerSort
  const size = pageSize ?? innerPageSize
  const selected = selectedIds ?? innerSelected
  const viewValue = view ?? innerView

  // ── 상태 변경 ─────────────────────────────────────────────────────────
  const changeSelection = (ids: string[]) => {
    // 선택 축이 single이면 결과를 한 건으로 좁힌다(표는 다중 선택 UI를 그대로 쓴다)
    const next = selection === 'single' ? keepOne(selected, ids) : ids
    if (selectedIds == null) setInnerSelected(next)
    onSelectChange?.(next)
  }

  const clearSelection = () => changeSelection([])

  /** 조건이 바뀌면 페이지·선택을 되돌린다 */
  const resetView = () => {
    if (page == null) setInnerPage(1)
    onPageChange?.(1)
    clearSelection()
  }

  const changeTab = (next: string) => {
    if (tab == null) setInnerTab(next)
    onTabChange?.(next)
    resetView()
  }

  const changeKeyword = (next: string) => {
    if (keyword == null) setInnerKeyword(next)
    onKeywordChange?.(next)
    // 클라이언트 필터(matchKeyword)가 없으면 타이핑만으로는 rows가 한 줄도 변하지 않는다 —
    // 그런 화면에서 페이지·선택을 되돌리면 검색을 확정하기도 전에 선택이 사라진다.
    if (matchKeyword != null) resetView()
  }

  const changeValues = (next: SearchValues) => {
    if (searchValues == null) setInnerValues(next)
    onSearchValuesChange?.(next)
  }

  const changeSort = (next: string) => {
    if (sort == null) setInnerSort(next)
    onSortChange?.(next)
    resetView()
  }

  const changePage = (next: number) => {
    if (page == null) setInnerPage(next)
    onPageChange?.(next)
  }

  const changePageSize = (next: number) => {
    if (pageSize == null) setInnerPageSize(next)
    onPageSizeChange?.(next)
    resetView()
  }

  const changeView = (next: ViewSwitchValue) => {
    if (view == null) setInnerView(next)
    onViewChange?.(next)
  }

  const handleSearch = () => {
    resetView()
    onSearch?.(values)
  }

  const handleReset = () => {
    // SearchPanel이 values를 비운 직후라 로컬 state는 아직 갱신 전 — 빈 값을 직접 만들어 넘긴다
    const empty = emptyValues(searchFields)
    changeValues(empty)
    resetView()
    onSearch?.(empty)
    onReset?.()
  }

  // 한 줄 검색의 엔터 — 조건 이름은 'keyword' 하나뿐이다. 확정된 순간에만 페이지·선택을 되돌린다
  const handleInlineSearch = (value: string) => {
    resetView()
    onSearch?.({ keyword: value })
  }

  // ── 행 파이프라인: 탭 → 검색 → 정렬 → 페이지 ──────────────────────────
  // 보이지 않는 필터는 없다 — 꺼진 요소는 결과를 좁히지 않는다(꺼진 이유가 화면에 보이지 않으므로).
  const query = keywordValue.trim()
  const searchable = on.toolbar && on.search && search === 'inline'

  const inTab = (row: T): boolean => !on.tabs || matchTab == null || matchTab(row, tabValue)
  const inKeyword = (row: T): boolean =>
    !searchable || matchKeyword == null || query === '' || matchKeyword(row, query)

  const filtered = rows.filter((row) => inTab(row) && inKeyword(row))
  const ordered = orderRows != null ? orderRows(filtered, sortValue === '' ? null : sortValue) : filtered

  /*
   * 빈 상태 문구 —
   * '데이터가 0건'과 '탭·검색으로 걸러져 0건'은 다른 문장이어야 한다(필터가 걸린 표에 "등록해 보세요"는 거짓말이다).
   * 걸러진 상태에는 개별 prop이 애초에 없었으므로(emptyText 하나뿐이었다) labels.emptyFiltered가 먼저 온다.
   */
  const firstTab = tabs[0]?.value ?? ''
  const narrowed =
    (searchable && query !== '') ||
    (on.tabs && matchTab != null && tabValue !== firstTab) ||
    (search === 'panel' && on.search && hasAnyValue(values))

  const emptyGroup = narrowed ? (L.emptyFiltered ?? L.empty) : L.empty
  const emptyTitle = narrowed
    ? resolveLabel(L.emptyFiltered?.title, emptyText, L.empty?.title)
    : resolveLabel(emptyText, L.empty?.title)
  const emptyDescription = emptyGroup?.description
  // CTA 문구도 상태를 따른다 — 걸러진 표의 '등록해 보세요'는 거짓말이고 '필터 초기화'가 맞는 말이다
  const emptyActionLabel = resolveLabel(emptyGroup?.actionLabel, L.table?.empty?.actionLabel)

  // totalPages를 주면 rows는 이미 서버가 잘라 보낸 한 페이지다 — 여기서 또 자르지 않는다
  const serverPaged = totalPages != null
  const pageCount = totalPages ?? Math.max(1, Math.ceil(ordered.length / size))
  // rows가 줄어 페이지가 범위를 벗어나도 빈 화면이 되지 않게 마지막 페이지로 클램프
  const current = Math.min(page ?? innerPage, pageCount)
  const paged =
    !on.pagination || serverPaged ? ordered : ordered.slice((current - 1) * size, current * size)
  const totalCount = total ?? ordered.length

  // 탭 건수 — count를 주면 그 값(서버 총계), 아니면 matchTab으로 센다.
  // 기준 집합은 tabCountRows(미지정이면 rows) — rows가 셸 밖 축(브랜드 등)으로 이미 좁혀졌어도
  // 탭 배지는 그 축과 무관한 전체 기준을 유지한다.
  const tabCountBase = tabCountRows ?? rows
  const tabItems: CategoryTabItem[] = tabs.map((item) => ({
    ...item,
    count:
      item.count ??
      (matchTab != null ? tabCountBase.filter((row) => matchTab(row, item.value)).length : undefined),
  }))

  // ── 삭제 · 일괄 처리 ──────────────────────────────────────────────────
  // 개별 prop(deleteConfirm) > labels.deleteDialog. 제목이 있어야 확인창을 띄운다(제목 없는 확인창은 없다)
  const dialogTitle = resolveLabel(deleteConfirm?.title, L.deleteDialog?.title)
  const dialogDescription = resolveLabel(deleteConfirm?.description, L.deleteDialog?.description)
  const dialogConfirmLabel = resolveLabel(deleteConfirm?.confirmLabel, L.deleteDialog?.confirmLabel)
  const dialogCancelLabel = resolveLabel(deleteConfirm?.cancelLabel, L.deleteDialog?.cancelLabel)

  const confirmDelete = (ids: string[]) => {
    if (ids.length === 0) return
    if (dialogTitle != null) {
      setPendingDelete(ids)
      return
    }
    onBulkDelete?.(ids)
    if (clearSelectionOnBulk) clearSelection()
  }

  const runDelete = () => {
    if (pendingDelete != null) {
      onBulkDelete?.(pendingDelete)
      // 지운 행만 선택에서 뺀다 — 행 케밥으로 한 건만 지웠을 때 나머지 선택까지 잃지 않게
      const done = new Set(pendingDelete)
      changeSelection(selected.filter((id) => !done.has(id)))
    }
    setPendingDelete(null)
  }

  // 선택이 없는 목록에는 일괄 처리도 없다 — 대상이 되는 선택 자체가 만들어지지 않는다
  const bulkEnabled = on.bulk && selection !== 'none'

  // 일괄 처리 후 선택은 비운다 — 화면에서 사라졌거나 상태가 바뀐 행이 선택된 채 남지 않게
  // (확인창을 여는 버튼은 대상 건수를 잃으므로 clearSelectionOnBulk=false로 끈다)
  const tableBulkActions: AdminBulkAction[] = bulkEnabled
    ? bulkActions.map((action) => ({
        ...action,
        onAction: (ids: string[]) => {
          action.onAction(ids)
          if (clearSelectionOnBulk) clearSelection()
        },
      }))
    : []

  // ── 컬럼 ──────────────────────────────────────────────────────────────
  const declared = typeof columns === 'function' ? columns({ confirmDelete }) : columns
  const withActions = on.rowActions
    ? declared
    : declared.filter((col) => !ROW_ACTION_KINDS.includes(col.kind))
  // selection='none'이면 체크박스 열이 통째로 빠진다(빈 열이 남지 않는다)
  const shown =
    selection === 'none' ? withActions.filter((col) => col.kind !== SELECT_KIND) : withActions

  // onRowOpen은 제목 컬럼의 onClick으로 내려간다 — 컬럼이 onClick을 직접 선언했으면 그쪽이 이긴다
  const titleIndex = shown.findIndex(
    (col) => TITLE_KINDS.includes(col.kind) && col.onClick == null,
  )
  const tableColumns =
    onRowOpen == null || titleIndex < 0
      ? shown
      : shown.map((col, i) => (i === titleIndex ? { ...col, onClick: onRowOpen } : col))

  // ── 슬롯 ──────────────────────────────────────────────────────────────
  const createButton =
    onCreate != null ? (
      <Button
        variant="primary"
        size="md"
        label={createText}
        showLeftIcon
        leftIcon={createIcon ?? <Plus size={16} aria-hidden="true" />}
        onClick={onCreate}
      />
    ) : null

  const actions =
    on.header && (headerActions != null || createButton != null) ? (
      <>
        {headerActions}
        {createButton}
      </>
    ) : undefined

  const panel =
    search === 'panel' && on.search && searchFields.length > 0 ? (
      <SearchPanel
        fields={searchFields}
        values={values}
        onChange={changeValues}
        onSearch={handleSearch}
        onReset={handleReset}
        columns={4}
        loading={loading}
        labels={L.searchPanel}
      />
    ) : undefined

  const tabsNode =
    on.tabs && tabItems.length > 0 ? (
      <CategoryTabs
        items={tabItems}
        value={tabValue}
        onChange={changeTab}
        onAdd={onTabAdd}
        addable={onTabAdd != null}
        labels={L.tabs}
      />
    ) : undefined

  // 요소가 하나도 없으면 ListToolbar가 스스로 카드째 사라진다(빈 보더가 남지 않는다)
  const listToolbar = on.toolbar ? (
    <ListToolbar
      selects={toolbarSelects}
      search={
        searchable
          ? {
              value: keywordValue,
              onChange: changeKeyword,
              placeholder: searchPlaceholderText,
              onSearch: handleInlineSearch,
              disabled: loading,
            }
          : undefined
      }
      sort={
        sortOptions.length > 0
          ? { value: sortValue, options: sortOptions, onChange: changeSort }
          : undefined
      }
      total={on.count ? totalCount : undefined}
      // null = 접두사 없이 숫자만("135건") — ListToolbar는 undefined일 때 접두사를 생략한다
      totalLabel={totalPrefix ?? undefined}
      totalUnit={totalUnitText}
      // 접근성 이름과 '건수 문장 통째 교체'는 개별 prop이 없다 — labels로만 닿는다
      labels={{
        search: { search: L.search?.search },
        total: { count: L.total?.count },
      }}
      formatters={formatters}
      actions={toolbarActions}
    />
  ) : undefined

  // ── 본문 ──────────────────────────────────────────────────────────────
  const cardMode = renderCard != null

  /*
   * 표 문구 — labels.table을 그대로 통과시키되, 셸이 이미 갖고 있던 두 문구를 기본값으로 얹는다.
   *   bulk    : 선택 바는 표(하단)와 카드 그리드 두 곳에 뜬다 — 같은 문구를 두 번 선언하지 않는다.
   *   loading : 로딩 오버레이도 표·카드가 함께 쓴다.
   * 더 구체적인 labels.table.*이 셸의 값을 이긴다.
   * (loadingLabel 개별 prop으로 넘기면 그 prop이 labels를 항상 이겨 labels.table.loading이 죽는다)
   */
  const tableLabels: AdminTableLabels = {
    ...L.table,
    bulk: { ...L.bulk, ...L.table?.bulk },
    loading: resolveLabel(L.table?.loading, L.loading),
    // 제목·설명은 개별 prop(emptyText/emptyDescription)으로 내려간다 — 여기서는 CTA만 얹는다
    empty: { ...L.table?.empty, actionLabel: emptyActionLabel },
  }

  const table = (
    <AdminTable
      columns={tableColumns}
      rows={paged}
      rowKey={rowKey}
      selectedIds={selected}
      onSelectChange={changeSelection}
      bulkActions={tableBulkActions}
      onBulkDelete={bulkEnabled && onBulkDelete != null ? confirmDelete : undefined}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
      onReorder={onReorder}
      onMemoChange={onMemoChange}
      // 페이지 관련 prop을 넘기지 않으면 AdminTable이 하단 바를 아예 그리지 않는다
      // (카드형 화면은 페이지네이션이 AdminListView 하단 하나로 모인다)
      page={on.pagination && !cardMode ? current : undefined}
      totalPages={on.pagination && !cardMode ? pageCount : undefined}
      onPageChange={on.pagination && !cardMode ? changePage : undefined}
      pageSize={on.pagination && !cardMode ? size : undefined}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={on.pagination && on.pageSize && !cardMode ? changePageSize : undefined}
      columnPicker={columnPicker && on.columnPicker}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      exportable={exportable && on.export}
      exportFilename={exportFilename}
      showFooterWhenEmpty={showFooterWhenEmpty}
      loading={loading}
      emptyText={emptyTitle}
      emptyDescription={emptyDescription}
      onEmptyAction={onEmptyAction}
      labels={tableLabels}
      formatters={formatters}
      // AdminTable은 레이아웃의 density 변수를 읽지 않는다 — 같은 값을 명시적으로 넘긴다
      density={density}
    />
  )

  /*
   * 카드형 선택 바 — 일괄 처리 바는 AdminTable 안에만 있다(카드 그리드에는 없다).
   * 카드형에서도 선택은 되므로 같은 버튼을 공용 Button으로 그리드 위에 얹어 액션을 잃지 않게 한다.
   */
  const hasBulk = tableBulkActions.length > 0 || (bulkEnabled && onBulkDelete != null)
  const cardBulkBar =
    cardMode && viewValue === 'card' && hasBulk && selected.length > 0 ? (
      <div className={styles.cardBulkBar}>
        <span className={styles.cardBulkCount}>
          {/* 함수를 주면 문구를 통째로 교체한다. 없으면 지금까지처럼 숫자만 강조한다 */}
          {L.bulk?.selectedCount != null ? (
            L.bulk.selectedCount(selected.length)
          ) : (
            <>
              선택 <strong>{selected.length}</strong>건
            </>
          )}
        </span>
        <div className={styles.cardBulkButtons}>
          {tableBulkActions.map((action) => (
            <Button
              key={action.key}
              variant={action.tone === 'primary' ? 'primary' : 'secondary'}
              appearance="outline"
              size="sm"
              label={action.label}
              showLeftIcon={action.icon != null}
              leftIcon={action.icon}
              onClick={() => action.onAction(selected)}
            />
          ))}
          {bulkEnabled && onBulkDelete != null && (
            <Button
              variant="error"
              appearance="outline"
              size="sm"
              label={bulkDeleteText}
              showLeftIcon
              leftIcon={<Trash2 size={14} aria-hidden="true" />}
              onClick={() => confirmDelete(selected)}
            />
          )}
        </div>
      </div>
    ) : null

  const cardView = (
    <>
      {cardBulkBar}
      {/* 카드형에서도 로딩 오버레이가 보이도록 relative 컨테이너로 감싼다 */}
      <div className={styles.listWrap}>
        <AdminListView
          view={viewValue}
          onViewChange={changeView}
          total={on.count ? totalCount : undefined}
          totalLabel={totalPrefix ?? undefined}
          totalUnit={totalUnitText}
          toolbar={viewToolbar}
          renderBoard={() => table}
          renderCards={() =>
            paged.map((row) => <Fragment key={rowKey(row)}>{renderCard?.(row)}</Fragment>)
          }
          page={on.pagination ? current : undefined}
          totalPages={on.pagination ? pageCount : undefined}
          onPageChange={on.pagination ? changePage : undefined}
          empty={!loading && ordered.length === 0}
          emptyText={emptyTitle}
          emptyDescription={emptyDescription}
          onEmptyAction={onEmptyAction}
          // 건수 문장 통째 교체·빈 화면 CTA는 개별 prop이 없다 — labels로만 닿는다
          labels={{
            total: { count: L.total?.count },
            empty: { actionLabel: emptyActionLabel },
          }}
          formatters={formatters}
        />
        {/* 게시물형은 AdminTable이 자체 오버레이를 갖는다 — 카드형만 여기서 덮는다 */}
        {loading && viewValue === 'card' && <Loading overlay label={L.loading} />}
      </div>
    </>
  )

  const bodyMain = renderBody != null ? renderBody(paged) : cardMode ? cardView : table

  // 표 아래 안내문(순서 변경 힌트 등) — 있으면 본문 끝에 붙는다
  const body = (
    <>
      {bodyMain}
      {footerNote}
    </>
  )

  const dialog =
    pendingDelete != null && dialogTitle != null ? (
      <CrudDialog
        open
        mode="delete"
        title={dialogTitle}
        // 문구가 함수면 삭제 대상 id들을 끼워 넣는다 — 해석기는 공용(resolveText) 하나뿐이다
        description={resolveText(dialogDescription, pendingDelete)}
        confirmLabel={dialogConfirmLabel}
        cancelLabel={dialogCancelLabel}
        onCancel={() => setPendingDelete(null)}
        onConfirm={runDelete}
      />
    ) : null

  /*
   * 툴바 자리 —
   *   panel 모드: 레이아웃 툴바 슬롯은 SearchPanel이 갖고, 건수 바는 표 위(본문)로 내려간다.
   *   그 외      : 검색·건수가 한 카드에 모이므로 ListToolbar가 툴바 슬롯을 갖는다.
   * 판단은 '선언된 search 값'으로 한다 — show.search로 패널을 꺼도 건수 바 자리는 그대로여야 한다.
   */
  const panelLayout = search === 'panel'

  // 골격 없이 쓰는 프리셋 — 바깥(AdminSuite)이 이미 PageContainer라 패딩을 두 번 먹지 않게 한다.
  // card는 여기에 카드 껍데기(보더·radius)만 더한다 — 모달·탭 패널 안에서 화면이 div를 덧대지 않게.
  if (chrome === 'plain' || chrome === 'card') {
    return (
      <div className={[styles.plain, chrome === 'card' ? styles.card : ''].filter(Boolean).join(' ')}>
        {panel}
        {tabsNode}
        {listToolbar}
        {body}
        {dialog}
      </div>
    )
  }

  return (
    <AdminPageLayout
      // show.header=false면 세 값을 모두 비워 헤더 슬롯을 통째로 지운다
      title={on.header ? title : undefined}
      description={on.header ? description : undefined}
      headerActions={actions}
      tabs={tabsNode}
      side={side}
      sideWidth={sideWidth}
      aside={aside}
      asideWidth={asideWidth}
      asideSticky={asideSticky}
      maxWidth={maxWidth}
      toolbar={panelLayout ? panel : listToolbar}
      density={density}
    >
      <div className={styles.body}>
        {panelLayout && listToolbar}
        {body}
      </div>

      {dialog}
    </AdminPageLayout>
  )
}
