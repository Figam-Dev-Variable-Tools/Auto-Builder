import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CheckCheck } from 'lucide-react'
import { FIGMA_FILE } from '../../shared/figma'
import { mockImage } from '../../shared/mediaMock'
import {
  PortfolioList,
  type PortfolioCategory,
  type PortfolioListShow,
  type PortfolioRow,
} from './PortfolioList'

// ── 목데이터 ──────────────────────────────────────────────────────────────
const CATEGORIES: PortfolioCategory[] = [
  { value: 'kitchen', label: '주방', emoji: '🍳', tone: 'warning' },
  { value: 'bath', label: '욕실', emoji: '🛁', tone: 'primary' },
  { value: 'living', label: '거실', emoji: '🛋️', tone: 'success' },
  { value: 'full', label: '전체 리모델링', emoji: '🏠', tone: 'secondary' },
  { value: 'office', label: '상업공간', emoji: '🏢', tone: 'error' },
]

const PORTFOLIOS: PortfolioRow[] = [
  {
    id: 'pf-01',
    thumbnail: mockImage('주방', 'sand'),
    title: '판교 아이파크 34평 주방 리모델링',
    category: 'kitchen',
    detail: '아일랜드 상판 교체와 하부장 재도장으로 동선을 넓힌 시공입니다.',
    link: 'https://example.com/portfolio/pangyo-kitchen',
    createdAt: '2026-06-02',
    updatedAt: '2026-07-01',
    createdBy: '홍수빈',
    updatedBy: '김도현',
    active: true,
  },
  {
    id: 'pf-02',
    thumbnail: mockImage('욕실', 'slate'),
    title: '분당 정자동 욕실 전체 교체 (건식·습식 분리)',
    category: 'bath',
    detail: '건식 세면대와 습식 샤워부스를 분리해 두 사람이 동시에 쓸 수 있게 했습니다.',
    createdAt: '2026-05-21',
    updatedAt: '2026-06-11',
    createdBy: '홍수빈',
    updatedBy: '홍수빈',
    active: true,
  },
  {
    id: 'pf-03',
    thumbnail: mockImage('거실', 'sage'),
    title: '광교 힐스테이트 거실 아트월 시공',
    category: 'living',
    createdAt: '2026-05-08',
    createdBy: '이하윤',
    active: true,
  },
  {
    id: 'pf-04',
    thumbnail: mockImage('리모델링', 'dusk'),
    title: '용인 수지 32평 아파트 올수리',
    category: 'full',
    detail: '샤시·배관·바닥까지 포함한 전체 리모델링. 공사 기간 4주.',
    link: 'https://example.com/portfolio/suji-full',
    createdAt: '2026-04-27',
    updatedAt: '2026-05-30',
    createdBy: '김도현',
    updatedBy: '이하윤',
    active: false,
  },
  {
    id: 'pf-05',
    thumbnail: mockImage('카페', 'sand'),
    title: '성수동 카페 인테리어 (18평 · 노출 콘크리트)',
    category: 'office',
    createdAt: '2026-04-15',
    updatedAt: '2026-04-19',
    createdBy: '이하윤',
    updatedBy: '김도현',
    active: true,
  },
  {
    id: 'pf-06',
    // 썸네일 미등록 — 표가 공용 대체 그림(Placeholder)을 그린다
    title: '동탄 신도시 주방 상부장 리폼',
    category: 'kitchen',
    createdAt: '2026-03-30',
    createdBy: '박서준',
    active: false,
  },
  {
    id: 'pf-07',
    thumbnail: mockImage('욕실', 'slate'),
    title: '일산 라페스타 상가 화장실 방수 재시공',
    category: 'bath',
    detail: '누수 이력이 있던 구간을 철거 후 방수층부터 다시 올렸습니다.',
    createdAt: '2026-03-11',
    updatedAt: '2026-03-18',
    createdBy: '박서준',
    updatedBy: '홍수빈',
    active: true,
  },
  {
    id: 'pf-08',
    thumbnail: mockImage('사무실', 'dusk'),
    title: '강남 테헤란로 사무실 파티션·조명 교체',
    category: 'office',
    link: 'https://example.com/portfolio/teheran-office',
    createdAt: '2026-02-24',
    updatedAt: '2026-06-05',
    createdBy: '김도현',
    updatedBy: '박서준',
    active: true,
  },
]

const meta = {
  title: 'Admin/PortfolioList',
  component: PortfolioList,
  tags: ['autodocs'],
  args: {
    rows: PORTFOLIOS,
    categories: CATEGORIES,
    loading: false,
    density: 'compact',
    pageSize: 20,
  },
  argTypes: {
    onCreate: { control: false },
    onEdit: { control: false },
    onView: { control: false },
    onDelete: { control: false },
    onToggleActive: { control: false },
    onReorder: { control: false },
    onFilterChange: { control: false },
    onSelectChange: { control: false },
    onBulkDelete: { control: false },
    onColumnVisibilityChange: { control: false },
    // 섹션 ON/OFF — columnPicker·export도 이 객체의 키다(top-level prop을 새로 늘리지 않는다)
    show: { control: 'object' },
    // 툴바 Select 항목 — 모듈 상수 대신 넘길 수 있다
    statusOptions: { control: false },
    sortOptions: { control: false },
    // 아이콘 슬롯은 ReactNode라 컨트롤을 붙이지 않는다
    createIcon: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof PortfolioList>

export default meta
type Story = StoryObj<typeof meta>

/** 순번 드래그·활성화 토글·삭제가 실제로 동작하도록 rows를 들고 있는 데모 래퍼 */
function PortfolioListDemo({
  initialRows = PORTFOLIOS,
  density = 'compact' as const,
  show,
  withBulk = false,
  withView = false,
}: {
  initialRows?: PortfolioRow[]
  density?: 'compact' | 'comfortable'
  show?: PortfolioListShow
  /** 일괄 처리 바를 띄울지 — 행을 선택하면 하단에 뜬다 */
  withBulk?: boolean
  /** 관리 열에 눈(상세보기) 아이콘까지 붙일지 */
  withView?: boolean
}) {
  const [rows, setRows] = useState(initialRows)

  const setActive = (ids: string[], active: boolean) =>
    setRows((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, active } : row)))

  return (
    <PortfolioList
      rows={rows}
      categories={CATEGORIES}
      density={density}
      show={show}
      onCreate={() => {}}
      onEdit={() => {}}
      onView={withView ? () => {} : undefined}
      onDelete={(row) => setRows((prev) => prev.filter((item) => item.id !== row.id))}
      onToggleActive={(row, next) => setActive([row.id], next)}
      // 표가 재정렬된 rows 전체를 그대로 돌려준다 — 저장 순서(=순번)를 갈아끼우면 끝
      onReorder={setRows}
      onBulkDelete={
        withBulk ? (ids) => setRows((prev) => prev.filter((row) => !ids.includes(row.id))) : undefined
      }
      bulkActions={
        withBulk
          ? [
              {
                key: 'activate',
                label: '선택 활성화',
                icon: <CheckCheck size={14} />,
                onAction: (ids) => setActive(ids, true),
              },
            ]
          : []
      }
    />
  )
}

/**
 * 전부 ON — show의 기본값(모든 키 true)이 그대로 나온 화면.
 * 헤더 · 카테고리 탭 · 툴바(카테고리·상태·제목 검색·정렬·건수·내보내기) ·
 * 체크박스/드래그/관리 열 · 하단 페이지 바가 모두 보인다.
 * 행을 선택하면 하단에 일괄 처리 바가 뜬다.
 */
export const AllSections: Story = {
  render: () => (
    <PortfolioListDemo
      withBulk
      withView
      show={{
        header: true,
        tabs: true,
        toolbar: true,
        pagination: true,
        bulk: true,
        reorder: true,
        rowActions: true,
      }}
    />
  ),
}

/**
 * 대부분 OFF — 표만 남는다.
 * 헤더·탭·툴바·페이지 바·체크박스 열·드래그 핸들·관리 열이 전부 사라지고
 * 빈 자리나 여백이 남지 않는다. 표 하단의 32px 빈 footer 줄도 AdminTable의
 * showFooterWhenEmpty={false}(PortfolioList가 항상 넘긴다)로 접혀 남지 않는다.
 */
export const Minimal: Story = {
  render: () => (
    <PortfolioListDemo
      show={{
        header: false,
        tabs: false,
        toolbar: false,
        pagination: false,
        bulk: false,
        reorder: false,
        rowActions: false,
      }}
    />
  ),
}

/** 기본 — 순번 핸들을 끌거나 포커스 후 ↑/↓ 키로 순서를 바꾼다(정렬이 '순번순'일 때만 열린다) */
export const Default: Story = {
  render: () => <PortfolioListDemo />,
}

/**
 * 열 단위 ON/OFF — 섹션 show가 아니라 AdminTable의 columnVisibility로 끈다.
 * 수정일·수정자·등록자를 끈 상태로 시작한다. 표 우상단 [컬럼] 버튼으로 다시 켤 수 있다
 * (columnVisibility를 주면 제어 모드이므로 onColumnVisibilityChange까지 함께 넘겨야 피커가 산다).
 */
function HiddenColumnsDemo() {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    updatedAt: false,
    updatedBy: false,
    createdBy: false,
  })

  return (
    <PortfolioList
      rows={PORTFOLIOS}
      categories={CATEGORIES}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onCreate={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  )
}

export const HiddenColumns: Story = {
  render: () => <HiddenColumnsDemo />,
}

/** 등록된 시공 내역이 아직 없을 때 — 표가 빈 상태 그림을 대신 그린다 */
export const Empty: Story = {
  args: {
    rows: [],
  },
}

/** 조회 중 — 표 위에 오버레이가 덮인다(툴바는 계속 조작 가능) */
export const Loading: Story = {
  args: {
    loading: true,
  },
}

/** 밀도 비교 — comfortable(행 56px). 기본 compact(44px)와 나란히 보면 차이가 보인다 */
export const Comfortable: Story = {
  render: () => <PortfolioListDemo density="comfortable" />,
}

/**
 * 표 도구 OFF — show.columnPicker / show.export로 표 우상단 [컬럼]·[내보내기]만 끈다.
 * 툴바(검색·필터·정렬·건수)는 그대로 남는다 — CSV 반출이나 열 재구성을 막아야 하는 화면용.
 */
export const WithoutTableTools: Story = {
  args: {
    show: { columnPicker: false, export: false },
  },
}

/**
 * 툴바 Select 항목 교체 — statusOptions / sortOptions.
 * status의 ''는 '전체' 센티넬이고, sort의 value는 PortfolioSort와 맞춰야 정렬이 동작한다.
 */
export const CustomOptions: Story = {
  args: {
    statusOptions: [
      { value: '', label: '전체' },
      { value: 'active', label: '노출 중' },
      { value: 'inactive', label: '숨김' },
    ],
    sortOptions: [
      { value: 'order', label: '노출 순서' },
      { value: 'title', label: '가나다순' },
    ],
    searchPlaceholder: '시공 사례 제목으로 찾기',
    emptyText: '아직 등록된 시공 내역이 없습니다.',
  },
}
