import { useMemo, useState } from 'react'
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  RotateCw,
  Settings,
  Tags,
  Trash2,
  Building2,
  UserCog,
  Users,
} from 'lucide-react'
import { mockImage } from '../../shared/mediaMock'
import { ActivityLog, type ActivityItem } from '../../ds/ActivityLog/ActivityLog'
import { CompanyForm, type CompanyValue } from '../../ds/CompanyForm/CompanyForm'
import { HistoryList, type HistoryRow } from '../../ds/HistoryList/HistoryList'
import { AdminChart, type AdminChartSeries } from '../../ds/AdminChart/AdminChart'
import { AdminShell } from '../../ds/AdminShell/AdminShell'
import { AdminTable, type AdminRowMenuItem } from '../../ds/AdminTable/AdminTable'
// 상품 목록 컬럼은 표를 감싼 별도 컴포넌트가 아니라 AdminTable의 컬럼 프리셋으로 존재한다
import { PRODUCT_COLUMNS, PRODUCT_EMPTY_TEXT } from '../../ds/AdminTable/presets'
import type { AnalyticsColumn, AnalyticsSummary } from '../../ds/AnalyticsTable/AnalyticsTable'
import type { AnswerDraft } from '../../ds/AnswerForm/AnswerForm'
// 답변 작성 폼(AnswerForm)은 InquiryDetail이 내부에서 렌더한다 — 여기서는 초안 타입만 쓴다.
import { AnswerHistory, type AnswerVersion } from '../../ds/AnswerHistory/AnswerHistory'
import type { Attachment } from '../../ds/AttachmentList/AttachmentList'
import { Button } from '../../ds/Button/Button'
import { CategoryForm, type CategoryValue } from '../../ds/CategoryForm/CategoryForm'
import { CategoryList, type CategoryRow } from '../../ds/CategoryList/CategoryList'
import type { CategoryTabItem } from '../../ds/CategoryTabs/CategoryTabs'
import type { ConsentItem } from '../../ds/ConsentList/ConsentList'
// 고객 상세는 화면이 하나다 — 쌍둥이였던 'Page' 버전은 header='bar' + 필드 단위 show로 흡수됐다.
// CustomerPage* 타입은 그 시절 이름의 별칭(구조 동일)이라 파생 함수 이름을 그대로 둘 수 있다.
import {
  CustomerDetail,
  type CustomerActivity,
  type CustomerPageActivity,
  type CustomerPageProfile,
  type CustomerPageTone,
  type CustomerProfile,
  type CustomerTone,
} from '../../ds/CustomerDetail/CustomerDetail'
import { CustomerList, type CustomerRow } from '../../ds/CustomerList/CustomerList'
import {
  DashboardScreen,
  type DashboardFeed,
  type DashboardTab,
} from '../../ds/DashboardScreen/DashboardScreen'
import { DetailLayout } from '../../ds/DetailLayout/DetailLayout'
import type { GroupPanelItem } from '../../ds/GroupPanel/GroupPanel'
import {
  InquiryApplicationDetail,
  type ApplicationAnswer,
} from '../../ds/InquiryApplicationDetail/InquiryApplicationDetail'
import {
  InquiryBoard,
  type InquiryApplicationRow,
  type InquiryApplicationStatus,
} from '../../ds/InquiryBoard/InquiryBoard'
import {
  InquiryDetail,
  type InquiryAnswer,
  type InquiryMemo,
  type InquiryOrder,
  type InquiryProduct,
  type InquiryStatusLog,
  type InquiryStatus as InquiryDetailStatus,
  type AnswerTemplate,
} from '../../ds/InquiryDetail/InquiryDetail'
import { InquiryList, type InquiryRow, type InquiryStatus } from '../../ds/InquiryList/InquiryList'
// InquiryManageDetail도 InquiryStatus를 내보내지만(배지 값) 이름이 겹친다 — Q/A 타입만 가져온다
import { InquiryManageDetail, type InquiryQa } from '../../ds/InquiryManageDetail/InquiryManageDetail'
import {
  InquiryManageList,
  type InquiryManageRow,
  type InquiryManageStatus,
} from '../../ds/InquiryManageList/InquiryManageList'
import {
  InquirySettings,
  type InquiryAutomation,
  type InquiryNotification,
  type InquiryStatusStyle,
  type InquiryTemplate,
  type InquiryTypeItem,
} from '../../ds/InquirySettings/InquirySettings'
import {
  EMPTY_MAIN_VISUAL_VALUE,
  MainVisualForm,
  type MainVisualSectionOption,
  type MainVisualValue,
} from '../../ds/MainVisualForm/MainVisualForm'
import {
  MAIN_VISUAL_ROWS,
  MAIN_VISUAL_TABS,
  MainVisualList,
  type MainVisualRow,
} from '../../ds/MainVisualList/MainVisualList'
import { MainVisualUploader, type MainVisualItem } from '../../ds/MainVisualUploader/MainVisualUploader'
import { MemberList, type MemberRow } from '../../ds/MemberList/MemberList'
import { NoticeBoard, type NoticeRow } from '../../ds/NoticeBoard/NoticeBoard'
import { OrderList, type OrderRow, type OrderStatus } from '../../ds/OrderList/OrderList'
import { PageContainer, PageSection } from '../../ds/PageContainer/PageContainer'
import { PortfolioForm, type PortfolioFormValue } from '../../ds/PortfolioForm/PortfolioForm'
import {
  PortfolioList,
  type PortfolioCategory,
  type PortfolioRow,
} from '../../ds/PortfolioList/PortfolioList'
import {
  ProductDetail,
  type ProductDetailValue,
  type ProductInquiry,
  type ProductSaleStatus,
} from '../../ds/ProductDetail/ProductDetail'
import {
  EMPTY_PRODUCT_VALUE,
  ProductEditPage,
  createProductImage,
  type ProductCategoryOption,
  type ProductEditValue,
  type ProductSelectOption,
  type ProductStatus,
} from '../../ds/ProductEditPage/ProductEditPage'
import { ProductForm, type ProductFormValue } from '../../ds/ProductForm/ProductForm'
import { ProductList, type ProductRow } from '../../ds/ProductList/ProductList'
import {
  PRODUCT_ROWS,
  ProductListScreen,
  type ProductScreenRow,
  type ProductScreenStatus,
} from '../../ds/ProductListScreen/ProductListScreen'
import type { DateRangeValue, SearchValues } from '../../ds/SearchPanel/SearchPanel'
import type { SelectOption } from '../../ds/Select/Select'
import type { SidebarSection } from '../../ds/Sidebar/Sidebar'
import { StaffList, type StaffGroupItem, type StaffRow } from '../../ds/StaffList/StaffList'
import { Statistics, type StatItem } from '../../ds/Statistics/Statistics'
import type { StatusStep } from '../../ds/StatusTimeline/StatusTimeline'
import type { TimelineItem } from '../../ds/Timeline/Timeline'
import type { TodoSummaryItem } from '../../ds/TodoSummary/TodoSummary'

// ── 메뉴는 데이터 선언만으로 확장된다(아이콘 + 명칭 + 서브메뉴) ────────────
//
// [운영 메뉴 — 오너 확정 구조]
//   1 대시보드 · 2 회원관리(사용자/운영자) · 3 상품관리(카테고리/상품/주문) · 4 문의관리
//   5 회사관리(회사소개/연혁/포트폴리오) · 6 메인비주얼 관리
// 상세 화면(고객 상세 · 문의 상세 · 상품 상세 …)은 목록에서 행을 눌러 들어간다 → 메뉴에 없다.
//
// 같은 일을 하는 화면이 둘씩 있던 자리(고객 목록/고객 목록(그룹), 상품 목록/상품 목록(프리셋) …)는
// 운영 메뉴에서 하나만 고른다. 나머지 화면은 지우지 않고 아래 '데모' 섹션에 모아 둔다 —
// 이 파일은 디자인 시스템의 쇼케이스라 화면 자체는 계속 열어볼 수 있어야 하기 때문이다.
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      { label: '대시보드', value: 'dashboard', icon: <LayoutDashboard size={18} /> },
      {
        label: '회원관리',
        value: 'members',
        icon: <Users size={18} />,
        children: [
          { label: '사용자', value: 'customer-list' },
          { label: '운영자', value: 'staff-list' },
        ],
      },
      {
        label: '상품관리',
        value: 'product',
        icon: <Package size={18} />,
        children: [
          { label: '카테고리', value: 'category-list' },
          { label: '상품', value: 'product-screen' },
          { label: '주문', value: 'orders' },
        ],
      },
      { label: '문의관리', value: 'inquiry-manage', icon: <MessageSquare size={18} /> },
      {
        label: '회사관리',
        value: 'company',
        icon: <Building2 size={18} />,
        children: [
          { label: '회사소개', value: 'company-form' },
          { label: '연혁', value: 'history-list' },
          { label: '포트폴리오', value: 'portfolio-list' },
        ],
      },
      { label: '메인비주얼 관리', value: 'mainvisual-list', icon: <ImageIcon size={18} /> },
    ],
  },
  {
    // 운영 메뉴에는 없지만 살아 있는 화면들 — 디자인 시스템 데모용 입구다.
    title: '데모 · 변형',
    items: [
      { label: '대시보드 v2', value: 'dashboard-v2', icon: <LayoutDashboard size={18} /> },
      { label: '통계', value: 'stats', icon: <BarChart3 size={18} /> },
      {
        label: '상품 변형',
        value: 'product-demo',
        icon: <Package size={18} />,
        children: [
          { label: '상품 등록/수정', value: 'product-edit' },
          { label: '상품 목록(프리셋)', value: 'product-list' },
          { label: '상품 등록(프리셋)', value: 'product-new' },
          { label: '상품 카테고리', value: 'product-category' },
        ],
      },
      {
        label: '전시 변형',
        value: 'display',
        icon: <ImageIcon size={18} />,
        children: [
          { label: '메인비주얼 수정', value: 'mainvisual-form' },
          // 슬라이드 업로더(드래그 정렬) — 표 기반 '메인비주얼 관리'와 다른 화면이라 이름을 갈라 둔다
          { label: '메인비주얼 업로더', value: 'display-mainvisual' },
          { label: '포트폴리오 등록/수정', value: 'portfolio-form' },
        ],
      },
      {
        label: '문의 변형',
        value: 'inquiry',
        icon: <MessageSquare size={18} />,
        children: [
          { label: '문의 내역', value: 'inquiry-board' },
          { label: '문의 목록(프리셋)', value: 'inquiry-list' },
          { label: '문의 설정', value: 'inquiry-settings' },
        ],
      },
      {
        label: '회원 변형',
        value: 'members-demo',
        icon: <Users size={18} />,
        children: [{ label: '고객 목록(그룹)', value: 'member-list' }],
      },
      {
        label: '게시판',
        value: 'board',
        icon: <FileText size={18} />,
        children: [{ label: '공지사항', value: 'notice-board' }],
      },
      {
        label: '카테고리 변형',
        value: 'category',
        icon: <Tags size={18} />,
        children: [{ label: '카테고리 등록', value: 'category-form' }],
      },
      { label: '환경설정', value: 'settings', icon: <Settings size={18} /> },
    ],
  },
]

const NAV_ITEMS = [
  { label: '운영', value: 'admin' },
  { label: '스토어', value: 'store' },
]

/* ── 목데이터: 회사소개(사이트 AboutPage가 이 값을 그대로 먹는다) ───────────── */
const COMPANY_VALUE: CompanyValue = {
  heroEyebrow: 'About us',
  heroTitle: '공간의 쓰임에서 시작하는 설계',
  heroSubtitle: '도면을 먼저 읽고, 그 위에 쓰임을 얹습니다.',
  heroImage: mockImage('사옥 전경', 'slate'),
  heroImageAlt: '사옥 전경',

  introTitle: 'Who we are',
  introSubtitle: '2018년부터 공간을 설계해 왔습니다.',
  introParagraphs: [
    '성수동 20평 사무실에서 시작했습니다. 좋은 공간은 마감재가 아니라 동선이 만든다는 믿음 하나로, 도면을 먼저 읽는 설계 스튜디오가 되었습니다.',
    '지금은 상업·주거·사옥까지 250여 개 공간을 맡고 있습니다. 준공 후에도 계절마다 다시 찾아가 손봅니다.',
  ].join('\n\n'),
  introImage: mockImage('작업 중인 팀', 'sand'),
  introImageAlt: '작업 중인 팀',

  capabilitiesTitle: 'What we do',
  capabilitiesSubtitle: '설계부터 유지관리까지, 공간을 만드는 네 가지 축입니다.',
  capabilities: [
    { id: 'c1', title: '공간 설계', description: '도면 단계에서 동선과 채광을 계산해 반영합니다.' },
    { id: 'c2', title: '시공 감리', description: '자재와 시공 품질을 현장에서 직접 확인합니다.' },
    { id: 'c3', title: '스타일링', description: '가구와 조명까지 공간의 톤에 맞춰 구성합니다.' },
    { id: 'c4', title: '사후 관리', description: '사용 패턴에 따라 정기적으로 다시 손봅니다.' },
  ],

  statsTitle: 'By the numbers',
  statsSubtitle: '숫자로 보는 기록입니다.',
  stats: [
    { id: 's1', value: '8년', label: '업력' },
    { id: 's2', value: '250+', label: '완료 프로젝트' },
    { id: 's3', value: '38', label: '상업 공간' },
    { id: 's4', value: '94%', label: '재의뢰율' },
  ],

  ctaTitle: '함께 만들어요.',
  ctaSubtitle: '공간과 예산만 알려주시면 3일 안에 제안서를 보내드립니다.',
  ctaButtonLabel: '프로젝트 문의하기',
  ctaEnabled: true,

  accent: 'success',
  showDivider: true,
  showHeroScrim: true,
}

/* ── 목데이터: 연혁(사이트 HistoryPage의 연대 칸이 이 줄들을 연도로 묶는다) ──── */
const HISTORY_ROWS: HistoryRow[] = [
  { id: 'h01', year: '2026', month: '2월', title: '공간 데이터 플랫폼 베타 공개', description: '설계 도면과 자재 데이터를 잇는 파트너용 플랫폼', image: mockImage('2026', 'sage'), visible: true, createdAt: '2026-02-10' },
  { id: 'h02', year: '2025', month: '1월', title: '성수 사옥 이전', description: '설계·유통·개발 조직을 한 건물에 모았습니다.', image: mockImage('2025', 'sand'), visible: true, createdAt: '2025-01-20' },
  { id: 'h03', year: '2025', month: '8월', title: 'ISO 14001 인증 취득', description: '자재 조달부터 폐기까지 환경경영 체계 인증', visible: true, createdAt: '2025-08-14' },
  { id: 'h04', year: '2023', month: '3월', title: '디자인 시스템 v1 구축', description: '쇼핑몰과 어드민이 같은 토큰·컴포넌트를 쓰도록 정비', image: mockImage('2023', 'slate'), visible: true, createdAt: '2023-03-02' },
  { id: 'h05', year: '2022', month: '12월', title: '연 매출 100억 원 돌파', visible: false, createdAt: '2022-12-28' },
  { id: 'h06', year: '2018', month: '3월', title: '스페이스플래닝 설립', description: '성수동 20평 사무실에서 공간 설계 스튜디오로 시작', image: mockImage('2018', 'dusk'), visible: true, createdAt: '2018-03-05' },
]

const ME = { name: '홍성보', role: '최고 관리자' }
const NOW = '2026-07-13 14:20'
// MemberList의 상대시간('11시간전')이 흔들리지 않도록 기준 시각을 고정해 넘긴다
const NOW_ISO = '2026-07-13T14:20:00'
const TODAY = '2026-07-13'

const MONTHS = ['2월', '3월', '4월', '5월', '6월', '7월']

const ACTIVITIES: ActivityItem[] = [
  { id: 'a1', type: 'inquiry', actor: '김서연', action: '문의를 등록했습니다', target: '배송 지연 문의', at: '2026-07-13T09:41:00', unread: true },
  { id: 'a2', type: 'order', actor: '이준호', action: '주문을 완료했습니다', target: '#20260713-0182', at: '2026-07-13T09:12:00', unread: true },
  { id: 'a3', type: 'product', actor: '관리자', action: '상품을 등록했습니다', target: '여름 린넨 셔츠', at: '2026-07-13T08:30:00' },
  { id: 'a4', type: 'member', actor: '박지민', action: '회원가입했습니다', at: '2026-07-13T07:55:00' },
  { id: 'a5', type: 'system', actor: '시스템', action: '재고 동기화를 완료했습니다', at: '2026-07-12T23:00:00' },
]

// ── 목데이터: 카테고리 · 담당자 ───────────────────────────────────────────
const CATEGORY_NAMES = ['의류', '가방', '액세서리', '신발']
// ProductForm/ProductList 모두 카테고리명을 그대로 값으로 쓴다(변환 지점을 만들지 않는다)
const CATEGORY_OPTIONS = CATEGORY_NAMES.map((name) => ({ label: name, value: name }))

const ASSIGNEES: SelectOption[] = [
  { label: '김민수', value: '김민수' },
  { label: '이서준', value: '이서준' },
  { label: '박하윤', value: '박하윤' },
  { label: '최도현', value: '최도현' },
]

// ── 목데이터: 상품 18건 ──────────────────────────────────────────────────
const PRODUCTS: ProductRow[] = [
  { id: 'p1', code: 'P-1001', name: '여름 린넨 셔츠', category: '의류', price: 68000, salePrice: 54400, stock: 42, active: true, createdAt: '2026-07-12', updatedAt: '2026-07-13', createdBy: '김민수' },
  { id: 'p2', code: 'P-1002', name: '데일리 크로스백', category: '가방', price: 124000, stock: 8, active: true, createdAt: '2026-07-11', updatedAt: '2026-07-12', createdBy: '이서준' },
  { id: 'p3', code: 'P-1003', name: '레더 카드지갑', category: '액세서리', price: 39000, stock: 0, active: false, createdAt: '2026-07-10', createdBy: '박하윤' },
  { id: 'p4', code: 'P-1004', name: '오버핏 티셔츠', category: '의류', price: 32000, salePrice: 25600, stock: 156, active: true, createdAt: '2026-07-09', updatedAt: '2026-07-10', createdBy: '김민수' },
  { id: 'p5', code: 'P-1005', name: '캔버스 토트백', category: '가방', price: 58000, stock: 23, active: true, createdAt: '2026-07-08', createdBy: '이서준' },
  { id: 'p6', code: 'P-1006', name: '실버 체인 목걸이', category: '액세서리', price: 88000, stock: 5, active: false, createdAt: '2026-07-07', updatedAt: '2026-07-09', createdBy: '박하윤' },
  { id: 'p7', code: 'P-1007', name: '워시드 데님 팬츠', category: '의류', price: 79000, stock: 64, active: true, createdAt: '2026-07-06', createdBy: '최도현' },
  { id: 'p8', code: 'P-1008', name: '러너 스니커즈', category: '신발', price: 119000, salePrice: 95200, stock: 31, active: true, createdAt: '2026-07-05', updatedAt: '2026-07-11', createdBy: '최도현' },
  { id: 'p9', code: 'P-1009', name: '미니 숄더백', category: '가방', price: 96000, stock: 3, active: true, createdAt: '2026-07-04', createdBy: '이서준' },
  { id: 'p10', code: 'P-1010', name: '코튼 볼캡', category: '액세서리', price: 29000, stock: 210, active: true, createdAt: '2026-07-03', createdBy: '박하윤' },
  { id: 'p11', code: 'P-1011', name: '경량 바람막이', category: '의류', price: 98000, stock: 47, active: true, createdAt: '2026-07-02', updatedAt: '2026-07-08', createdBy: '김민수' },
  { id: 'p12', code: 'P-1012', name: '레더 로퍼', category: '신발', price: 148000, stock: 0, active: false, createdAt: '2026-07-01', createdBy: '최도현' },
  { id: 'p13', code: 'P-1013', name: '니트 가디건', category: '의류', price: 74000, salePrice: 59200, stock: 18, active: true, createdAt: '2026-06-30', createdBy: '김민수' },
  { id: 'p14', code: 'P-1014', name: '백팩 22L', category: '가방', price: 132000, stock: 9, active: true, createdAt: '2026-06-29', updatedAt: '2026-07-02', createdBy: '이서준' },
  { id: 'p15', code: 'P-1015', name: '스퀘어 선글라스', category: '액세서리', price: 112000, stock: 26, active: true, createdAt: '2026-06-28', createdBy: '박하윤' },
  { id: 'p16', code: 'P-1016', name: '슬리퍼 샌들', category: '신발', price: 45000, stock: 88, active: true, createdAt: '2026-06-27', createdBy: '최도현' },
  { id: 'p17', code: 'P-1017', name: '와이드 슬랙스', category: '의류', price: 65000, stock: 2, active: true, createdAt: '2026-06-26', updatedAt: '2026-07-01', createdBy: '김민수' },
  { id: 'p18', code: 'P-1018', name: '패브릭 파우치', category: '가방', price: 22000, stock: 140, active: false, createdAt: '2026-06-25', createdBy: '이서준' },
]

// ── 목데이터: 문의 24건 ──────────────────────────────────────────────────
const INQUIRIES: InquiryRow[] = [
  { id: 'q1', no: 'INQ-0024', type: '배송 문의', title: '주문한 상품이 아직 발송되지 않았습니다', productName: '여름 린넨 셔츠', orderNo: 'ORD-20260712-0182', author: '김서연', memberGrade: 'VIP', assignee: '김민수', createdAt: '2026-07-13', views: 12, status: 'received', isPublic: true, urgent: true },
  { id: 'q2', no: 'INQ-0023', type: '상품 문의', title: '린넨 셔츠 사이즈 실측 알려주세요', productName: '여름 린넨 셔츠', author: '이준호', memberGrade: '골드', assignee: '이서준', createdAt: '2026-07-13', views: 34, status: 'checking', isPublic: true },
  { id: 'q3', no: 'INQ-0022', type: '교환/반품', title: '색상이 상세컷과 달라 교환 요청합니다', productName: '데일리 크로스백', orderNo: 'ORD-20260711-0143', author: '박지민', memberGrade: '실버', assignee: '박하윤', createdAt: '2026-07-12', answeredAt: '2026-07-13', views: 8, status: 'answered', isPublic: false, hasAttachment: true },
  { id: 'q4', no: 'INQ-0021', type: '환불 문의', title: '결제 취소했는데 환불이 안 됩니다', orderNo: 'ORD-20260710-0098', author: '최유진', memberGrade: '일반', assignee: '최도현', createdAt: '2026-07-12', views: 5, status: 'hold', isPublic: false, urgent: true, reported: true },
  { id: 'q5', no: 'INQ-0020', type: '상품 문의', title: '재입고 일정이 궁금합니다', productName: '레더 카드지갑', author: '정하늘', memberGrade: '골드', createdAt: '2026-07-12', views: 41, status: 'received', isPublic: true },
  { id: 'q6', no: 'INQ-0019', type: '배송 문의', title: '배송지 변경 가능한가요?', orderNo: 'ORD-20260711-0120', author: '한도윤', memberGrade: '일반', assignee: '김민수', createdAt: '2026-07-11', answeredAt: '2026-07-11', views: 3, status: 'answered', isPublic: true },
  { id: 'q7', no: 'INQ-0018', type: '기타', title: '세금계산서 발행 요청', author: '윤서아', memberGrade: 'VIP', assignee: '이서준', createdAt: '2026-07-11', views: 2, status: 'checking', isPublic: false, hasAttachment: true },
  { id: 'q8', no: 'INQ-0017', type: '상품 문의', title: '오버핏 티셔츠 소재 문의드립니다', productName: '오버핏 티셔츠', author: '강민재', memberGrade: '실버', createdAt: '2026-07-10', answeredAt: '2026-07-11', views: 27, status: 'answered', isPublic: true },
  { id: 'q9', no: 'INQ-0016', type: '교환/반품', title: '사이즈 교환 신청합니다', productName: '러너 스니커즈', orderNo: 'ORD-20260709-0077', author: '오세훈', memberGrade: '골드', assignee: '박하윤', createdAt: '2026-07-10', views: 6, status: 'received', isPublic: true, hasAttachment: true },
  { id: 'q10', no: 'INQ-0015', type: '배송 문의', title: '송장번호 조회가 안 됩니다', orderNo: 'ORD-20260708-0061', author: '임채원', memberGrade: '일반', assignee: '최도현', createdAt: '2026-07-09', answeredAt: '2026-07-10', views: 15, status: 'answered', isPublic: true },
  { id: 'q11', no: 'INQ-0014', type: '환불 문의', title: '부분 취소 환불 금액이 이상합니다', orderNo: 'ORD-20260708-0055', author: '서지후', memberGrade: 'VIP', assignee: '김민수', createdAt: '2026-07-09', views: 9, status: 'checking', isPublic: false, urgent: true },
  { id: 'q12', no: 'INQ-0013', type: '상품 문의', title: '캔버스 토트백 세탁 방법 알려주세요', productName: '캔버스 토트백', author: '김하람', memberGrade: '실버', createdAt: '2026-07-08', answeredAt: '2026-07-09', views: 52, status: 'answered', isPublic: true },
  { id: 'q13', no: 'INQ-0012', type: '기타', title: '광고성 게시물 신고합니다', author: '익명', memberGrade: '일반', createdAt: '2026-07-08', views: 61, status: 'closed', isPublic: false, reported: true },
  { id: 'q14', no: 'INQ-0011', type: '배송 문의', title: '제주도 추가 배송비 문의', author: '노아윤', memberGrade: '골드', assignee: '이서준', createdAt: '2026-07-07', answeredAt: '2026-07-08', views: 11, status: 'answered', isPublic: true },
  { id: 'q15', no: 'INQ-0010', type: '상품 문의', title: '실버 목걸이 알러지 여부 확인 부탁드립니다', productName: '실버 체인 목걸이', author: '문서준', memberGrade: '일반', createdAt: '2026-07-07', views: 19, status: 'received', isPublic: true },
  { id: 'q16', no: 'INQ-0009', type: '교환/반품', title: '단순 변심 반품 가능 기간이 지났나요?', productName: '워시드 데님 팬츠', orderNo: 'ORD-20260703-0031', author: '배소율', memberGrade: '실버', assignee: '박하윤', createdAt: '2026-07-06', views: 4, status: 'hold', isPublic: false },
  { id: 'q17', no: 'INQ-0008', type: '환불 문의', title: '카드 결제 취소 처리 기간 문의', orderNo: 'ORD-20260702-0024', author: '조은우', memberGrade: '일반', assignee: '최도현', createdAt: '2026-07-06', answeredAt: '2026-07-07', views: 7, status: 'answered', isPublic: true },
  { id: 'q18', no: 'INQ-0007', type: '상품 문의', title: '백팩 노트북 15인치 수납 되나요?', productName: '백팩 22L', author: '류가온', memberGrade: '골드', createdAt: '2026-07-05', answeredAt: '2026-07-06', views: 88, status: 'answered', isPublic: true },
  { id: 'q19', no: 'INQ-0006', type: '배송 문의', title: '합배송 요청드립니다', orderNo: 'ORD-20260701-0018', author: '신유나', memberGrade: 'VIP', assignee: '김민수', createdAt: '2026-07-04', views: 6, status: 'closed', isPublic: false },
  { id: 'q20', no: 'INQ-0005', type: '기타', title: '회원 등급 산정 기준이 궁금합니다', author: '고지훈', memberGrade: '실버', assignee: '이서준', createdAt: '2026-07-04', answeredAt: '2026-07-05', views: 23, status: 'answered', isPublic: true },
  { id: 'q21', no: 'INQ-0004', type: '상품 문의', title: '와이드 슬랙스 기장 수선 가능한가요?', productName: '와이드 슬랙스', author: '황수아', memberGrade: '일반', createdAt: '2026-07-03', views: 14, status: 'checking', isPublic: true },
  { id: 'q22', no: 'INQ-0003', type: '교환/반품', title: '오배송 상품 회수 요청', productName: '레더 로퍼', orderNo: 'ORD-20260630-0009', author: '남시우', memberGrade: '골드', assignee: '박하윤', createdAt: '2026-07-02', views: 10, status: 'received', isPublic: false, hasAttachment: true, urgent: true },
  { id: 'q23', no: 'INQ-0002', type: '배송 문의', title: '부재중 재배송 신청', orderNo: 'ORD-20260629-0004', author: '차예린', memberGrade: '일반', assignee: '최도현', createdAt: '2026-07-01', answeredAt: '2026-07-02', views: 5, status: 'answered', isPublic: true },
  { id: 'q24', no: 'INQ-0001', type: '기타', title: '이벤트 쿠폰이 적용되지 않습니다', author: '독고민', memberGrade: '실버', createdAt: '2026-06-30', views: 33, status: 'closed', isPublic: true },
]

/** 문의 본문 — 24건에 돌려 쓰는 목 텍스트 풀 */
const INQUIRY_BODIES = [
  '주문한 지 5일이 지났는데 아직 발송 알림을 받지 못했습니다. 언제쯤 출고되는지 알려주세요. 여행 전에 꼭 받아야 해서 급합니다.',
  '상세페이지에 나온 이미지와 실제 상품의 느낌이 달라 문의드립니다. 실측 사이즈와 소재 혼용률을 정확히 알려주시면 감사하겠습니다.',
  '어제 결제를 취소했는데 아직 환불 내역이 확인되지 않습니다. 카드사에서는 가맹점 취소 요청이 없었다고 합니다. 확인 부탁드립니다.',
  '배송지 주소를 잘못 입력했습니다. 아직 출고 전이라면 변경 부탁드리고, 이미 출고되었다면 회수 절차를 알려주세요.',
]

/** 답변 템플릿 — InquiryDetail의 AnswerForm에 전달된다 */
const ANSWER_TEMPLATES: AnswerTemplate[] = [
  {
    key: 'shipping-delay',
    label: '배송 지연 안내',
    content:
      '<p>안녕하세요, 고객님. 문의해 주셔서 감사합니다.</p><p>주문하신 상품은 물류 사정으로 출고가 지연되었으며, 영업일 기준 1~2일 내 순차 발송될 예정입니다. 불편을 드려 죄송합니다.</p>',
  },
  {
    key: 'return-guide',
    label: '교환/반품 절차 안내',
    content:
      '<p>안녕하세요, 고객님.</p><p>상품 수령 후 7일 이내 교환·반품이 가능합니다. 마이페이지 &gt; 주문 내역에서 신청해 주시면 회수 기사님이 방문합니다.</p>',
  },
  {
    key: 'refund-guide',
    label: '환불 처리 안내',
    content:
      '<p>안녕하세요, 고객님.</p><p>환불은 회수 완료 확인 후 영업일 기준 3~5일 이내 결제 수단으로 처리됩니다.</p>',
  },
]

// ── 문의 설정 초기값 ─────────────────────────────────────────────────────
const SETTING_TYPES: InquiryTypeItem[] = [
  { key: 'product', label: '상품 문의', enabled: true },
  { key: 'shipping', label: '배송 문의', enabled: true },
  { key: 'return', label: '교환/반품', enabled: true },
  { key: 'refund', label: '환불 문의', enabled: true },
  { key: 'etc', label: '기타', enabled: false },
]

const SETTING_AUTOMATION: InquiryAutomation = {
  autoAssign: true,
  autoReply: true,
  faqSuggest: false,
  slaHours: 24,
}

const SETTING_NOTIFICATION: InquiryNotification = {
  email: true,
  sms: false,
  kakao: true,
  admin: true,
}

const SETTING_STATUSES: InquiryStatusStyle[] = [
  { key: 'received', label: '접수', tone: 'secondary' },
  { key: 'checking', label: '확인중', tone: 'primary' },
  { key: 'answered', label: '답변완료', tone: 'success' },
  { key: 'hold', label: '보류', tone: 'warning' },
  { key: 'closed', label: '종료', tone: 'error' },
]

const SETTING_TEMPLATES: InquiryTemplate[] = [
  { id: 'tpl-1', title: '배송 지연 안내', typeKey: 'shipping', body: '물류 사정으로 출고가 지연되었습니다. 영업일 기준 1~2일 내 발송됩니다.', updatedAt: '2026-07-10' },
  { id: 'tpl-2', title: '교환/반품 절차', typeKey: 'return', body: '수령 후 7일 이내 마이페이지에서 신청해 주세요.', updatedAt: '2026-07-08' },
  { id: 'tpl-3', title: '환불 처리 안내', typeKey: 'refund', body: '회수 완료 후 영업일 기준 3~5일 내 환불됩니다.', updatedAt: '2026-07-05' },
]

const EMPTY_PRODUCT: ProductFormValue = {
  name: '',
  category: null,
  price: '',
  stock: 0,
  onSale: true,
  images: [],
  options: [],
  description: '',
}

// ── 목데이터: 회원 14명 ──────────────────────────────────────────────────
const GROUP_NONE = '그룹 없음'
const GROUP_FREESHIP = '무료 배송 결제 그룹'
const GROUP_OPS = '운영진 그룹'
const GROUP_PARTNER = '파트너 그룹'

/** 좌측 그룹 패널 순서 — key는 그룹명을 그대로 쓴다(변환 지점을 만들지 않는다) */
const MEMBER_GROUP_NAMES = [GROUP_NONE, GROUP_FREESHIP, GROUP_OPS, GROUP_PARTNER]

const MEMBERS: MemberRow[] = [
  { id: 'u01', nickname: '서준아빠', account: 'seojun.kim@gmail.com', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-07-13T07:00:00', points: 0, counts: { posts: 0, comments: 0, reviews: 0, inquiries: 0 }, totalPurchase: 0 },
  { id: 'u02', nickname: '하윤맘', account: 'hayoon.lee@naver.com', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-07-13T03:30:00', points: 3000, counts: { posts: 1, comments: 0, reviews: 0, inquiries: 1 }, totalPurchase: 48_000, memo: '첫 구매 쿠폰 문의함' },
  { id: 'u03', nickname: '민트초코러버', account: 'mintchoco@daum.net', memberType: '일반 회원', group: GROUP_FREESHIP, joinedAt: '2026-07-11T09:15:00', points: 12_500, counts: { posts: 4, comments: 12, reviews: 3, inquiries: 0 }, totalPurchase: 384_000 },
  { id: 'u04', nickname: '홍성보', account: 'sb.hong@spaceplanning.ai', memberType: '운영진', group: GROUP_OPS, joinedAt: '2024-03-04T10:00:00', points: 0, counts: { posts: 38, comments: 142, reviews: 0, inquiries: 0 }, totalPurchase: 0, memo: '스토어 운영 총괄' },
  { id: 'u05', nickname: '캠핑가자', account: 'camping.go@gmail.com', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-07-06T20:40:00', points: 800, counts: { posts: 0, comments: 2, reviews: 1, inquiries: 2 }, totalPurchase: 129_000 },
  { id: 'u06', nickname: '서연씨', account: 'seoyeon.choi@kakao.com', memberType: 'VIP', group: GROUP_FREESHIP, joinedAt: '2024-11-02T11:20:00', points: 84_200, counts: { posts: 9, comments: 31, reviews: 22, inquiries: 8 }, totalPurchase: 3_284_000, memo: 'VIP 승급 후 재구매 주기 짧음 — 신제품 우선 안내' },
  { id: 'u07', nickname: '준호형', account: 'junho.lee@naver.com', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-06-28T14:05:00', points: 2400, counts: { posts: 0, comments: 0, reviews: 2, inquiries: 1 }, totalPurchase: 96_000 },
  { id: 'u08', nickname: '스페이스작가', account: 'artist.jung@spaceplanning.ai', memberType: '작가', group: GROUP_PARTNER, joinedAt: '2025-04-18T09:00:00', points: 0, counts: { posts: 62, comments: 18, reviews: 0, inquiries: 3 }, totalPurchase: 0, memo: '포트폴리오 콘텐츠 제휴 작가' },
  { id: 'u09', nickname: '집꾸미기', account: 'homedeco@daum.net', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-05-30T18:44:00', points: 6100, counts: { posts: 2, comments: 7, reviews: 5, inquiries: 0 }, totalPurchase: 612_000 },
  { id: 'u10', nickname: '광고봇', account: 'promo.bot@spam.example', memberType: '차단 회원', group: GROUP_NONE, joinedAt: '2026-07-02T02:11:00', points: 0, counts: { posts: 41, comments: 0, reviews: 0, inquiries: 0 }, totalPurchase: 0, memo: '도배 게시물 41건 — 차단 처리' },
  { id: 'u11', nickname: '파트너스', account: 'partner@vendor.co.kr', memberType: '일반 회원', group: GROUP_PARTNER, joinedAt: '2025-09-09T13:30:00', points: 0, counts: { posts: 5, comments: 3, reviews: 0, inquiries: 12 }, totalPurchase: 1_940_000, memo: '입점 벤더 — 세금계산서 발행 대상' },
  { id: 'u12', nickname: '수아', account: 'sua.park@gmail.com', memberType: '일반 회원', group: GROUP_NONE, joinedAt: '2026-07-12T22:05:00', points: 500, counts: { posts: 0, comments: 0, reviews: 0, inquiries: 0 }, totalPurchase: 0 },
  { id: 'u13', nickname: '데일리핏', account: 'dailyfit@naver.com', memberType: 'VIP', group: GROUP_FREESHIP, joinedAt: '2025-02-14T16:00:00', points: 41_800, counts: { posts: 3, comments: 22, reviews: 17, inquiries: 4 }, totalPurchase: 2_140_000 },
  { id: 'u14', nickname: '운영지원', account: 'ops.support@spaceplanning.ai', memberType: '운영진', group: GROUP_OPS, joinedAt: '2025-07-01T09:30:00', points: 0, counts: { posts: 12, comments: 88, reviews: 0, inquiries: 0 }, totalPurchase: 0 },
]

/** 회원 유형별 배지 톤 — 강조는 primary 하나, 차단만 error */
const MEMBER_TYPE_TONE: Record<string, CustomerTone> = {
  VIP: 'primary',
  운영진: 'primary',
  작가: 'primary',
  '차단 회원': 'error',
}

// ── 목데이터: 운영진 5명 ─────────────────────────────────────────────────
const STAFF_GROUPS: StaffGroupItem[] = [
  { key: 'all', label: '전체 운영자', count: 5 },
  { key: 'super', label: '최고 관리자', count: 1, group: '운영 그룹' },
  { key: 'ops', label: '상품·주문 운영', count: 4, group: '운영 그룹' },
]

const STAFF: StaffRow[] = [
  { id: 'st-01', nickname: '홍성보', account: 'sb.hong@spaceplanning.ai', group: '최고 관리자', joinedAt: '2024-03-02', department: '경영지원팀', position: '이사', phone: '010-2841-7720', memo: '전체 메뉴 권한 보유' },
  { id: 'st-02', nickname: '김민수', account: 'minsu.kim@spaceplanning.ai', group: '상품·주문 운영', joinedAt: '2025-01-15', department: '커머스운영팀', position: '팀장', phone: '010-3392-1184' },
  { id: 'st-03', nickname: '이서준', account: 'seojun.lee@spaceplanning.ai', group: '상품·주문 운영', joinedAt: '2025-06-08', department: '커머스운영팀', position: '매니저', phone: '010-7745-0912', memo: '주말 CS 당번' },
  { id: 'st-04', nickname: '박하윤', account: 'hayoon.park@spaceplanning.ai', group: '상품·주문 운영', joinedAt: '2025-09-22', department: '물류팀', position: '매니저', phone: '010-5510-3348' },
  // 부서·직급·연락처·메모는 선택값 — 비어 있으면 표에서 '-'로 떨어진다
  { id: 'st-05', nickname: '최도현', account: 'dohyun.choi@spaceplanning.ai', group: '상품·주문 운영', joinedAt: '2026-02-03', department: '마케팅팀', position: '주임' },
]

// ── 목데이터: 주문 5건 ───────────────────────────────────────────────────
const CARRIERS: SelectOption[] = [
  { value: 'cj', label: 'CJ대한통운' },
  { value: 'hanjin', label: '한진택배' },
  { value: 'lotte', label: '롯데택배' },
  { value: 'post', label: '우체국택배' },
  { value: 'logen', label: '로젠택배' },
]

/** 주문 상태 탭 — 건수는 orders에서 매번 계산한다(목데이터와 배지가 어긋나지 않게) */
const ORDER_TABS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '결제대기', value: 'pending' },
  { label: '상품준비중', value: 'preparing' },
  { label: '배송대기', value: 'ready' },
  { label: '배송중', value: 'shipping' },
  { label: '배송완료', value: 'delivered' },
  { label: '취소접수', value: 'cancelRequested' },
  { label: '반품접수', value: 'returnRequested' },
]

const ORDERS: OrderRow[] = [
  {
    id: 'o1',
    orderNo: '20260713-0001937',
    channelNo: 'N',
    orderedAt: '2026-07-13 14:02',
    buyer: '김서연',
    buyerType: 'member',
    phone: '010-2841-7720',
    status: 'delivered',
    items: [
      { id: 'o1-i1', itemNo: '20260713-0001937-01', name: '여름 린넨 셔츠 (아이보리 / M)', image: mockImage('SHIRT', 'sand'), price: 54_400, listPrice: 68_000, qty: 1, status: 'delivered' },
      { id: 'o1-i2', itemNo: '20260713-0001937-02', name: '코튼 볼캡 (블랙)', image: mockImage('CAP', 'slate'), price: 29_000, qty: 2, status: 'confirmed' },
    ],
    shipping: { carrier: 'cj', trackingNo: '612847390215' },
    payment: { total: 112_400, product: 112_400, shippingFee: 0, discount: 0, point: 0, method: '신용카드 (국민)' },
    receiver: { name: '김서연', phone: '010-2841-7720', address: '서울특별시 마포구 양화로 45, 메세나폴리스 1204호 (서교동)', memo: '부재 시 경비실에 맡겨주세요' },
  },
  {
    id: 'o2',
    orderNo: '20260713-0001936',
    orderedAt: '2026-07-13 11:47',
    buyer: '이준호',
    buyerType: 'guest',
    phone: '010-7719-3308',
    status: 'shipping',
    items: [
      { id: 'o2-i1', itemNo: '20260713-0001936-01', name: '오버핏 티셔츠 (차콜 / L)', image: mockImage('TEE', 'sage'), price: 25_600, listPrice: 32_000, qty: 1, status: 'delivered' },
    ],
    shipping: { carrier: 'hanjin', trackingNo: '289301774560' },
    payment: { total: 28_600, product: 25_600, shippingFee: 3000, discount: 0, point: 0, method: '무통장입금' },
    receiver: { name: '이준호', phone: '010-7719-3308', address: '경기도 성남시 분당구 판교역로 235, 에이치스퀘어 N동 802호' },
  },
  {
    id: 'o3',
    orderNo: '20260712-0001918',
    channelNo: 'N',
    orderedAt: '2026-07-12 20:15',
    buyer: '박지민',
    buyerType: 'member',
    phone: '010-3355-9182',
    status: 'cancelRequested',
    items: [
      { id: 'o3-i1', itemNo: '20260712-0001918-01', name: '레더 로퍼 (블랙 / 270)', image: mockImage('LOAFER', 'dusk'), price: 148_000, qty: 1, status: 'canceled', cancelReason: '취소 사유: 단순 변심 (고객 요청, 2026-07-13 09:20 승인)' },
    ],
    shipping: { carrier: null, trackingNo: '', disabled: true },
    payment: { total: 0, product: 148_000, shippingFee: 0, discount: 0, point: 0, method: '카카오페이 (취소 완료)' },
    receiver: { name: '박지민', phone: '010-3355-9182', address: '부산광역시 해운대구 센텀중앙로 90, 큐비e센텀 1502호', memo: '배송 전 연락 부탁드립니다' },
  },
  {
    id: 'o4',
    orderNo: '20260712-0001902',
    orderedAt: '2026-07-12 16:33',
    buyer: '최유진',
    buyerType: 'member',
    phone: '010-9028-4471',
    status: 'ready',
    items: [
      { id: 'o4-i1', itemNo: '20260712-0001902-01', name: '워시드 데님 팬츠 (연청 / 28)', image: mockImage('DENIM', 'slate'), price: 79_000, qty: 1, status: 'confirmed' },
      { id: 'o4-i2', itemNo: '20260712-0001902-02', name: '니트 가디건 (아이보리 / FREE)', price: 59_200, listPrice: 74_000, qty: 2, status: 'confirmed' },
    ],
    shipping: { carrier: 'lotte', trackingNo: '' },
    payment: { total: 194_400, product: 197_400, shippingFee: 0, discount: 2000, point: 1000, method: '네이버페이' },
    receiver: { name: '최민서', phone: '010-4417-2039', address: '대전광역시 유성구 대학로 291, KAIST 학생회관 3층', memo: '문 앞에 놓아주세요' },
  },
  {
    id: 'o5',
    orderNo: '20260711-0001884',
    orderedAt: '2026-07-11 09:08',
    buyer: '정하늘',
    buyerType: 'guest',
    phone: '010-6640-1157',
    status: 'preparing',
    items: [
      { id: 'o5-i1', itemNo: '20260711-0001884-01', name: '러너 스니커즈 (화이트 / 240)', image: mockImage('SNEAKER', 'sand'), price: 95_200, listPrice: 119_000, qty: 1, status: 'confirmed' },
    ],
    shipping: { carrier: null, trackingNo: '' },
    payment: { total: 98_200, product: 95_200, shippingFee: 3000, discount: 0, point: 0, method: '토스페이' },
    receiver: { name: '정하늘', phone: '010-6640-1157', address: '인천광역시 연수구 송도과학로 32, 송도트리플스트리트 B동 907호' },
  },
]

// ── 목데이터: 문의(상담) 신청 12건 ───────────────────────────────────────
const APPLICATION_CATEGORIES = ['서비스 도입', '견적 문의', '제휴/파트너십', '기술 지원', '기타']

const APPLICATION_CATEGORY_OPTIONS = APPLICATION_CATEGORIES.map((label) => ({ label, value: label }))

const APPLICATIONS: InquiryApplicationRow[] = [
  { id: 'ap-01', category: '서비스 도입', title: '전사 도입을 검토 중입니다. 데모 일정 잡고 싶어요', applicant: '정하늘', phone: '010-4872-1130', email: 'haneul.jung@example.com', appliedAt: '2026-07-13', status: 'pending' },
  { id: 'ap-02', category: '견적 문의', title: '연간 구독 견적서를 받아볼 수 있을까요', applicant: '김서연', phone: '010-2841-7720', email: 'seoyeon.kim@company.co.kr', appliedAt: '2026-07-12', updatedAt: '2026-07-13', status: 'checking' },
  { id: 'ap-03', category: '기술 지원', title: '기존 ERP와 연동 가능한지 문의드립니다', applicant: '이준호', phone: '010-7719-3308', email: 'junho.lee@naver.com', appliedAt: '2026-07-12', status: 'pending' },
  { id: 'ap-04', category: '제휴/파트너십', title: '리셀러 파트너십 제안드립니다', applicant: '박지민', phone: '010-3355-9182', email: 'jimin.park@vendor.co.kr', appliedAt: '2026-07-11', updatedAt: '2026-07-12', status: 'done' },
  { id: 'ap-05', category: '기술 지원', title: '로그인 시 인증 메일이 오지 않습니다', applicant: '최수아', phone: '010-9028-4471', email: 'sua.choi@gmail.com', appliedAt: '2026-07-11', updatedAt: '2026-07-11', status: 'checking' },
  { id: 'ap-06', category: '견적 문의', title: '사용자 50명 규모 요금제를 알고 싶습니다', applicant: '강민준', phone: '010-6640-1157', email: 'minjun.kang@daum.net', appliedAt: '2026-07-10', status: 'pending' },
  { id: 'ap-07', category: '서비스 도입', title: '온프레미스 설치 지원 여부 문의', applicant: '윤하은', phone: '010-5510-3348', email: 'haeun.yoon@company.co.kr', appliedAt: '2026-07-09', updatedAt: '2026-07-10', status: 'hold' },
  { id: 'ap-08', category: '기타', title: '교육 기관 할인 정책이 있나요', applicant: '조태윤', phone: '010-3392-1184', email: 'taeyun.cho@school.ac.kr', appliedAt: '2026-07-08', updatedAt: '2026-07-09', status: 'done' },
  { id: 'ap-09', category: '서비스 도입', title: '데이터 이관 대행이 가능한지 궁금합니다', applicant: '한소미', phone: '010-7745-0912', email: 'somi.han@kakao.com', appliedAt: '2026-07-07', status: 'pending' },
  { id: 'ap-10', category: '견적 문의', title: '계약서 양식을 미리 검토하고 싶습니다', applicant: '문가영', phone: '010-2273-8814', email: 'gayoung.moon@company.co.kr', appliedAt: '2026-07-06', updatedAt: '2026-07-08', status: 'checking' },
  { id: 'ap-11', category: '기술 지원', title: '보안 심사 자료(ISMS) 요청드립니다', applicant: '배성현', phone: '010-8890-2245', email: 'sunghyun.bae@finance.co.kr', appliedAt: '2026-07-05', updatedAt: '2026-07-06', status: 'done' },
  { id: 'ap-12', category: '기타', title: '체험 계정 기간 연장 요청', applicant: '신유진', phone: '010-4417-2039', email: 'yujin.shin@gmail.com', appliedAt: '2026-07-03', status: 'pending' },
]

const APPLICATION_STATUS_LABEL: Record<InquiryApplicationStatus, string> = {
  pending: '미확인',
  checking: '확인중',
  done: '완료',
  hold: '보류',
}

const APPLICATION_STATUS_ORDER: InquiryApplicationStatus[] = ['pending', 'checking', 'done', 'hold']

const APPLICATION_STATUS_OPTIONS: SelectOption[] = APPLICATION_STATUS_ORDER.map((status) => ({
  label: APPLICATION_STATUS_LABEL[status],
  value: status,
}))

/** 신청 폼에 입력된 Q/A — 카테고리별로 다른 질문지를 쓴다 */
const APPLICATION_ANSWERS: Record<string, ApplicationAnswer[]> = {
  '서비스 도입': [
    { question: '도입 예정 규모를 알려주세요.', answer: '본사 120명 + 지점 4곳 (총 180석 예상)' },
    { question: '희망 도입 시점은 언제인가요?', answer: '2026년 9월 (분기 시작에 맞춰 오픈)' },
    { question: '현재 사용 중인 솔루션이 있나요?', answer: '사내 자체 개발 도구 + 스프레드시트 병행' },
    { question: '가장 해결하고 싶은 문제는 무엇인가요?', answer: '부서별로 흩어진 상품·주문 데이터를 한 화면에서 보고 싶습니다.' },
  ],
  '견적 문의': [
    { question: '필요한 사용자 수를 알려주세요.', answer: '50명 (관리자 5명 · 일반 45명)' },
    { question: '계약 기간은 어떻게 생각하시나요?', answer: '연간 계약 선호 (분기 납부 가능한지 확인 필요)' },
    { question: '견적서에 포함되어야 할 항목이 있나요?', answer: '초기 구축비 · 교육비 · 연간 유지보수 요율' },
  ],
  '제휴/파트너십': [
    { question: '제안하시는 제휴 형태는 무엇인가요?', answer: '리셀러 계약 (국내 중소 유통사 대상 재판매)' },
    { question: '기존 취급 품목을 알려주세요.', answer: '가구·생활가전 위주, 연 매출 40억 규모' },
    { question: '희망 마진율이 있나요?', answer: '20% 내외 (물량에 따라 협의 희망)' },
  ],
  '기술 지원': [
    { question: '어떤 문제가 발생했나요?', answer: '가입 후 인증 메일이 도착하지 않습니다. 스팸함에도 없습니다.' },
    { question: '사용 중인 환경을 알려주세요.', answer: 'Chrome 최신 버전 · Windows 11 · 사내망(프록시 사용)' },
    { question: '재현 빈도는 어떻게 되나요?', answer: '신규 계정 3건 중 2건에서 재현됩니다.' },
  ],
  기타: [
    { question: '문의 내용을 자유롭게 적어주세요.', answer: '교육 기관 대상 할인 정책이 있는지, 있다면 증빙 서류는 무엇이 필요한지 알고 싶습니다.' },
    { question: '회신 받을 연락 수단을 알려주세요.', answer: '이메일 회신 선호 (평일 10~17시 통화 가능)' },
  ],
}

// ── 목데이터: 공지 12건 ──────────────────────────────────────────────────
const NOTICES: NoticeRow[] = [
  { id: 'n01', category: '공지', title: '개인정보 처리방침 개정 안내 (2026-08-01 시행)', author: '운영팀', createdAt: '2026-07-10', updatedAt: '2026-07-11', views: 4213, status: 'visible', pinned: true, important: true },
  { id: 'n02', category: '점검', title: '[필독] 7월 정기 서버 점검 안내 (02:00~05:00)', author: '인프라팀', createdAt: '2026-07-09', updatedAt: '2026-07-09', views: 2871, status: 'visible', pinned: true },
  { id: 'n03', category: '이벤트', title: '여름 시즌오프 최대 70% 할인 이벤트', author: '마케팅팀', createdAt: '2026-07-08', updatedAt: '2026-07-12', views: 18_420, status: 'visible', important: true },
  { id: 'n04', category: '업데이트', title: '모바일 앱 3.2.0 업데이트 — 주문 조회 개선', author: '프로덕트팀', createdAt: '2026-07-07', updatedAt: '2026-07-07', views: 1204, status: 'visible' },
  { id: 'n05', category: '안내', title: '택배사 파업에 따른 배송 지연 안내', author: '고객지원팀', createdAt: '2026-07-05', updatedAt: '2026-07-06', views: 9317, status: 'visible' },
  { id: 'n06', category: '이벤트', title: '신규 회원 웰컴 쿠폰 15% 지급', author: '마케팅팀', createdAt: '2026-07-04', updatedAt: '2026-07-04', views: 6540, status: 'scheduled', publishAt: '2026-07-20 10:00' },
  { id: 'n07', category: '공지', title: '추석 연휴 배송 및 고객센터 운영 안내', author: '운영팀', createdAt: '2026-07-03', updatedAt: '2026-07-03', views: 312, status: 'scheduled', publishAt: '2026-09-14 09:00' },
  { id: 'n08', category: '점검', title: '결제 모듈 교체 작업에 따른 일시 중단', author: '인프라팀', createdAt: '2026-07-02', updatedAt: '2026-07-03', views: 1980, status: 'hidden' },
  { id: 'n09', category: '안내', title: '교환/반품 정책 변경 사전 안내', author: '고객지원팀', createdAt: '2026-06-30', updatedAt: '2026-07-01', views: 5124, status: 'visible' },
  { id: 'n10', category: '업데이트', title: '리뷰 포토 첨부 기능이 추가되었습니다', author: '프로덕트팀', createdAt: '2026-06-28', updatedAt: '2026-06-28', views: 2260, status: 'visible' },
  { id: 'n11', category: '이벤트', title: '리뷰 작성 시 적립금 2배 지급 (기간 한정)', author: '마케팅팀', createdAt: '2026-06-25', updatedAt: '2026-06-27', views: 11_302, status: 'hidden' },
  { id: 'n12', category: '공지', title: '휴면 계정 전환 사전 고지', author: '운영팀', createdAt: '2026-06-22', updatedAt: '2026-06-22', views: 3411, status: 'visible' },
]

// ── 목데이터: 포트폴리오 8건 ─────────────────────────────────────────────
const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { value: 'kitchen', label: '주방', emoji: '🍳', tone: 'warning' },
  { value: 'bath', label: '욕실', emoji: '🛁', tone: 'primary' },
  { value: 'living', label: '거실', emoji: '🛋️', tone: 'success' },
  { value: 'full', label: '전체 리모델링', emoji: '🏠', tone: 'secondary' },
  { value: 'office', label: '상업공간', emoji: '🏢', tone: 'error' },
]

/** PortfolioForm의 Select는 라벨/값만 받는다 — 목록 카테고리에서 이모지를 붙여 그대로 만든다 */
const PORTFOLIO_CATEGORY_OPTIONS: SelectOption[] = PORTFOLIO_CATEGORIES.map((item) => ({
  label: `${item.emoji} ${item.label}`,
  value: item.value,
}))

const PORTFOLIOS: PortfolioRow[] = [
  { id: 'pf-01', thumbnail: mockImage('주방', 'sand'), title: '판교 아이파크 34평 주방 리모델링', category: 'kitchen', detail: '아일랜드 상판 교체와 하부장 재도장으로 동선을 넓힌 시공입니다.', link: 'https://example.com/portfolio/pangyo-kitchen', createdAt: '2026-06-02', updatedAt: '2026-07-01', createdBy: '홍성보', updatedBy: '김민수', active: true },
  { id: 'pf-02', thumbnail: mockImage('욕실', 'slate'), title: '분당 정자동 욕실 전체 교체 (건식·습식 분리)', category: 'bath', detail: '건식 세면대와 습식 샤워부스를 분리해 두 사람이 동시에 쓸 수 있게 했습니다.', createdAt: '2026-05-21', updatedAt: '2026-06-11', createdBy: '홍성보', updatedBy: '홍성보', active: true },
  { id: 'pf-03', thumbnail: mockImage('거실', 'sage'), title: '광교 힐스테이트 거실 아트월 시공', category: 'living', createdAt: '2026-05-08', createdBy: '이서준', active: true },
  { id: 'pf-04', thumbnail: mockImage('리모델링', 'dusk'), title: '용인 수지 32평 아파트 올수리', category: 'full', detail: '샤시·배관·바닥까지 포함한 전체 리모델링. 공사 기간 4주.', link: 'https://example.com/portfolio/suji-full', createdAt: '2026-04-27', updatedAt: '2026-05-30', createdBy: '김민수', updatedBy: '이서준', active: false },
  { id: 'pf-05', thumbnail: mockImage('카페', 'sand'), title: '성수동 카페 인테리어 (18평 · 노출 콘크리트)', category: 'office', createdAt: '2026-04-15', updatedAt: '2026-04-19', createdBy: '이서준', updatedBy: '김민수', active: true },
  // 썸네일 미등록 — 표가 공용 대체 그림(Placeholder)을 그린다
  { id: 'pf-06', title: '동탄 신도시 주방 상부장 리폼', category: 'kitchen', createdAt: '2026-03-30', createdBy: '박하윤', active: false },
  { id: 'pf-07', thumbnail: mockImage('욕실', 'slate'), title: '일산 라페스타 상가 화장실 방수 재시공', category: 'bath', detail: '누수 이력이 있던 구간을 철거 후 방수층부터 다시 올렸습니다.', createdAt: '2026-03-11', updatedAt: '2026-03-18', createdBy: '박하윤', updatedBy: '홍성보', active: true },
  { id: 'pf-08', thumbnail: mockImage('사무실', 'dusk'), title: '강남 테헤란로 사무실 파티션·조명 교체', category: 'office', link: 'https://example.com/portfolio/teheran-office', createdAt: '2026-02-24', updatedAt: '2026-06-05', createdBy: '김민수', updatedBy: '박하윤', active: true },
]

const EMPTY_PORTFOLIO: PortfolioFormValue = {
  category: null,
  title: '',
  link: '',
  image: undefined,
  content: '',
  active: true,
  // 신규 등록은 상세 페이지를 쓰는 것으로 시작한다('이미지 · 상세 내용' 섹션 ON)
  detailEnabled: true,
}

// ── 목데이터: 고객 10명(CustomerList) ────────────────────────────────────
// 회원 유형 문자열은 CustomerList의 기본 탭(전체 / 일반회원 / 아티스트회원)과 같은 값이어야 탭이 센다.
const CUSTOMERS: CustomerRow[] = [
  { id: 'cs-01', nickname: '김서연', phone: '010-2841-7720', email: 'seoyeon.kim@gmail.com', memberType: '일반회원', joinPath: '이메일', joinedAt: '2026-07-13', orderCount: 4, totalPurchase: 1_284_000, memo: '배송 지연 문의 이력 있음' },
  { id: 'cs-02', nickname: '이준호', phone: '010-7719-3308', email: 'junho.lee@naver.com', memberType: '일반회원', joinPath: '카카오', joinedAt: '2026-07-11', orderCount: 1, totalPurchase: 96_000 },
  { id: 'cs-03', nickname: '정하늘', phone: '010-6640-1157', email: 'haneul.jung@spaceplanning.ai', memberType: '아티스트회원', joinPath: '이메일', joinedAt: '2026-06-28', orderCount: 0, totalPurchase: 0, memo: '포트폴리오 콘텐츠 제휴 작가' },
  { id: 'cs-04', nickname: '박지민', phone: '010-3355-9182', email: 'jimin.park@daum.net', memberType: '일반회원', joinPath: '네이버', joinedAt: '2026-06-14', orderCount: 7, totalPurchase: 3_284_000 },
  { id: 'cs-05', nickname: '최유진', phone: '010-9028-4471', email: 'yujin.choi@kakao.com', memberType: '아티스트회원', joinPath: '카카오', joinedAt: '2026-05-30', orderCount: 2, totalPurchase: 248_000, memo: '전시 콘텐츠 촬영 협업 예정' },
  { id: 'cs-06', nickname: '강민준', phone: '010-5510-3348', email: 'minjun.kang@gmail.com', memberType: '일반회원', joinPath: '이메일', joinedAt: '2026-05-02', orderCount: 12, totalPurchase: 5_940_000 },
  { id: 'cs-07', nickname: '윤하은', phone: '010-3392-1184', email: 'haeun.yoon@company.co.kr', memberType: '일반회원', joinPath: '이메일', joinedAt: '2026-04-19', orderCount: 0, totalPurchase: 0 },
  { id: 'cs-08', nickname: '오세훈', phone: '010-7745-0912', email: 'sehun.oh@naver.com', memberType: '아티스트회원', joinPath: '네이버', joinedAt: '2026-03-08', orderCount: 3, totalPurchase: 612_000 },
  { id: 'cs-09', nickname: '한소미', phone: '010-2273-8814', email: 'somi.han@kakao.com', memberType: '일반회원', joinPath: '카카오', joinedAt: '2026-02-21', orderCount: 5, totalPurchase: 1_940_000, memo: '세금계산서 발행 대상' },
  { id: 'cs-10', nickname: '배성현', phone: '010-8890-2245', email: 'sunghyun.bae@finance.co.kr', memberType: '일반회원', joinPath: '이메일', joinedAt: '2025-12-04', orderCount: 9, totalPurchase: 2_140_000 },
]

/** 고객 유형 배지 톤 — 아티스트만 강조색 */
const CUSTOMER_TYPE_TONE: Record<string, CustomerPageTone> = {
  아티스트회원: 'primary',
}

// ── 목데이터: 메인 비주얼 ────────────────────────────────────────────────
/** 폼의 '배너 구분' Select — 목록 탭(중고/렌탈/시공)과 같은 축이어야 저장 후 그 탭에 꽂힌다 */
const MAIN_VISUAL_SECTIONS: MainVisualSectionOption[] = MAIN_VISUAL_TABS.map((tab) => ({
  value: tab.value,
  label: tab.label,
}))

// ── 목데이터: 카테고리 브랜드(시공 파트너사) ────────────────────────────
const CATEGORY_BRANDS: SelectOption[] = [
  { value: '한샘', label: '한샘' },
  { value: '리바트', label: '리바트' },
  { value: '자체 브랜드', label: '자체 브랜드' },
]

// ── 목데이터: 카테고리 8건(CategoryList) ─────────────────────────────────
const CATEGORIES: CategoryRow[] = [
  { id: 'ct-01', order: 1, name: '주방', emoji: '🍳', brand: '한샘', description: '싱크대·상판·수납장 교체 시공', childCount: 2, createdAt: '2026-01-12', updatedAt: '2026-06-30', createdBy: '홍성보', updatedBy: '김민수', active: true },
  { id: 'ct-02', order: 2, name: '욕실', emoji: '🛁', brand: '리바트', description: '건식·습식 분리, 방수 재시공', childCount: 1, createdAt: '2026-01-12', updatedAt: '2026-05-21', createdBy: '홍성보', updatedBy: '홍성보', active: true },
  { id: 'ct-03', order: 3, name: '거실', emoji: '🛋️', brand: '자체 브랜드', description: '아트월·조명·바닥재', childCount: 3, createdAt: '2026-02-03', updatedAt: '2026-02-03', createdBy: '이서준', updatedBy: '이서준', active: true },
  { id: 'ct-04', order: 4, name: '침실', emoji: '🛏️', brand: '한샘', description: '붙박이장·도배·창호', childCount: 1, createdAt: '2026-02-18', updatedAt: '2026-04-02', createdBy: '이서준', updatedBy: '박하윤', active: true },
  { id: 'ct-05', order: 5, name: '전체 리모델링', emoji: '🏠', brand: '리바트', description: '샤시·배관·바닥까지 포함한 올수리', childCount: 4, createdAt: '2026-03-04', updatedAt: '2026-07-01', createdBy: '김민수', updatedBy: '홍성보', active: true },
  // 이미지·아이콘이 모두 없는 행 — 표가 공용 대체 그림(Placeholder)을 그린다
  { id: 'ct-06', order: 6, name: '베란다·확장', brand: '자체 브랜드', description: '확장 공사와 단열·결로 보강', childCount: 1, createdAt: '2026-03-27', updatedAt: '2026-03-27', createdBy: '박하윤', updatedBy: '박하윤', active: false },
  { id: 'ct-07', order: 7, name: '상업공간', emoji: '🏢', brand: '한샘', description: '카페·사무실·상가 인테리어', childCount: 2, createdAt: '2026-04-15', updatedAt: '2026-06-05', createdBy: '김민수', updatedBy: '이서준', active: true },
  { id: 'ct-08', order: 8, name: '조명·전기', emoji: '💡', brand: '리바트', description: '배선·스위치·매입등 교체', childCount: 1, createdAt: '2026-05-09', updatedAt: '2026-05-09', createdBy: '최도현', updatedBy: '최도현', active: false },
]

/** 신규 등록 시작값 — 아이콘(이모지) 선택으로 시작한다 */
const EMPTY_CATEGORY: CategoryValue = {
  name: '',
  useImage: false,
  description: '',
  active: true,
}

// ── 목데이터: 시공 문의 12건(InquiryManageList) ──────────────────────────
const MANAGE_INQUIRIES: InquiryManageRow[] = [
  { id: 'im-12', no: 12, applicant: '김서연', phone: '010-2841-7720', email: 'seoyeon.kim@gmail.com', appliedAt: '2026-07-13', status: 'pending' },
  { id: 'im-11', no: 11, applicant: '이준호', phone: '010-7719-3308', email: 'junho.lee@naver.com', appliedAt: '2026-07-12', status: 'pending' },
  { id: 'im-10', no: 10, applicant: '박지민', phone: '010-3355-9182', email: 'jimin.park@daum.net', appliedAt: '2026-07-11', status: 'answered' },
  { id: 'im-09', no: 9, applicant: '최유진', phone: '010-9028-4471', email: 'yujin.choi@kakao.com', appliedAt: '2026-07-10', status: 'hold' },
  { id: 'im-08', no: 8, applicant: '정하늘', phone: '010-6640-1157', email: 'haneul.jung@example.com', appliedAt: '2026-07-09', status: 'answered' },
  { id: 'im-07', no: 7, applicant: '강민준', phone: '010-5510-3348', email: 'minjun.kang@gmail.com', appliedAt: '2026-07-08', status: 'pending' },
  { id: 'im-06', no: 6, applicant: '윤하은', phone: '010-3392-1184', email: 'haeun.yoon@company.co.kr', appliedAt: '2026-07-06', status: 'answered' },
  { id: 'im-05', no: 5, applicant: '오세훈', phone: '010-7745-0912', email: 'sehun.oh@naver.com', appliedAt: '2026-07-04', status: 'pending' },
  { id: 'im-04', no: 4, applicant: '한소미', phone: '010-2273-8814', email: 'somi.han@kakao.com', appliedAt: '2026-07-02', status: 'hold' },
  { id: 'im-03', no: 3, applicant: '배성현', phone: '010-8890-2245', email: 'sunghyun.bae@finance.co.kr', appliedAt: '2026-06-29', status: 'answered' },
  { id: 'im-02', no: 2, applicant: '문가영', phone: '010-4417-2039', email: 'gayoung.moon@company.co.kr', appliedAt: '2026-06-25', status: 'answered' },
  { id: 'im-01', no: 1, applicant: '신유진', phone: '010-4872-1130', email: 'yujin.shin@gmail.com', appliedAt: '2026-06-20', status: 'pending' },
]

/** 시공 문의 챗봇 질문지 — 접수 번호로 돌려 쓴다 */
const MANAGE_QA_POOL: InquiryQa[][] = [
  [
    { question: '시공을 원하는 공간은 어디인가요?', answer: '아파트 34평 — 주방과 거실 위주로 보고 있습니다.' },
    { question: '희망 시공 시기를 알려주세요.', answer: '2026년 9월 초 (입주 전 2주 정도 여유가 있습니다)' },
    { question: '예산 범위는 어느 정도인가요?', answer: '3,000만원 내외 — 자재에 따라 조정 가능합니다.' },
    { question: '현장 실측 방문이 가능한 시간대가 있나요?', answer: '평일 저녁 7시 이후 또는 토요일 오전' },
  ],
  [
    { question: '시공을 원하는 공간은 어디인가요?', answer: '빌라 욕실 2곳 — 누수 이력이 있어 방수부터 다시 하고 싶습니다.' },
    { question: '희망 시공 시기를 알려주세요.', answer: '가능한 빨리 (이번 달 안에 착공 희망)' },
    { question: '예산 범위는 어느 정도인가요?', answer: '800만원 이하로 생각하고 있습니다.' },
    { question: '현장 실측 방문이 가능한 시간대가 있나요?', answer: '주중 오전 10시~12시' },
  ],
  [
    { question: '시공을 원하는 공간은 어디인가요?', answer: '성수동 상가 1층 카페 — 18평, 노출 콘크리트 콘셉트입니다.' },
    { question: '희망 시공 시기를 알려주세요.', answer: '10월 오픈 목표 — 8월 말 착공이면 좋겠습니다.' },
    { question: '예산 범위는 어느 정도인가요?', answer: '5,000만원 (주방 설비 포함 여부에 따라 협의)' },
    { question: '현장 실측 방문이 가능한 시간대가 있나요?', answer: '매일 가능합니다. 방문 전 연락 주세요.' },
  ],
]

/** 답변완료 건은 답변 본문을 미리 채워 둔다 */
const SEED_MANAGE_ANSWERS: Record<string, string> = {
  'im-10': '안녕하세요, 문의 감사합니다. 요청하신 일정으로 현장 실측이 가능합니다. 담당 실장이 유선으로 방문 시간을 확정하겠습니다.',
  'im-08': '보내주신 조건으로 개략 견적을 산출했습니다. 자재 등급에 따라 금액 차이가 있어 방문 상담 시 3개 안을 준비해 드리겠습니다.',
  'im-06': '누수 이력이 있는 욕실은 방수층 철거 후 재시공을 권장드립니다. 실측 후 정확한 견적을 안내드리겠습니다.',
  'im-03': '상업공간은 소방·전기 협의가 필요해 착공까지 2주 정도 여유를 두시길 권합니다. 일정표를 메일로 보내드렸습니다.',
  'im-02': '문의하신 확장 공사는 관리사무소 동의서가 필요합니다. 준비 서류 목록을 첨부해 회신드렸습니다.',
}

/** 답변 메타(답변일 · 답변자) — 답변완료 건만 채워 둔다 */
const SEED_MANAGE_ANSWERED: Record<string, { at: string; by: string }> = {
  'im-10': { at: '2026-07-12', by: '김민수' },
  'im-08': { at: '2026-07-10', by: '이서준' },
  'im-06': { at: '2026-07-07', by: '박하윤' },
  'im-03': { at: '2026-06-30', by: '최도현' },
  'im-02': { at: '2026-06-26', by: '김민수' },
}

const MANAGE_STATUS_LABEL: Record<InquiryManageStatus, string> = {
  pending: '대기중',
  answered: '답변완료',
  hold: '보류',
}

/** 목록 배지와 같은 톤(대기중=error / 답변완료=success / 보류=warning) */
const MANAGE_STATUS_TONE: Record<InquiryManageStatus, 'success' | 'warning' | 'error'> = {
  pending: 'error',
  answered: 'success',
  hold: 'warning',
}

// ── ProductEditPage 목데이터 — ProductListScreen(음향기기)과 같은 도메인으로 맞춘다 ──
const PRODUCT_BRANDS: ProductSelectOption[] = [
  { label: 'Pioneer DJ', value: 'pioneer' },
  { label: 'Technics', value: 'technics' },
  { label: 'Denon DJ', value: 'denon' },
  { label: 'Rane', value: 'rane' },
  { label: 'Sennheiser', value: 'sennheiser' },
  { label: '자체 제작', value: 'own' },
]

/** 2차 카테고리 라벨은 ProductScreenRow.category와 같은 문자열이다(행 → 폼 매핑의 열쇠) */
const PRODUCT_EDIT_CATEGORIES: ProductCategoryOption[] = [
  {
    label: 'DJ 장비',
    value: 'dj',
    children: [
      { label: '플레이어', value: 'player' },
      { label: '턴테이블', value: 'turntable' },
      { label: '믹서', value: 'mixer' },
      { label: '컨트롤러', value: 'controller' },
      { label: '올인원 시스템', value: 'allinone' },
    ],
  },
  {
    label: '모니터링',
    value: 'monitoring',
    children: [
      { label: '헤드폰', value: 'headphone' },
      { label: '모니터 스피커', value: 'speaker' },
    ],
  },
]

// ── 대시보드 v2(DashboardScreen) 목데이터 ────────────────────────────────
const DASHBOARD_TABS: DashboardTab[] = [
  { value: 'used', label: '중고' },
  { value: 'rental', label: '렌탈' },
  { value: 'install', label: '시공' },
]

const DASHBOARD_CHART_LABELS = ['07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13']

const DASHBOARD_CHART_SERIES: AdminChartSeries[] = [
  { label: '방문자', data: [3412, 2980, 3871, 2640, 1905, 842, 214], tone: 'primary' },
  { label: '페이지뷰', data: [9840, 8620, 11_240, 7480, 5210, 2360, 610], tone: 'secondary' },
]

const won = (value: unknown): string =>
  typeof value === 'number' ? `${value.toLocaleString('ko-KR')}원` : '-'

const ANALYTICS_COLUMNS: AnalyticsColumn[] = [
  { key: 'date', label: '일자', align: 'left' },
  { key: 'orders', label: '주문수', align: 'right' },
  { key: 'sales', label: '매출액', align: 'right', format: won },
  { key: 'visitors', label: '방문자', align: 'right' },
  { key: 'signups', label: '가입', align: 'right' },
  { key: 'inquiries', label: '문의', align: 'right' },
  { key: 'reviews', label: '후기', align: 'right' },
]

const ANALYTICS_ROWS: Record<string, unknown>[] = [
  { date: '2026-07-07', orders: 128, sales: 4_820_000, visitors: 3412, signups: 24, inquiries: 9, reviews: 12 },
  { date: '2026-07-08', orders: 96, sales: 3_150_000, visitors: 2980, signups: 18, inquiries: 4, reviews: 7 },
  { date: '2026-07-09', orders: 143, sales: 5_640_000, visitors: 3871, signups: 31, inquiries: 12, reviews: 15 },
  { date: '2026-07-10', orders: 87, sales: 2_910_000, visitors: 2640, signups: 12, inquiries: 3, reviews: 0 },
  { date: '2026-07-11', orders: 54, sales: 1_720_000, visitors: 1905, signups: 7, inquiries: 0, reviews: 2 },
  { date: '2026-07-12', orders: 12, sales: 384_000, visitors: 842, signups: 0, inquiries: 0, reviews: 0 },
  { date: '2026-07-13', orders: 1, sales: 32_000, visitors: 214, signups: 0, inquiries: 1, reviews: 0 },
]

const ANALYTICS_SUMMARIES: AnalyticsSummary[] = [
  { label: '최근 7일 합계', row: { orders: 521, sales: 18_656_000, visitors: 15_864, signups: 92, inquiries: 29, reviews: 36 } },
  { label: '이번달 합계', row: { orders: 1842, sales: 64_320_000, visitors: 52_470, signups: 318, inquiries: 96, reviews: 121 } },
]

// ── 상태 매핑 — 목록(checking)과 상세(reviewing)의 코드가 다르다 ───────────
const TO_DETAIL_STATUS: Record<InquiryStatus, InquiryDetailStatus> = {
  received: 'received',
  checking: 'reviewing',
  answered: 'answered',
  hold: 'hold',
  closed: 'closed',
}

const TO_LIST_STATUS: Record<InquiryDetailStatus, InquiryStatus> = {
  received: 'received',
  reviewing: 'checking',
  answered: 'answered',
  hold: 'hold',
  closed: 'closed',
}

/**
 * 메뉴 값 → breadcrumb 경로(현재 디렉토리 depth) · 제목 · 설명.
 *
 * self = 화면이 AdminPageLayout으로 자기 헤더(h1)를 직접 그린다.
 * 이때 셸의 AdminTopbar를 함께 띄우면 페이지 제목이 두 번 쌓이므로 토바를 내린다.
 * title/description은 화면이 prop으로 받는 경우 그대로 넘기고(제목의 단일 소스),
 * 헤더 문구가 컴포넌트에 박혀 있는 화면(상품 목록·상품 등록/수정·주문·공지사항·포트폴리오 폼)에서는
 * 이 표가 메뉴 ↔ 화면 대응을 적어 두는 역할만 한다.
 */
type Trail = { crumbs: string[]; title: string; desc: string; self?: boolean }

const TRAIL: Record<string, Trail> = {
  // ── 개요 ──
  dashboard: { crumbs: ['홈', '대시보드'], title: '대시보드', desc: '오늘의 운영 지표와 최근 활동을 확인하세요.' },
  'dashboard-v2': { crumbs: ['홈', '대시보드', '대시보드 v2'], title: '대시보드', desc: '오늘 처리할 일과 최근 유입·매출 추이를 한 화면에서 확인합니다.', self: true },
  // ── 상품 ──
  'product-screen': { crumbs: ['홈', '상품 관리', '상품 목록'], title: '상품', desc: '카테고리·기획전 트리로 좁히고 행에서 바로 판매 상태를 바꿉니다.', self: true },
  'product-edit': { crumbs: ['홈', '상품 관리', '상품 등록/수정'], title: '상품 등록/수정', desc: '이미지·가격·적립금·배송·옵션·SEO를 한 화면에서 편집합니다.', self: true },
  'product-list': { crumbs: ['홈', '상품 관리', '상품 목록(프리셋)'], title: '상품 목록', desc: '등록된 상품을 검색·필터하고 판매 상태를 관리합니다.' },
  'product-detail': { crumbs: ['홈', '상품 관리', '상품 목록(프리셋)', '상품 상세'], title: '상품 상세', desc: '이미지·기본 정보·옵션과 판매 통계를 확인합니다.' },
  'product-new': { crumbs: ['홈', '상품 관리', '상품 등록(프리셋)'], title: '상품 등록', desc: '기본 정보·이미지·옵션·상세 설명을 입력해 상품을 등록합니다.' },
  // ── 회사관리 ──
  'company-form': {
    crumbs: ['홈', '회사관리', '회사소개'],
    title: '회사소개 관리',
    desc: '사이트 회사소개 페이지의 히어로·소개·역량·성과·CTA를 편집합니다.',
    self: true,
  },
  'history-list': {
    crumbs: ['홈', '회사관리', '연혁'],
    title: '연혁 관리',
    desc: '연도별 연혁을 등록하고 고객 화면 노출 여부를 관리합니다.',
    self: true,
  },
  // ── 전시 ──
  'mainvisual-list': { crumbs: ['홈', '전시 관리', '메인비주얼 관리'], title: '메인비주얼 관리', desc: '메인 화면 상단에 노출되는 비주얼을 등록하고 순서를 관리합니다.', self: true },
  'mainvisual-form': { crumbs: ['홈', '전시 관리', '메인비주얼 관리', '메인비주얼 수정'], title: '메인비주얼 수정', desc: '배너 구분·문구·이미지·링크와 노출 여부를 관리합니다.', self: true },
  'display-mainvisual': { crumbs: ['홈', '전시 관리', '메인비주얼 업로더'], title: '메인비주얼 업로더', desc: '메인 배너 슬라이드를 등록하고 노출 순서를 관리합니다.' },
  'portfolio-list': { crumbs: ['홈', '전시 관리', '포트폴리오 관리'], title: '포트폴리오 관리', desc: '시공 내역(이미지·제목·상세·링크)을 등록·수정하고 순번/활성화를 관리합니다.', self: true },
  'portfolio-form': { crumbs: ['홈', '전시 관리', '포트폴리오 등록/수정'], title: '포트폴리오 등록/수정', desc: '목록과 상세 페이지에 노출되는 포트폴리오 정보를 관리합니다.', self: true },
  // ── 주문 ──
  orders: { crumbs: ['홈', '주문'], title: '주문', desc: '주문 상태별로 처리하고 송장을 입력합니다.', self: true },
  // ── 문의 ──
  'inquiry-manage': { crumbs: ['홈', '문의 관리', '시공 문의 내역'], title: '시공 문의 내역', desc: '시공 문의 챗봇을 통해 접수된 신청 내역을 조회·관리합니다.', self: true },
  'inquiry-manage-detail': { crumbs: ['홈', '문의 관리', '시공 문의 내역', '시공 문의 상세'], title: '시공 문의 상세', desc: '신청자 정보와 문의 응답을 확인하고 답변을 등록합니다.', self: true },
  'inquiry-board': { crumbs: ['홈', '문의 관리', '문의 내역'], title: '문의 내역', desc: '홈페이지에서 접수된 상담 신청서를 확인하고 처리 상태를 관리합니다.', self: true },
  'inquiry-application': { crumbs: ['홈', '문의 관리', '문의 내역', '문의 신청 상세'], title: '문의 신청 상세', desc: '신청자 정보와 문의 응답을 확인하고 상태·담당자를 지정합니다.', self: true },
  'inquiry-list': { crumbs: ['홈', '문의 관리', '문의 목록(프리셋)'], title: '문의 목록', desc: '접수된 문의를 검색·필터하고 담당자와 처리 상태를 관리합니다.' },
  'inquiry-detail': { crumbs: ['홈', '문의 관리', '문의 목록(프리셋)', '문의 상세'], title: '문의 상세', desc: '문의 내용과 주문 정보를 확인하고 답변을 등록합니다.' },
  'inquiry-settings': { crumbs: ['홈', '문의 관리', '문의 설정'], title: '문의 설정', desc: '문의 유형·자동화·알림·상태 배지를 설정합니다.' },
  // ── 회원 ──
  'customer-list': { crumbs: ['홈', '회원 관리', '고객 목록'], title: '고객 목록', desc: '가입한 일반회원·아티스트회원을 조회하고 메모를 관리합니다.', self: true },
  'customer-page': { crumbs: ['홈', '회원 관리', '고객 목록', '고객 상세'], title: '고객 상세', desc: '회원 정보·활동·동의 내역을 확인하고 관리자 메모를 남깁니다.', self: true },
  'member-list': { crumbs: ['홈', '회원 관리', '고객 목록(그룹)'], title: '회원 관리', desc: '그룹으로 좁혀 보고 적립금·차단·메모를 행에서 바로 처리합니다.', self: true },
  'customer-detail': { crumbs: ['홈', '회원 관리', '고객 목록(그룹)', '고객 상세'], title: '고객 상세', desc: '회원 정보·활동·동의 내역을 확인하고 관리자 메모를 남깁니다.', self: true },
  'staff-list': { crumbs: ['홈', '회원 관리', '운영진'], title: '운영진 관리', desc: '운영진 계정과 그룹별 접근 권한을 관리합니다.', self: true },
  // ── 게시판 ──
  'notice-board': { crumbs: ['홈', '게시판', '공지사항'], title: '공지사항', desc: '공지 노출 여부와 상단 고정을 관리합니다.', self: true },
  // ── 설정 ──
  'category-list': { crumbs: ['홈', '설정', '카테고리 관리'], title: '카테고리 관리', desc: '1Depth 카테고리를 등록하고, 각 카테고리의 하위(2Depth)를 설정합니다.', self: true },
  'category-form': { crumbs: ['홈', '설정', '카테고리 관리', '카테고리 등록'], title: '카테고리 등록', desc: '브랜드·카테고리명·이미지(또는 아이콘)·설명과 활성화 여부를 입력합니다.', self: true },
}

// 상세 화면은 사이드바 항목이 아니다 — 부모 목록 메뉴를 계속 선택 상태로 둔다
const SIDEBAR_VALUE: Record<string, string> = {
  'product-detail': 'product-list',
  'inquiry-detail': 'inquiry-list',
  'customer-detail': 'member-list',
  'customer-page': 'customer-list',
  'inquiry-application': 'inquiry-board',
  'inquiry-manage-detail': 'inquiry-manage',
}

/** 문의번호 → 본문(목데이터 풀에서 순환 선택) */
function bodyOf(row: InquiryRow): string {
  const seq = Number(row.id.replace(/\D/g, '')) || 0
  return INQUIRY_BODIES[seq % INQUIRY_BODIES.length]
}

/** 첨부 목데이터 — url이 없으면 AttachmentList가 공용 Placeholder로 그린다 */
function attachmentsOf(row: InquiryRow): Attachment[] {
  if (row.hasAttachment !== true) return []
  return [
    { id: `${row.id}-f1`, name: '상품_실물_사진.jpg', size: 842_000, type: 'image/jpeg' },
    { id: `${row.id}-f2`, name: '주문내역.pdf', size: 128_400, type: 'application/pdf' },
  ]
}

function orderOf(row: InquiryRow): InquiryOrder | undefined {
  if (row.orderNo == null) return undefined
  return {
    no: row.orderNo,
    orderedAt: row.createdAt,
    status: '배송준비',
    paidAmount: 128_000,
    shippingStatus: '집화 완료',
  }
}

function productsOf(row: InquiryRow): InquiryProduct[] {
  const product = PRODUCTS.find((item) => item.name === row.productName)
  if (product == null) return []
  return [
    {
      id: product.id,
      name: product.name,
      option: '기본 / 1개',
      quantity: 1,
      price: product.salePrice ?? product.price,
    },
  ]
}

/** 상태 이력 — 현재 상태까지 채워 StatusTimeline에 시각/처리자를 싣는다 */
function statusHistoryOf(row: InquiryRow): InquiryStatusLog[] {
  const logs: InquiryStatusLog[] = [{ status: 'received', at: row.createdAt, by: '시스템' }]
  if (row.status !== 'received') {
    logs.push({ status: 'reviewing', at: row.createdAt, by: row.assignee ?? 'CS팀' })
  }
  if (row.answeredAt != null) {
    logs.push({ status: 'answered', at: row.answeredAt, by: row.assignee ?? 'CS팀' })
  }
  if (row.status === 'closed') {
    logs.push({ status: 'closed', at: row.answeredAt ?? row.createdAt, by: row.assignee ?? 'CS팀' })
  }
  return logs
}

function historyOf(row: InquiryRow): TimelineItem[] {
  const items: TimelineItem[] = [
    { id: `${row.id}-h1`, title: '문의 접수', description: `${row.author} · ${row.type}`, time: row.createdAt, status: 'done' },
    {
      id: `${row.id}-h2`,
      title: '담당자 배정',
      description: row.assignee ?? '미배정',
      time: row.createdAt,
      status: row.assignee != null ? 'done' : 'pending',
    },
  ]
  items.push({
    id: `${row.id}-h3`,
    title: '답변 등록',
    description: row.answeredAt != null ? '고객에게 발송됨' : '대기 중',
    time: row.answeredAt,
    status: row.answeredAt != null ? 'done' : 'active',
  })
  return items
}

/** 답변완료 건은 답변/버전을 미리 채워 둔다 */
const SEED_ANSWERS: Record<string, InquiryAnswer> = Object.fromEntries(
  INQUIRIES.filter((row) => row.answeredAt != null).map((row) => [
    row.id,
    {
      id: `ans-${row.id}`,
      content: `<p>안녕하세요, ${row.author}님. 문의해 주셔서 감사합니다.</p><p>확인 결과 요청하신 내용은 정상 처리되었습니다. 추가 문의사항이 있으시면 언제든 남겨 주세요.</p>`,
      author: row.assignee ?? 'CS팀',
      createdAt: row.answeredAt ?? row.createdAt,
      isPublic: row.isPublic,
    } satisfies InquiryAnswer,
  ]),
)

const SEED_VERSIONS: Record<string, AnswerVersion[]> = Object.fromEntries(
  Object.entries(SEED_ANSWERS).map(([id, answer]) => [
    id,
    [
      {
        version: 1,
        author: answer.author,
        createdAt: answer.createdAt,
        changeNote: '최초 등록',
        content: answer.content,
      } satisfies AnswerVersion,
    ],
  ]),
)

const SEED_MEMOS: Record<string, InquiryMemo[]> = {
  q1: [
    { id: 'm1', content: '물류센터에 출고 지연 사유 확인 요청함. 회신 오면 즉시 답변 예정.', author: '김민수', createdAt: '2026-07-13 10:02' },
  ],
  q4: [
    { id: 'm2', content: 'PG사 취소 내역 없음. 결제팀에 재확인 요청 필요.', author: '최도현', createdAt: '2026-07-12 16:41' },
  ],
}

/** 신청서 상세의 관리자 메모 초기값 */
const SEED_APPLICATION_MEMOS: Record<string, string> = {
  'ap-02': '연간 계약 기준으로 견적서 초안 작성 중. 분기 납부 가능 여부는 재무팀 확인 후 회신.',
  'ap-05': '메일 발송 로그상 정상 발송 — 사내 프록시에서 차단된 것으로 보인다. IT 담당자 연락처 요청함.',
}

const SEED_APPLICATION_ASSIGNEES: Record<string, string> = {
  'ap-02': '이서준',
  'ap-04': '박하윤',
  'ap-05': '최도현',
  'ap-08': '김민수',
  'ap-10': '이서준',
  'ap-11': '최도현',
}

// ── 상품 상세 파생 ───────────────────────────────────────────────────────
function saleStatusOf(row: ProductRow): ProductSaleStatus {
  if (row.stock === 0) return 'soldOut'
  return row.active ? 'onSale' : 'stopped'
}

/** ProductRow + 목데이터 → ProductDetail이 요구하는 전체 구조 */
function toProductDetail(row: ProductRow, visible: boolean, inquiries: InquiryRow[]): ProductDetailValue {
  const seq = Number(row.id.replace(/\D/g, '')) || 1
  const linked: ProductInquiry[] = inquiries
    .filter((item) => item.productName === row.name)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      createdAt: item.createdAt,
      type: item.type,
      status: item.status === 'answered' ? 'answered' : item.status === 'closed' ? 'closed' : 'waiting',
    }))

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: saleStatusOf(row),
    visible,
    category: row.category,
    tags: ['신상품', row.category, seq % 2 === 0 ? '베스트' : '한정수량'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy ?? '관리자',
    manager: row.createdBy,
    // url 없는 이미지 — ProductDetail이 공용 Placeholder로 대체한다
    images: [{ id: `${row.id}-img1`, alt: row.name }],
    basic: {
      price: row.price,
      salePrice: row.salePrice,
      stock: row.stock,
      shippingFee: row.price >= 50_000 ? 0 : 3000,
      taxable: true,
      safetyStock: 10,
    },
    options: [
      { id: `${row.id}-o1`, name: '색상', value: '블랙', extraPrice: 0, stock: Math.floor(row.stock / 2), active: true },
      { id: `${row.id}-o2`, name: '색상', value: '아이보리', extraPrice: 0, stock: row.stock - Math.floor(row.stock / 2), active: row.stock > 0 },
    ],
    descriptionHtml: `<p><b>${row.name}</b>는 ${row.category} 카테고리의 대표 상품입니다.</p><ul><li>상품코드: ${row.code}</li><li>등록자: ${row.createdBy ?? '관리자'}</li></ul>`,
    sales: MONTHS.map((month, index) => ({ month, count: 40 + ((seq * 7 + index * 13) % 120) })),
    orders: [
      { id: `${row.id}-ord1`, orderNo: 'ORD-20260712-0182', orderedAt: '2026-07-12', customer: '김서연', option: '블랙', quantity: 1, amount: row.salePrice ?? row.price, status: '결제완료' },
      { id: `${row.id}-ord2`, orderNo: 'ORD-20260710-0098', orderedAt: '2026-07-10', customer: '이준호', option: '아이보리', quantity: 2, amount: (row.salePrice ?? row.price) * 2, status: '배송중' },
      { id: `${row.id}-ord3`, orderNo: 'ORD-20260705-0044', orderedAt: '2026-07-05', customer: '박지민', option: '블랙', quantity: 1, amount: row.salePrice ?? row.price, status: '취소' },
    ],
    inquiries: linked,
  }
}

// ── 고객 상세 파생 — MemberRow에 없는 값은 id 순번으로 고정 생성한다(렌더마다 흔들리지 않게) ──
const pad2 = (value: number): string => String(value).padStart(2, '0')

/** 회원 id('u07') → 순번(7) */
function seqOf(id: string): number {
  return Number(id.replace(/\D/g, '')) || 1
}

function toCustomerProfile(row: MemberRow): CustomerProfile {
  const seq = seqOf(row.id)
  const active = row.counts.posts + row.counts.comments + row.counts.reviews > 0

  return {
    id: `MB-${row.joinedAt.slice(0, 10).replace(/-/g, '')}-${pad2(seq)}`,
    name: row.nickname,
    // 활동이 있는 회원만 프로필 사진을 올려 뒀다 — 나머지는 이니셜 아바타
    avatarUrl: active ? mockImage(row.nickname, 'dusk') : undefined,
    signupBadge: seq % 3 === 0 ? '카카오 가입' : '이메일 가입',
    memberType: row.memberType,
    memberTypeTone: MEMBER_TYPE_TONE[row.memberType] ?? 'secondary',
    email: row.account,
    phone: `010-${2000 + ((seq * 137) % 8000)}-${1000 + ((seq * 373) % 9000)}`,
    phoneVerified: seq % 4 !== 0,
    birthday: `19${80 + (seq % 20)}-${pad2(((seq * 7) % 12) + 1)}-${pad2(((seq * 11) % 28) + 1)}`,
    gender: seq % 2 === 0 ? '여성' : '남성',
    signupPath: seq % 3 === 0 ? '카카오 간편가입 · 모바일 웹' : '이메일 · PC 웹',
    signupPathHint: seq % 5 === 0 ? '신규가입 쿠폰 이벤트 유입' : undefined,
  }
}

function toCustomerActivity(row: MemberRow): CustomerActivity {
  // 주문 수는 누적 구매금액에서 역산한다(평균 객단가 64,000원 가정)
  const orderCount = row.totalPurchase === 0 ? 0 : Math.max(1, Math.round(row.totalPurchase / 64_000))
  const seq = seqOf(row.id)
  const idle = orderCount === 0 && row.counts.comments === 0

  return {
    orderCount,
    totalPurchase: row.totalPurchase,
    inquiryCount: row.counts.inquiries,
    commentCount: row.counts.comments,
    joinedAt: row.joinedAt.slice(0, 10),
    // 활동이 전혀 없는 회원은 로그인 기록도 없다 → 상세에서 '기록 없음'으로 떨어진다
    lastLoginAt: idle ? undefined : `2026-07-${pad2(13 - (seq % 7))} ${pad2(9 + (seq % 12))}:${pad2((seq * 7) % 60)}`,
  }
}

function consentsOf(row: MemberRow): ConsentItem[] {
  const seq = seqOf(row.id)
  return [
    { label: '휴대폰 본인 인증', agreed: seq % 4 !== 0, note: seq % 4 !== 0 ? `인증 완료 · ${row.joinedAt.slice(0, 10)}` : undefined },
    { label: '마케팅 정보 활용 동의', agreed: seq % 2 === 0 },
    { label: '광고성 정보 수신 동의', agreed: seq % 3 === 0 },
  ]
}

// ── 고객 상세(CustomerDetail · header='bar') 파생 — CustomerRow에 없는 값은 순번으로 고정 생성한다 ──
function toCustomerPageProfile(row: CustomerRow): CustomerPageProfile {
  const seq = seqOf(row.id)

  return {
    id: `MB-${row.joinedAt.replace(/-/g, '')}-${pad2(seq)}`,
    name: row.nickname,
    // 구매 이력이 있는 고객만 프로필 사진을 올려 뒀다 — 나머지는 이니셜 아바타
    avatarUrl: row.orderCount > 0 ? mockImage(row.nickname, 'dusk') : undefined,
    signupBadge: `${row.joinPath} 가입`,
    memberType: row.memberType,
    memberTypeTone: CUSTOMER_TYPE_TONE[row.memberType] ?? 'secondary',
    email: row.email,
    phone: row.phone,
    phoneVerified: seq % 4 !== 0,
    birthday: `19${80 + (seq % 20)}-${pad2(((seq * 7) % 12) + 1)}-${pad2(((seq * 11) % 28) + 1)}`,
    gender: seq % 2 === 0 ? '여성' : '남성',
    signupPath: `${row.joinPath} · ${seq % 2 === 0 ? '모바일 웹' : 'PC 웹'}`,
    signupPathHint: seq % 5 === 0 ? '신규가입 쿠폰 이벤트 유입' : undefined,
  }
}

function toCustomerPageActivity(row: CustomerRow): CustomerPageActivity {
  const seq = seqOf(row.id)

  return {
    orderCount: row.orderCount,
    totalPurchase: row.totalPurchase,
    inquiryCount: (seq * 3) % 7,
    commentCount: (seq * 5) % 13,
    joinedAt: row.joinedAt,
    // 주문이 한 건도 없는 고객은 로그인 기록도 없다 → 상세에서 '기록 없음'으로 떨어진다
    lastLoginAt:
      row.orderCount === 0
        ? undefined
        : `2026-07-${pad2(13 - (seq % 7))} ${pad2(9 + (seq % 12))}:${pad2((seq * 7) % 60)}`,
  }
}

function customerConsentsOf(row: CustomerRow): ConsentItem[] {
  const seq = seqOf(row.id)
  return [
    { label: '휴대폰 본인 인증', agreed: seq % 4 !== 0, note: seq % 4 !== 0 ? `인증 완료 · ${row.joinedAt}` : undefined },
    { label: '마케팅 정보 활용 동의', agreed: seq % 2 === 0 },
    { label: '광고성 정보 수신 동의', agreed: seq % 3 === 0 },
  ]
}

/** 시공 문의 상세의 Q/A — 접수 번호로 질문지를 골라 돌려 쓴다 */
function manageQaOf(row: InquiryManageRow): InquiryQa[] {
  return MANAGE_QA_POOL[row.no % MANAGE_QA_POOL.length]
}

// ── SearchPanel 조건(SearchValues) 해석 — InquiryBoard·NoticeBoard는 검색을 직접 하지 않는다
//    (조건만 onSearch로 올려보내고 걸러진 rows를 다시 받는 서버 검색 구조).
//    여기서는 서버 대신 목데이터를 그 자리에서 거른다.
/** text·select 조건 — 없거나 빈 값이면 '' (= 조건 없음) */
function textOf(values: SearchValues, key: string): string {
  const value = values[key]
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/** daterange 조건 — 없으면 양끝이 열린 구간 */
function rangeOf(values: SearchValues, key: string): DateRangeValue {
  const value = values[key]
  if (value != null && typeof value === 'object' && !Array.isArray(value)) return value
  return { start: null, end: null }
}

/** 'YYYY-MM-DD'는 사전순 비교가 곧 날짜 비교다 — 파싱하지 않는다 */
function inRange(date: string, range: DateRangeValue): boolean {
  const day = date.slice(0, 10)
  if (range.start != null && day < range.start) return false
  if (range.end != null && day > range.end) return false
  return true
}

/** 조건이 비어 있으면 통과 — 있으면 부분 일치 */
function matches(field: string, query: string): boolean {
  return query === '' || field.toLowerCase().includes(query)
}

// ── 문의 신청 상세 파생 ──────────────────────────────────────────────────
function applicationAnswersOf(row: InquiryApplicationRow): ApplicationAnswer[] {
  return APPLICATION_ANSWERS[row.category] ?? APPLICATION_ANSWERS['기타']
}

/** 진행 단계 — 현재 상태까지 done, 그 뒤는 todo. 보류는 흐름에서 빠지므로 skipped로 표시한다 */
function applicationStepsOf(row: InquiryApplicationRow, assignee: string | null): StatusStep[] {
  const flow: InquiryApplicationStatus[] = ['pending', 'checking', 'done']
  const currentIndex = flow.indexOf(row.status)

  const steps: StatusStep[] = flow.map((status, index) => ({
    key: status,
    label: APPLICATION_STATUS_LABEL[status],
    at: index === 0 ? row.appliedAt : index <= currentIndex ? row.updatedAt : undefined,
    by: index === 0 ? '시스템' : index <= currentIndex ? (assignee ?? 'CS팀') : undefined,
    state:
      row.status === 'hold'
        ? index === 0
          ? 'done'
          : 'skipped'
        : index < currentIndex
          ? 'done'
          : index === currentIndex
            ? 'current'
            : 'todo',
  }))

  if (row.status === 'hold') {
    steps.push({ key: 'hold', label: '보류', at: row.updatedAt, by: assignee ?? 'CS팀', state: 'current' })
  }
  return steps
}

// ── ProductListScreen ↔ ProductEditPage 매핑 ─────────────────────────────
const PRODUCT_SCREEN_STATUS: Record<ProductScreenStatus, string> = {
  onsale: '판매중',
  soldout: '품절',
  hidden: '숨김',
}

/** 상품 행 → 편집 폼 값. 2차 카테고리 라벨이 행의 category와 같아 그대로 찾아 붙인다 */
function toProductEdit(row: ProductScreenRow): ProductEditValue {
  const parent = PRODUCT_EDIT_CATEGORIES.find((item) =>
    (item.children ?? []).some((child) => child.label === row.category),
  )
  const child = (parent?.children ?? []).find((item) => item.label === row.category)
  const brand = PRODUCT_BRANDS.find((item) =>
    row.name.toLowerCase().startsWith(item.label.toLowerCase()),
  )

  return {
    ...EMPTY_PRODUCT_VALUE,
    brand: brand?.value ?? null,
    category1: parent?.value ?? null,
    category2: child?.value ?? null,
    name: row.name,
    images: row.thumbnail != null ? [createProductImage(row.thumbnail)] : [],
    intro: `<p><b>${row.name}</b> — 자체코드 ${row.code}</p>`,
    maker: brand?.label ?? '',
    origin: '해외 수입',
    headline: `${row.category} · ${PRODUCT_SCREEN_STATUS[row.status]}`,
    detailHtml: `<p>상품 번호 ${row.no} · 등록일 ${row.createdAt}</p><p>소속 기획전: ${row.exhibits.length > 0 ? row.exhibits.join(', ') : '없음'}</p>`,
    price: String(row.price),
    stock: row.stock,
    soldOut: row.status === 'soldout',
    onSale: row.status === 'onsale',
    listed: row.status !== 'hidden',
    seoTitle: row.name,
  }
}

/** 편집 폼 값 → 목록 행의 판매 상태(단일 소스가 되도록 한 방향으로만 계산한다) */
function toScreenStatus(value: ProductEditValue): ProductScreenStatus {
  if (value.soldOut || value.stock === 0) return 'soldout'
  if (!value.listed || !value.onSale) return 'hidden'
  return 'onsale'
}

/** 편집 폼 값 → 헤더 배지 상태 */
function toEditStatus(value: ProductEditValue): ProductStatus {
  if (value.soldOut || value.stock === 0) return 'soldout'
  if (!value.listed) return 'hidden'
  return value.onSale ? 'selling' : 'draft'
}

export type AdminSuiteProps = {
  /** 처음 열릴 화면 — 사이드바 메뉴 값(dashboard · product-screen · member-list …) */
  initialMenu?: string
}

/**
 * Templates/AdminSuite — 어드민 셸 하나로 28개 화면을 잇는다.
 *
 *   개요   대시보드 · 대시보드 v2(DashboardScreen)
 *   상품   상품 목록(ProductListScreen) · 상품 등록/수정(ProductEditPage) · 프리셋 목록/상세/등록
 *   전시   메인비주얼 관리(MainVisualList) → 메인비주얼 수정(MainVisualForm) ·
 *          메인비주얼 업로더(MainVisualUploader) · 포트폴리오 관리/등록·수정
 *   주문   OrderList
 *   문의   시공 문의 내역(InquiryManageList) → 시공 문의 상세(InquiryManageDetail) ·
 *          문의 내역(InquiryBoard) → 신청 상세(InquiryApplicationDetail) · 프리셋 목록/상세 · 설정
 *   회원   고객 목록(CustomerList) → 고객 상세(CustomerDetail · header='bar') ·
 *          고객 목록·그룹(MemberList) → 고객 상세(CustomerDetail) · 운영진(StaffList)
 *   게시판 공지사항(NoticeBoard)
 *   설정   카테고리 관리(CategoryList) → 카테고리 등록/수정(CategoryForm)
 *
 * 화면 컴포넌트는 상태를 갖지 않거나(주문·대시보드) 화면 상태만 갖는다(목록의 탭·페이지).
 * 값이 바뀌는 행위는 전부 이 템플릿의 state로 올라온다 — 서버를 갈아끼울 지점이 한 곳이다.
 */
export function AdminSuite({ initialMenu = 'dashboard' }: AdminSuiteProps = {}) {
  const [menu, setMenu] = useState(initialMenu)
  // 회사관리 — 회사소개(폼 값)와 연혁(표 행)은 어드민이 고치면 사이트 화면이 그대로 따라간다
  const [company, setCompany] = useState<CompanyValue>(COMPANY_VALUE)
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>(HISTORY_ROWS)
  const [nav, setNav] = useState('admin')

  // ── 상품(프리셋) ──
  const [products, setProducts] = useState<ProductRow[]>(PRODUCTS)
  const [productId, setProductId] = useState<string | null>(null)
  const [productVisible, setProductVisible] = useState<Record<string, boolean>>({})
  const [productForm, setProductForm] = useState<ProductFormValue>(EMPTY_PRODUCT)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // ── 상품(레퍼런스형) ──
  const [screenProducts, setScreenProducts] = useState<ProductScreenRow[]>(PRODUCT_ROWS)
  const [productEdit, setProductEdit] = useState<ProductEditValue>(EMPTY_PRODUCT_VALUE)
  // null = 신규 등록, 값 = 수정 중인 행 id
  const [productEditId, setProductEditId] = useState<string | null>(null)

  // ── 문의(프리셋) ──
  const [inquiries, setInquiries] = useState<InquiryRow[]>(INQUIRIES)
  const [inquiryId, setInquiryId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, InquiryAnswer>>(SEED_ANSWERS)
  const [versions, setVersions] = useState<Record<string, AnswerVersion[]>>(SEED_VERSIONS)
  const [memos, setMemos] = useState<Record<string, InquiryMemo[]>>(SEED_MEMOS)

  // ── 문의 설정 ──
  const [settingTypes, setSettingTypes] = useState(SETTING_TYPES)
  const [automation, setAutomation] = useState(SETTING_AUTOMATION)
  const [notification, setNotification] = useState(SETTING_NOTIFICATION)
  const [statuses, setStatuses] = useState(SETTING_STATUSES)
  const [templates, setTemplates] = useState(SETTING_TEMPLATES)

  // ── 문의 신청(상담) ──
  const [applications, setApplications] = useState<InquiryApplicationRow[]>(APPLICATIONS)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  // SearchPanel의 [검색]으로 확정된 조건 — null이면 조건 없음
  const [applicationQuery, setApplicationQuery] = useState<SearchValues | null>(null)
  // 상세의 상태 Select는 초안이다 — 하단 [상태 변경]을 눌러야 목록에 반영된다
  const [applicationDraft, setApplicationDraft] = useState<Record<string, InquiryApplicationStatus>>({})
  const [applicationAssignees, setApplicationAssignees] = useState<Record<string, string>>(SEED_APPLICATION_ASSIGNEES)
  const [applicationMemos, setApplicationMemos] = useState<Record<string, string>>(SEED_APPLICATION_MEMOS)

  // ── 회원 ──
  const [members, setMembers] = useState<MemberRow[]>(MEMBERS)
  const [memberGroup, setMemberGroup] = useState('all')
  const [memberKeyword, setMemberKeyword] = useState('')
  const [blocked, setBlocked] = useState<Record<string, boolean>>({ u10: true })
  const [customerId, setCustomerId] = useState<string | null>(null)

  // ── 고객(CustomerList → CustomerDetail · header='bar') ──
  // 탭·검색·페이지는 CustomerList가 내부에서 굴린다 — 여기서는 데이터와 행 클릭만 들고 있는다
  const [customers, setCustomers] = useState<CustomerRow[]>(CUSTOMERS)
  const [customerRowId, setCustomerRowId] = useState<string | null>(null)
  const [customerBlocked, setCustomerBlocked] = useState<Record<string, boolean>>({})

  // ── 운영진 ──
  const [staff, setStaff] = useState<StaffRow[]>(STAFF)

  // ── 주문 ──
  const [orders, setOrders] = useState<OrderRow[]>(ORDERS)
  const [orderTab, setOrderTab] = useState<string>('all')
  const [orderKeyword, setOrderKeyword] = useState('')
  // 확정된 검색어 — 엔터로만 갱신된다(입력 중에 목록이 흔들리지 않게)
  const [orderQuery, setOrderQuery] = useState('')

  // ── 게시판 ──
  const [notices, setNotices] = useState<NoticeRow[]>(NOTICES)
  const [noticeQuery, setNoticeQuery] = useState<SearchValues | null>(null)

  // ── 전시 ──
  const [banners, setBanners] = useState<MainVisualItem[]>([])
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>(PORTFOLIOS)
  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormValue>(EMPTY_PORTFOLIO)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)

  // ── 전시: 메인 비주얼(탭별 목록 → 수정 폼) ──
  const [visuals, setVisuals] = useState<Record<string, MainVisualRow[]>>(MAIN_VISUAL_ROWS)
  const [visualTab, setVisualTab] = useState(MAIN_VISUAL_TABS[0]?.value ?? 'used')
  const [visualStatus, setVisualStatus] = useState('all')
  const [visualKeyword, setVisualKeyword] = useState('')
  const [visualSort, setVisualSort] = useState('order')
  const [visualForm, setVisualForm] = useState<MainVisualValue>(EMPTY_MAIN_VISUAL_VALUE)
  // null = 신규 등록, 값 = 수정 중인 행 id
  const [visualId, setVisualId] = useState<string | null>(null)

  // ── 설정: 카테고리 ──
  const [categories, setCategories] = useState<CategoryRow[]>(CATEGORIES)
  const [categoryForm, setCategoryForm] = useState<CategoryValue>(EMPTY_CATEGORY)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  // ── 시공 문의(InquiryManageList → InquiryManageDetail) ──
  const [manageRows, setManageRows] = useState<InquiryManageRow[]>(MANAGE_INQUIRIES)
  const [manageId, setManageId] = useState<string | null>(null)
  const [manageAnswers, setManageAnswers] = useState<Record<string, string>>(SEED_MANAGE_ANSWERS)
  const [manageAnswered, setManageAnswered] =
    useState<Record<string, { at: string; by: string }>>(SEED_MANAGE_ANSWERED)
  // 답변 카드 자체의 ON/OFF 토글 — 끄면 답변 없이 상태만 바꾼다
  const [manageAnswerOn, setManageAnswerOn] = useState<Record<string, boolean>>({})
  // 저장을 눌렀는데 답변이 비어 있을 때만 뜨는 에러 — 입력을 시작하면 지운다
  const [manageErrors, setManageErrors] = useState<Record<string, string>>({})

  // ── 대시보드 v2 ──
  const [dashboardTab, setDashboardTab] = useState('used')

  const product = products.find((row) => row.id === productId) ?? null
  const inquiry = inquiries.find((row) => row.id === inquiryId) ?? null
  const inquiryIndex = inquiry != null ? inquiries.findIndex((row) => row.id === inquiry.id) : -1
  const member = members.find((row) => row.id === customerId) ?? null
  const customer = customers.find((row) => row.id === customerRowId) ?? null
  const application = applications.find((row) => row.id === applicationId) ?? null
  const manageRow = manageRows.find((row) => row.id === manageId) ?? null

  // ── 화면 이동 ──
  const goMenu = (value: string) => {
    // 사이드바로 '상품 등록'에 들어오면 언제나 빈 폼(등록 모드)
    if (value === 'product-new') {
      setProductForm(EMPTY_PRODUCT)
      setFormMode('create')
    }
    // 레퍼런스형 상품 등록/수정도 같은 규칙 — 메뉴로 들어오면 신규 등록
    if (value === 'product-edit') {
      setProductEdit(EMPTY_PRODUCT_VALUE)
      setProductEditId(null)
    }
    // 포트폴리오 등록/수정도 마찬가지
    if (value === 'portfolio-form') {
      setPortfolioForm(EMPTY_PORTFOLIO)
      setPortfolioId(null)
    }
    // 메인비주얼 수정 — 메뉴로 들어오면 지금 보고 있는 탭(배너 구분)의 신규 배너로 시작한다
    if (value === 'mainvisual-form') {
      setVisualForm({ ...EMPTY_MAIN_VISUAL_VALUE, section: visualTab })
      setVisualId(null)
    }
    // 카테고리 등록도 같은 규칙 — 메뉴로 들어오면 빈 폼
    if (value === 'category-form') {
      setCategoryForm(EMPTY_CATEGORY)
      setCategoryId(null)
    }
    setMenu(value)
  }

  const openProduct = (id: string) => {
    setProductId(id)
    setMenu('product-detail')
  }

  const openInquiry = (id: string) => {
    setInquiryId(id)
    setMenu('inquiry-detail')
  }

  const openCustomer = (id: string) => {
    setCustomerId(id)
    setMenu('customer-detail')
  }

  const openApplication = (id: string) => {
    setApplicationId(id)
    setMenu('inquiry-application')
  }

  const openCustomerPage = (id: string) => {
    setCustomerRowId(id)
    setMenu('customer-page')
  }

  const openManageInquiry = (id: string) => {
    setManageId(id)
    setMenu('inquiry-manage-detail')
  }

  const editProduct = (row: ProductRow) => {
    setProductForm({
      name: row.name,
      category: row.category,
      price: String(row.price),
      stock: row.stock,
      onSale: row.active,
      images: [],
      options: [],
      description: '',
    })
    setFormMode('edit')
    setMenu('product-new')
  }

  const editScreenProduct = (row: ProductScreenRow) => {
    setProductEdit(toProductEdit(row))
    setProductEditId(row.id)
    setMenu('product-edit')
  }

  const editPortfolio = (row: PortfolioRow) => {
    setPortfolioForm({
      category: row.category,
      title: row.title,
      link: row.link ?? '',
      image: row.thumbnail,
      content: row.detail != null ? `<p>${row.detail}</p>` : '',
      active: row.active,
      // 이미지나 상세 내용이 하나라도 있으면 상세 페이지를 쓰는 포트폴리오다
      detailEnabled: row.thumbnail != null || row.detail != null,
    })
    setPortfolioId(row.id)
    setMenu('portfolio-form')
  }

  /** 목록 행 → 메인비주얼 수정 폼. 배너 구분(section)은 지금 보고 있는 탭이다 */
  const editVisual = (row: MainVisualRow) => {
    setVisualForm({
      section: visualTab,
      // 제목이 있는 배너는 문구를 쓰는 배너다
      useCopy: row.title !== '',
      title: row.title,
      image: row.image,
      active: row.active,
    })
    setVisualId(row.id)
    setMenu('mainvisual-form')
  }

  const editCategory = (row: CategoryRow) => {
    setCategoryForm({
      brand: row.brand,
      name: row.name,
      // 이미지가 있으면 이미지, 없으면 아이콘(이모지) 모드
      useImage: row.image != null,
      image: row.image,
      emoji: row.emoji,
      description: row.description ?? '',
      active: row.active,
    })
    setCategoryId(row.id)
    setMenu('category-form')
  }

  // ── 상품(프리셋) 핸들러 ──
  const toggleProductActive = (id: string, next: boolean) =>
    setProducts((prev) => prev.map((row) => (row.id === id ? { ...row, active: next } : row)))

  const bulkProductActive = (ids: string[], active: boolean) =>
    setProducts((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, active } : row)))

  const bulkProductCategory = (ids: string[], category: string) =>
    setProducts((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, category } : row)))

  const bulkProductDelete = (ids: string[]) =>
    setProducts((prev) => prev.filter((row) => !ids.includes(row.id)))

  // ── 상품(레퍼런스형) 핸들러 ──
  const setScreenStatus = (ids: string[], next: ProductScreenStatus) =>
    setScreenProducts((prev) =>
      prev.map((row) =>
        ids.includes(row.id)
          ? // 판매중으로 되돌려도 재고가 0이면 품절이 맞다
            { ...row, status: next === 'onsale' && row.stock === 0 ? 'soldout' : next }
          : row,
      ),
    )

  const deleteScreenProducts = (ids: string[]) =>
    setScreenProducts((prev) => prev.filter((row) => !ids.includes(row.id)))

  const copyScreenProduct = (row: ProductScreenRow) =>
    setScreenProducts((prev) => {
      const index = prev.findIndex((item) => item.id === row.id)
      const copy: ProductScreenRow = {
        ...row,
        id: `${row.id}-copy-${prev.length + 1}`,
        no: String(Number(row.no) + 1),
        name: `${row.name} (복사본)`,
        code: `${row.code}-C`,
        status: 'hidden',
        createdAt: TODAY,
        updatedAt: TODAY,
      }
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]
    })

  /** 편집 폼 저장 — 수정이면 행을 갈아끼우고, 신규면 목록 맨 앞에 넣는다 */
  const saveProductEdit = () => {
    const status = toScreenStatus(productEdit)
    const category =
      PRODUCT_EDIT_CATEGORIES.flatMap((item) => item.children ?? []).find(
        (child) => child.value === productEdit.category2,
      )?.label ?? '기타'

    setScreenProducts((prev) => {
      if (productEditId != null) {
        return prev.map((row) =>
          row.id === productEditId
            ? {
                ...row,
                name: productEdit.name !== '' ? productEdit.name : row.name,
                price: Number(productEdit.price) || row.price,
                stock: productEdit.stock,
                status,
                category,
                thumbnail: productEdit.images[0]?.url ?? row.thumbnail,
                updatedAt: TODAY,
              }
            : row,
        )
      }

      const id = `ps-${Date.now().toString(36)}`
      const next: ProductScreenRow = {
        id,
        no: String(1_030_000 + prev.length),
        name: productEdit.name !== '' ? productEdit.name : '이름 없는 상품',
        code: productEdit.seoTitle !== '' ? productEdit.seoTitle.slice(0, 12) : id.toUpperCase(),
        thumbnail: productEdit.images[0]?.url,
        price: Number(productEdit.price) || 0,
        status,
        stock: productEdit.stock,
        category,
        exhibits: [],
        createdAt: TODAY,
        updatedAt: TODAY,
      }
      return [next, ...prev]
    })

    goMenu('product-screen')
  }

  // ── 문의(프리셋) 핸들러 ──
  const patchInquiry = (ids: string[], patch: Partial<InquiryRow>) =>
    setInquiries((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, ...patch } : row)))

  const submitAnswer = (
    row: InquiryRow,
    draft: AnswerDraft,
    meta: { mode: 'create' | 'edit'; editReason?: string },
  ) => {
    setAnswers((prev) => {
      const before = prev[row.id]
      return {
        ...prev,
        [row.id]: {
          id: `ans-${row.id}`,
          content: draft.content,
          author: before?.author ?? ME.name,
          createdAt: before?.createdAt ?? NOW,
          updatedAt: meta.mode === 'edit' ? NOW : undefined,
          isPublic: draft.isPublic,
          attachments: draft.attachments,
        },
      }
    })

    setVersions((prev) => {
      const list = prev[row.id] ?? []
      const next: AnswerVersion = {
        version: list.length + 1,
        author: ME.name,
        createdAt: NOW,
        changeNote: meta.mode === 'edit' ? meta.editReason : '최초 등록',
        content: draft.content,
      }
      return { ...prev, [row.id]: [...list, next] }
    })

    patchInquiry([row.id], {
      status: 'answered',
      answeredAt: TODAY,
      assignee: row.assignee ?? ME.name,
    })
  }

  /** 이전 버전 복원 — 현재 답변 본문을 되돌리고 이력에 복원 버전을 쌓는다 */
  const restoreAnswer = (row: InquiryRow, version: AnswerVersion) => {
    setAnswers((prev) => {
      const before = prev[row.id]
      if (before == null) return prev
      return { ...prev, [row.id]: { ...before, content: version.content, updatedAt: NOW } }
    })
    setVersions((prev) => {
      const list = prev[row.id] ?? []
      return {
        ...prev,
        [row.id]: [
          ...list,
          {
            version: list.length + 1,
            author: ME.name,
            createdAt: NOW,
            changeNote: `v${version.version} 복원`,
            content: version.content,
          },
        ],
      }
    })
  }

  const addMemo = (id: string, content: string) =>
    setMemos((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        { id: `memo-${Date.now()}`, content, author: ME.name, createdAt: NOW },
      ],
    }))

  const updateMemo = (id: string, memoId: string, content: string) =>
    setMemos((prev) => ({
      ...prev,
      [id]: (prev[id] ?? []).map((memo) =>
        memo.id === memoId ? { ...memo, content, updatedAt: NOW } : memo,
      ),
    }))

  const deleteMemo = (id: string, memoId: string) =>
    setMemos((prev) => ({ ...prev, [id]: (prev[id] ?? []).filter((memo) => memo.id !== memoId) }))

  // ── 문의 신청 핸들러 ──
  const patchApplication = (ids: string[], status: InquiryApplicationStatus) =>
    setApplications((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, status, updatedAt: TODAY } : row)),
    )

  const deleteApplications = (ids: string[]) =>
    setApplications((prev) => prev.filter((row) => !ids.includes(row.id)))

  // 검색 조건(제목·신청자·연락처·이메일·기간·상태·카테고리) — 서버 대신 여기서 거른다
  const visibleApplications = useMemo(() => {
    const query = applicationQuery
    if (query == null) return applications

    const status = textOf(query, 'status')
    const category = textOf(query, 'category')
    const period = rangeOf(query, 'period')

    return applications.filter(
      (row) =>
        matches(row.title, textOf(query, 'title')) &&
        matches(row.applicant, textOf(query, 'applicant')) &&
        matches(row.phone, textOf(query, 'phone')) &&
        matches(row.email, textOf(query, 'email')) &&
        (status === '' || row.status === status) &&
        (category === '' || row.category.toLowerCase() === category) &&
        inRange(row.appliedAt, period),
    )
  }, [applications, applicationQuery])

  // 상세의 이전/다음은 지금 보고 있는 목록(검색 조건이 걸린 결과) 안에서 움직인다
  const applicationIndex =
    application != null ? visibleApplications.findIndex((row) => row.id === application.id) : -1

  // ── 회원 핸들러 ──
  const memberGroups = useMemo<GroupPanelItem[]>(
    () => [
      { key: 'all', label: '전체 사용자', count: members.length },
      ...MEMBER_GROUP_NAMES.map((label) => ({
        key: label,
        label,
        count: members.filter((row) => row.group === label).length,
        group: '그룹',
      })),
    ],
    [members],
  )

  // 그룹 패널 + 검색어로 좁힌다 — MemberList는 걸러진 rows를 그대로 그린다
  const visibleMembers = useMemo(() => {
    const query = memberKeyword.trim().toLowerCase()
    return members.filter((row) => {
      if (memberGroup !== 'all' && row.group !== memberGroup) return false
      if (query === '') return true
      return [row.nickname, row.account, row.group].some((field) =>
        field.toLowerCase().includes(query),
      )
    })
  }, [members, memberGroup, memberKeyword])

  const patchMember = (ids: string[], patch: Partial<MemberRow>) =>
    setMembers((prev) => prev.map((row) => (ids.includes(row.id) ? { ...row, ...patch } : row)))

  const deleteMembers = (ids: string[]) => {
    setMembers((prev) => prev.filter((row) => !ids.includes(row.id)))
    if (customerId != null && ids.includes(customerId)) setCustomerId(null)
  }

  const blockMember = (id: string, next: boolean) => {
    setBlocked((prev) => ({ ...prev, [id]: next }))
    // 차단하면 회원 유형도 함께 바뀐다 — 목록의 배지와 상세의 상태가 어긋나지 않게
    patchMember([id], { memberType: next ? '차단 회원' : '일반 회원' })
  }

  // ── 고객(CustomerList · CustomerDetail) 핸들러 ──
  const patchCustomer = (id: string, patch: Partial<CustomerRow>) =>
    setCustomers((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((row) => row.id !== id))
    if (customerRowId === id) setCustomerRowId(null)
  }

  // 차단은 상세 화면의 상태다 — 목록의 회원 유형(탭 축)은 건드리지 않는다
  const blockCustomer = (id: string, next: boolean) =>
    setCustomerBlocked((prev) => ({ ...prev, [id]: next }))

  // ── 주문 핸들러 ──
  const orderTabs = useMemo<CategoryTabItem[]>(
    () =>
      ORDER_TABS.map((tab) => ({
        label: tab.label,
        value: tab.value,
        count: tab.value === 'all' ? orders.length : orders.filter((row) => row.status === tab.value).length,
        fixed: true,
      })),
    [orders],
  )

  const visibleOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase()
    return orders.filter((row) => {
      if (orderTab !== 'all' && row.status !== orderTab) return false
      if (query === '') return true
      return [row.buyer, row.phone, row.orderNo, row.shipping.trackingNo, row.receiver.name].some(
        (field) => field.toLowerCase().includes(query),
      )
    })
  }, [orders, orderTab, orderQuery])

  const patchShipping = (target: OrderRow, patch: Partial<OrderRow['shipping']>) =>
    setOrders((prev) =>
      prev.map((row) =>
        row.id === target.id ? { ...row, shipping: { ...row.shipping, ...patch } } : row,
      ),
    )

  // ── 게시판 핸들러 ──
  const patchNotices = (ids: string[], patch: (row: NoticeRow) => NoticeRow) =>
    setNotices((prev) => prev.map((row) => (ids.includes(row.id) ? patch(row) : row)))

  // 목데이터에 공지 본문이 없어 '내용' 조건은 제목까지만 훑는다 — 나머지는 그대로 거른다
  const visibleNotices = useMemo(() => {
    const query = noticeQuery
    if (query == null) return notices

    const content = textOf(query, 'content')
    const category = textOf(query, 'category')
    const status = textOf(query, 'status')
    const period = rangeOf(query, 'period')

    return notices.filter(
      (row) =>
        matches(row.title, textOf(query, 'title')) &&
        matches(row.title, content) &&
        matches(row.author, textOf(query, 'author')) &&
        (category === '' || row.category.toLowerCase() === category) &&
        (status === '' || row.status === status) &&
        inRange(row.createdAt, period),
    )
  }, [notices, noticeQuery])

  // ── 포트폴리오 핸들러 ──
  const savePortfolio = () => {
    const detail = portfolioForm.content.replace(/<[^>]+>/g, '').trim()

    setPortfolios((prev) => {
      if (portfolioId != null) {
        return prev.map((row) =>
          row.id === portfolioId
            ? {
                ...row,
                title: portfolioForm.title !== '' ? portfolioForm.title : row.title,
                category: portfolioForm.category ?? row.category,
                link: portfolioForm.link !== '' ? portfolioForm.link : undefined,
                thumbnail: portfolioForm.image,
                detail: detail !== '' ? detail : undefined,
                active: portfolioForm.active,
                updatedAt: TODAY,
                updatedBy: ME.name,
              }
            : row,
        )
      }

      const next: PortfolioRow = {
        id: `pf-${Date.now().toString(36)}`,
        title: portfolioForm.title !== '' ? portfolioForm.title : '제목 없는 포트폴리오',
        category: portfolioForm.category ?? PORTFOLIO_CATEGORIES[0].value,
        link: portfolioForm.link !== '' ? portfolioForm.link : undefined,
        thumbnail: portfolioForm.image,
        detail: detail !== '' ? detail : undefined,
        createdAt: TODAY,
        createdBy: ME.name,
        active: portfolioForm.active,
      }
      return [next, ...prev]
    })

    goMenu('portfolio-list')
  }

  // ── 메인 비주얼 핸들러 ──
  // 탭 건수는 목데이터에서 매번 센다(배너를 추가/삭제해도 배지가 어긋나지 않게)
  const visualTabs = useMemo(
    () => MAIN_VISUAL_TABS.map((tab) => ({ ...tab, count: visuals[tab.value]?.length ?? 0 })),
    [visuals],
  )

  // MainVisualList는 받은 rows를 그대로 그린다 — 탭·상태·검색·정렬을 여기서 걸러 넘긴다
  const visibleVisuals = useMemo(() => {
    const query = visualKeyword.trim().toLowerCase()
    const rows = (visuals[visualTab] ?? []).filter((row) => {
      if (visualStatus === 'active' && !row.active) return false
      if (visualStatus === 'inactive' && row.active) return false
      return query === '' || row.title.toLowerCase().includes(query)
    })

    return [...rows].sort((a, b) => {
      if (visualSort === 'latest') return b.updatedAt.localeCompare(a.updatedAt)
      if (visualSort === 'title') return a.title.localeCompare(b.title, 'ko')
      return a.order - b.order
    })
  }, [visuals, visualTab, visualStatus, visualKeyword, visualSort])

  // 걸러진 목록을 드래그하면 순번이 어긋난다 — 원본 순서를 보고 있을 때만 손잡이 열을 켠다
  const canReorderVisuals =
    visualStatus === 'all' && visualKeyword.trim() === '' && visualSort === 'order'

  /** 현재 탭의 배너를 통째로 갈아끼우고 순번을 1부터 다시 매긴다 */
  const replaceVisuals = (rows: MainVisualRow[]) =>
    setVisuals((prev) => ({
      ...prev,
      [visualTab]: rows.map((row, index) => ({ ...row, order: index + 1 })),
    }))

  const deleteVisuals = (ids: string[]) =>
    setVisuals((prev) => ({
      ...prev,
      [visualTab]: (prev[visualTab] ?? [])
        .filter((row) => !ids.includes(row.id))
        .map((row, index) => ({ ...row, order: index + 1 })),
    }))

  const toggleVisualActive = (id: string, next: boolean) =>
    setVisuals((prev) => ({
      ...prev,
      [visualTab]: (prev[visualTab] ?? []).map((row) =>
        row.id === id ? { ...row, active: next } : row,
      ),
    }))

  /** 폼 저장 — 수정이면 원래 배너를 갈아끼우고(구분이 바뀌면 다른 탭으로 옮긴다), 신규면 맨 뒤에 붙인다 */
  const saveVisual = () => {
    const section = visualForm.section ?? visualTab
    const title = visualForm.title !== '' ? visualForm.title : '제목 없는 메인 비주얼'

    setVisuals((prev) => {
      // 수정 중인 배너는 모든 탭에서 빼 둔다 — 배너 구분(section)을 바꿔 저장할 수 있다
      let before: MainVisualRow | undefined
      const stripped: Record<string, MainVisualRow[]> = {}
      for (const [key, rows] of Object.entries(prev)) {
        if (visualId != null) {
          const found = rows.find((row) => row.id === visualId)
          if (found != null) before = found
        }
        stripped[key] = visualId == null ? rows : rows.filter((row) => row.id !== visualId)
      }

      const next: MainVisualRow = {
        id: before?.id ?? `mv-${Date.now().toString(36)}`,
        // 수정은 제자리를 지키고 신규는 맨 뒤로 — 아래에서 1..n으로 다시 매긴다
        order: before?.order ?? Number.MAX_SAFE_INTEGER,
        image: visualForm.image,
        // 폼에 타입 필드가 없다 — 수정은 원래 타입을 지키고 신규는 '서브'로 시작한다
        type: before?.type ?? '서브',
        title,
        createdAt: before?.createdAt ?? TODAY,
        updatedAt: TODAY,
        createdBy: before?.createdBy ?? ME.name,
        updatedBy: ME.name,
        active: visualForm.active,
      }

      const merged = [...(stripped[section] ?? []), next]
        .sort((a, b) => a.order - b.order)
        .map((row, index) => ({ ...row, order: index + 1 }))

      return { ...stripped, [section]: merged }
    })

    // 저장한 배너가 있는 탭을 열어 준다(구분을 바꿨어도 결과가 눈에 보이게)
    setVisualTab(section)
    goMenu('mainvisual-list')
  }

  // ── 카테고리 핸들러 ──
  const deleteCategories = (ids: string[]) =>
    setCategories((prev) =>
      prev
        .filter((row) => !ids.includes(row.id))
        .map((row, index) => ({ ...row, order: index + 1 })),
    )

  const saveCategory = () => {
    const name = categoryForm.name !== '' ? categoryForm.name : '이름 없는 카테고리'
    const description = (categoryForm.description ?? '').trim()
    // 표식은 하나만 쓴다 — 이미지 모드면 이모지를, 아이콘 모드면 이미지를 비운다
    const mark = {
      emoji: categoryForm.useImage ? undefined : categoryForm.emoji,
      image: categoryForm.useImage ? categoryForm.image : undefined,
    }

    setCategories((prev) => {
      if (categoryId != null) {
        return prev.map((row) =>
          row.id === categoryId
            ? {
                ...row,
                ...mark,
                name,
                description: description !== '' ? description : undefined,
                active: categoryForm.active,
                updatedAt: TODAY,
                updatedBy: ME.name,
              }
            : row,
        )
      }

      const next: CategoryRow = {
        ...mark,
        id: `ct-${Date.now().toString(36)}`,
        order: prev.length + 1,
        name,
        description: description !== '' ? description : undefined,
        createdAt: TODAY,
        updatedAt: TODAY,
        createdBy: ME.name,
        updatedBy: ME.name,
        active: categoryForm.active,
      }
      return [...prev, next]
    })

    goMenu('category-list')
  }

  // ── 시공 문의 핸들러 ──
  const deleteManageRows = (ids: string[]) => {
    setManageRows((prev) => prev.filter((row) => !ids.includes(row.id)))
    if (manageId != null && ids.includes(manageId)) setManageId(null)
  }

  /**
   * 답변 저장 — 본문이 있으면 '답변완료'로 올리고 답변일·답변자를 남긴다.
   * 답변 카드를 끄고 저장하면 답변이 없는 문의가 된다 → '대기중'으로 되돌리고 메타를 지운다.
   */
  const clearManageError = (id: string) =>
    setManageErrors((prev) => {
      if (prev[id] == null) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })

  const saveManageAnswer = (row: InquiryManageRow) => {
    const enabled = manageAnswerOn[row.id] ?? true
    const content = (manageAnswers[row.id] ?? '').trim()

    if (!enabled) {
      clearManageError(row.id)
      setManageAnswered((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
      setManageRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, status: 'pending' } : item)),
      )
      return
    }

    // 빈 답변을 '답변완료'로 만들지 않는다 — 저장을 누른 순간에만 에러 문구가 뜬다
    if (content === '') {
      setManageErrors((prev) => ({ ...prev, [row.id]: '답변 내용을 입력해 주세요.' }))
      return
    }

    clearManageError(row.id)
    setManageAnswered((prev) => ({ ...prev, [row.id]: { at: TODAY, by: ME.name } }))
    setManageRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, status: 'answered' } : item)),
    )
  }

  // ── 대시보드 지표 ──
  const unanswered = inquiries.filter(
    (row) => row.status === 'received' || row.status === 'checking',
  ).length
  const lowStockRows = products.filter((row) => row.stock <= 10)
  const pendingApplications = applications.filter((row) => row.status === 'pending').length

  const stats: StatItem[] = [
    { label: '오늘 매출', value: '₩ 8,420,000', delta: 12.4, hint: '어제 대비' },
    { label: '신규 주문', value: '184건', delta: 5.1, hint: '어제 대비' },
    { label: '미답변 문의', value: `${unanswered}건`, delta: -2.0, hint: '접수 + 확인중' },
    { label: '품절 임박', value: `${lowStockRows.length}건`, hint: '재고 10개 이하' },
  ]

  // ── 대시보드 v2 데이터 — 할일/피드는 실제 목데이터 건수를 그대로 쓴다 ──
  const todoItems: TodoSummaryItem[] = [
    { key: 'new-order', label: '신규주문', count: orders.filter((row) => row.status === 'pending' || row.status === 'preparing').length, onClick: () => goMenu('orders') },
    { key: 'cancel', label: '취소관리', count: orders.filter((row) => row.status === 'cancelRequested').length, onClick: () => goMenu('orders') },
    { key: 'return', label: '반품관리', count: orders.filter((row) => row.status === 'returnRequested').length, onClick: () => goMenu('orders') },
    { key: 'inquiry', label: '미답변 문의', count: unanswered, onClick: () => goMenu('inquiry-list') },
    { key: 'application', label: '상담 신청 대기', count: pendingApplications, onClick: () => goMenu('inquiry-board') },
  ]

  const feeds: DashboardFeed[] = [
    {
      key: 'recent-orders',
      title: '최근 주문',
      count: orders.length,
      moreLabel: '더보기',
      onMore: () => goMenu('orders'),
      emptyText: '아직 들어온 주문이 없습니다',
      items: orders.slice(0, 5).map((row) => ({
        id: row.id,
        title: row.items[0]?.name ?? row.orderNo,
        author: row.buyer,
        date: row.orderedAt.slice(0, 10),
        thumbnail: row.items[0]?.image,
        onClick: () => goMenu('orders'),
      })),
    },
    {
      key: 'applications',
      title: '상담 신청',
      count: pendingApplications,
      moreLabel: '더보기',
      onMore: () => goMenu('inquiry-board'),
      emptyText: '접수된 상담 신청이 없습니다',
      items: applications.slice(0, 5).map((row) => ({
        id: row.id,
        title: row.title,
        author: row.applicant,
        date: row.appliedAt,
        kind: 'file' as const,
        onClick: () => openApplication(row.id),
      })),
    },
  ]

  // ── 헤더(타이틀 · breadcrumb) ──
  const trail: Trail = TRAIL[menu] ?? {
    crumbs: ['홈', '준비 중'],
    title: '준비 중',
    desc: '이 메뉴는 아직 구성되지 않았습니다.',
  }

  // 상세 화면은 무엇을 보고 있는지가 제목이다 — 목록 화면은 표의 제목을 그대로 쓴다
  let pageTitle = trail.title
  if (menu === 'inquiry-detail' && inquiry != null) pageTitle = `${inquiry.no} · 문의 상세`
  if (menu === 'product-detail' && product != null) pageTitle = product.name
  if (menu === 'product-new' && formMode === 'edit') pageTitle = '상품 수정'
  if (menu === 'customer-detail' && member != null) pageTitle = member.nickname
  if (menu === 'customer-page' && customer != null) pageTitle = customer.nickname
  if (menu === 'inquiry-application' && application != null) {
    pageTitle = `${application.applicant} · 문의 신청 상세`
  }
  if (menu === 'inquiry-manage-detail' && manageRow != null) {
    pageTitle = `${manageRow.applicant} · 시공 문의 상세`
  }
  // 등록/수정을 같은 폼이 맡는다 — 무엇을 하는 중인지가 제목이다
  if (menu === 'mainvisual-form') pageTitle = visualId != null ? '메인비주얼 수정' : '메인비주얼 등록'
  if (menu === 'category-form') pageTitle = categoryId != null ? '카테고리 수정' : '카테고리 등록'

  // 화면이 자체 헤더를 그리면(AdminPageLayout) 셸 토바는 내린다 — 제목이 두 번 쌓이지 않게
  const showTopbar = trail.self !== true

  const pageActions =
    menu === 'product-list' ? (
      <Button variant="primary" size="md" label="상품 등록" onClick={() => goMenu('product-new')} />
    ) : menu === 'inquiry-list' ? (
      <Button
        variant="secondary"
        appearance="outline"
        size="md"
        label="문의 설정"
        onClick={() => goMenu('inquiry-settings')}
      />
    ) : undefined

  return (
    <AdminShell
      brand="DS Admin"
      navItems={NAV_ITEMS}
      navValue={nav}
      onNavChange={setNav}
      sidebarSections={SIDEBAR_SECTIONS}
      sidebarValue={SIDEBAR_VALUE[menu] ?? menu}
      onSidebarChange={goMenu}
      contentPadding={false}
      breadcrumb={showTopbar ? trail.crumbs.map((label) => ({ label })) : undefined}
      pageTitle={showTopbar ? pageTitle : undefined}
      pageDescription={showTopbar ? trail.desc : undefined}
      user={ME}
      pageActions={showTopbar ? pageActions : undefined}
    >
      {/* ── 대시보드 ── */}
      {menu === 'dashboard' && (
        <PageContainer>
          <Statistics items={stats} columns={4} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 'var(--ds-spacing-5)',
            }}
          >
            <PageSection title="매출 · 방문자 추이">
              <AdminChart
                kind="bar"
                categories={MONTHS}
                series={[
                  { label: '매출(만원)', data: [820, 932, 901, 1290, 1330, 1520], tone: 'primary' },
                  { label: '방문자(백명)', data: [420, 532, 611, 690, 730, 810], tone: 'secondary' },
                ]}
              />
            </PageSection>
            <PageSection title="주문 비율">
              <AdminChart
                kind="donut"
                categories={['의류', '가방', '액세서리']}
                series={[{ label: '주문', data: [560, 320, 210] }]}
                centerLabel="총 주문"
              />
            </PageSection>
          </div>
          {/* 표는 10컬럼이라 최소 ~850px가 필요하다 → 반폭 컬럼에 넣으면 셀이 줄바꿈된다. 전폭 배치. */}
          <PageSection title="재고 부족 상품" description="재고 10개 이하 상품입니다.">
            {/* 상품 목록 = AdminTable + PRODUCT_COLUMNS 프리셋(컬럼 선언만 재사용, 표 구현은 하나) */}
            <AdminTable
              columns={PRODUCT_COLUMNS}
              rows={lowStockRows}
              rowKey={(row) => row.id}
              onEdit={(row) => openProduct(row.id)}
              emptyText={PRODUCT_EMPTY_TEXT}
            />
          </PageSection>
          <ActivityLog items={ACTIVITIES} compact onViewAll={() => goMenu('inquiry-list')} />
        </PageContainer>
      )}

      {/* ── 대시보드 v2 — 레퍼런스형(할일 · 피드 · 통계) ── */}
      {menu === 'dashboard-v2' && (
        <DashboardScreen
          title={trail.title}
          description={trail.desc}
          tabs={DASHBOARD_TABS}
          activeTab={dashboardTab}
          onTabChange={setDashboardTab}
          headerActions={
            <Button
              variant="secondary"
              appearance="outline"
              size="sm"
              label="새로고침"
              showLeftIcon
              leftIcon={<RotateCw size={14} />}
            />
          }
          todoItems={todoItems}
          feeds={feeds}
          chartTitle="방문자 · 페이지뷰 추이"
          chart={{ labels: DASHBOARD_CHART_LABELS, series: DASHBOARD_CHART_SERIES, height: 280 }}
          analytics={{
            columns: ANALYTICS_COLUMNS,
            rows: ANALYTICS_ROWS,
            summaries: ANALYTICS_SUMMARIES,
          }}
        />
      )}

      {/* ── 상품 목록 — 레퍼런스형(ProductListScreen) ── */}
      {menu === 'product-screen' && (
        <ProductListScreen
          rows={screenProducts}
          onRowOpen={editScreenProduct}
          onStatusChange={(row, next) => setScreenStatus([row.id], next)}
          onBulkStatus={(ids, next) => setScreenStatus(ids, next)}
          onRowCopy={copyScreenProduct}
          onRowDelete={(row) => deleteScreenProducts([row.id])}
          onBulkDelete={deleteScreenProducts}
          onBulkUpload={() => goMenu('product-edit')}
        />
      )}

      {/* ── 상품 등록/수정 — 레퍼런스형(ProductEditPage) ── */}
      {menu === 'product-edit' && (
        <ProductEditPage
          value={productEdit}
          onChange={setProductEdit}
          brands={PRODUCT_BRANDS}
          categories={PRODUCT_EDIT_CATEGORIES}
          status={toEditStatus(productEdit)}
          lastSavedLabel={productEditId != null ? '마지막 저장 3분 전' : undefined}
          onSave={saveProductEdit}
          onSaveDraft={saveProductEdit}
          onCancel={() => goMenu('product-screen')}
        />
      )}

      {/* ── 상품 목록 — ProductList 프리셋 ── */}
      {menu === 'product-list' && (
        <PageContainer maxWidth="full">
          <ProductList
            rows={products}
            categories={CATEGORY_NAMES}
            onRowOpen={(row) => openProduct(row.id)}
            onToggleActive={toggleProductActive}
            onBulkActive={bulkProductActive}
            onBulkCategory={bulkProductCategory}
            onBulkDelete={bulkProductDelete}
          />
        </PageContainer>
      )}

      {/* ── 상품 상세 ── */}
      {menu === 'product-detail' && product != null && (
        <PageContainer maxWidth="full">
          <ProductDetail
            value={toProductDetail(product, productVisible[product.id] ?? true, inquiries)}
            onBackToList={() => goMenu('product-list')}
            onEdit={() => editProduct(product)}
            onVisibleChange={(visible) =>
              setProductVisible((prev) => ({ ...prev, [product.id]: visible }))
            }
            onStatusChange={(status) => toggleProductActive(product.id, status === 'onSale')}
            onInquiryClick={(item) => openInquiry(item.id)}
            onDelete={() => {
              bulkProductDelete([product.id])
              goMenu('product-list')
            }}
            onSave={() => goMenu('product-list')}
          />
        </PageContainer>
      )}

      {/* ── 상품 등록/수정 — ProductForm 프리셋 ── */}
      {menu === 'product-new' && (
        <PageContainer>
          {/* 상세 페이지 뼈대 — 본문(폼) + 우측 요약 aside(sticky). 1920 규격: 콘텐츠 1600 = 본문 + aside 360. */}
          <DetailLayout
            aside={
              <PageSection title={formMode === 'edit' ? '수정 요약' : '등록 요약'}>
                <dl style={{ display: 'grid', gap: 'var(--ds-spacing-3)', margin: 0 }}>
                  {[
                    ['상품명', productForm.name !== '' ? productForm.name : '—'],
                    ['카테고리', productForm.category ?? '—'],
                    ['판매가', productForm.price !== '' ? `₩${Number(productForm.price).toLocaleString('ko-KR')}` : '—'],
                    ['재고', `${productForm.stock}개`],
                    ['옵션', `${productForm.options.length}개`],
                    ['이미지', `${productForm.images.length}장`],
                    ['판매 상태', productForm.onSale ? '판매중' : '판매중지'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--ds-spacing-3)', minWidth: 0 }}
                    >
                      <dt style={{ color: 'var(--ds-color-secondary)', fontSize: 'var(--ds-font-size-sm)', flexShrink: 0 }}>
                        {label}
                      </dt>
                      {/* 값이 길어도 카드를 밀지 않게 1줄 말줄임 */}
                      <dd
                        style={{
                          margin: 0,
                          minWidth: 0,
                          fontWeight: 600,
                          fontSize: 'var(--ds-font-size-sm)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={value}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </PageSection>
            }
          >
            <ProductForm
              value={productForm}
              onChange={setProductForm}
              categories={CATEGORY_OPTIONS}
              mode={formMode}
              onCancel={() => goMenu('product-list')}
              onSubmit={() => goMenu('product-list')}
            />
          </DetailLayout>
        </PageContainer>
      )}

      {/* ── 전시: 메인비주얼 관리(표 · 탭별) ── */}
      {menu === 'mainvisual-list' && (
        <MainVisualList
          title={trail.title}
          description={trail.desc}
          rows={visibleVisuals}
          tabs={visualTabs}
          tab={visualTab}
          onTabChange={setVisualTab}
          status={visualStatus}
          onStatusChange={setVisualStatus}
          keyword={visualKeyword}
          onKeywordChange={setVisualKeyword}
          sort={visualSort}
          onSortChange={setVisualSort}
          onCreate={() => goMenu('mainvisual-form')}
          onEdit={editVisual}
          onDelete={(row) => deleteVisuals([row.id])}
          onToggleActive={(row, next) => toggleVisualActive(row.id, next)}
          // 원본 순서를 보고 있을 때만 드래그 열을 켠다(걸러진 목록을 끌면 순번이 어긋난다)
          show={{ reorder: canReorderVisuals }}
          onReorder={replaceVisuals}
          onBulkDelete={deleteVisuals}
        />
      )}

      {/* ── 전시: 메인비주얼 수정 ── */}
      {menu === 'mainvisual-form' && (
        <MainVisualForm
          value={visualForm}
          onChange={setVisualForm}
          sections={MAIN_VISUAL_SECTIONS}
          onSave={saveVisual}
          onCancel={() => goMenu('mainvisual-list')}
        />
      )}

      {/* ── 전시: 메인비주얼 업로더(슬라이드 드래그 정렬) ── */}
      {menu === 'display-mainvisual' && (
        <PageContainer>
          <PageSection title="메인비주얼" description="노출 순서와 상태를 관리합니다.">
            <MainVisualUploader items={banners} onChange={setBanners} ratioHint="권장 1920×640" />
          </PageSection>
        </PageContainer>
      )}

      {/* ── 회사관리: 회사소개(사이트 AboutPage의 원본 데이터를 편집한다) ── */}
      {menu === 'company-form' && (
        <CompanyForm
          value={company}
          onChange={setCompany}
          mode="edit"
          title={trail.title}
          description={trail.desc}
          onSubmit={() => goMenu('dashboard')}
          onCancel={() => goMenu('dashboard')}
        />
      )}

      {/* ── 회사관리: 연혁(사이트 HistoryPage의 연대 칸이 이 줄들을 연도로 묶는다) ── */}
      {menu === 'history-list' && (
        <HistoryList
          rows={historyRows}
          title={trail.title}
          description={trail.desc}
          onCreate={() => undefined}
          onDelete={(ids) =>
            setHistoryRows((prev) => prev.filter((row) => !ids.includes(row.id)))
          }
          onToggleVisible={(row, next) =>
            setHistoryRows((prev) =>
              prev.map((item) => (item.id === row.id ? { ...item, visible: next } : item)),
            )
          }
        />
      )}

      {/* ── 전시: 포트폴리오 관리 ── */}
      {menu === 'portfolio-list' && (
        <PortfolioList
          rows={portfolios}
          categories={PORTFOLIO_CATEGORIES}
          title={trail.title}
          description={trail.desc}
          onCreate={() => goMenu('portfolio-form')}
          onEdit={editPortfolio}
          onDelete={(row) => setPortfolios((prev) => prev.filter((item) => item.id !== row.id))}
          onToggleActive={(row, next) =>
            setPortfolios((prev) =>
              prev.map((item) => (item.id === row.id ? { ...item, active: next } : item)),
            )
          }
          // 표가 재정렬된 rows 전체를 그대로 돌려준다 — 저장 순서(=순번)를 갈아끼우면 끝
          onReorder={setPortfolios}
        />
      )}

      {/* ── 전시: 포트폴리오 등록/수정 ── */}
      {menu === 'portfolio-form' && (
        <PortfolioForm
          value={portfolioForm}
          onChange={setPortfolioForm}
          categories={PORTFOLIO_CATEGORY_OPTIONS}
          mode={portfolioId != null ? 'edit' : 'create'}
          onCancel={() => goMenu('portfolio-list')}
          onSubmit={savePortfolio}
        />
      )}

      {/* ── 주문 ── */}
      {menu === 'orders' && (
        <OrderList
          rows={visibleOrders}
          tabs={orderTabs}
          activeTab={orderTab}
          onTabChange={setOrderTab}
          keyword={orderKeyword}
          onKeywordChange={setOrderKeyword}
          onSearch={setOrderQuery}
          carriers={CARRIERS}
          onCarrierChange={(row, carrier) => patchShipping(row, { carrier })}
          onTrackingNoChange={(row, trackingNo) => patchShipping(row, { trackingNo })}
        />
      )}

      {/* ── 시공 문의 내역 — 탭·검색·정렬·페이지는 InquiryManageList가 내부에서 굴린다 ── */}
      {menu === 'inquiry-manage' && (
        <InquiryManageList
          rows={manageRows}
          title={trail.title}
          description={trail.desc}
          onView={(row) => openManageInquiry(row.id)}
          onDelete={(row) => deleteManageRows([row.id])}
          onBulkDelete={deleteManageRows}
        />
      )}

      {/* ── 시공 문의 상세 — 눈 아이콘으로 들어온다 ── */}
      {menu === 'inquiry-manage-detail' && manageRow != null && (
        <InquiryManageDetail
          title={pageTitle}
          description={`시공 문의 #${manageRow.no} · 신청일 ${manageRow.appliedAt}`}
          status={{
            label: MANAGE_STATUS_LABEL[manageRow.status],
            tone: MANAGE_STATUS_TONE[manageRow.status],
          }}
          applicant={{
            name: manageRow.applicant,
            phone: manageRow.phone,
            email: manageRow.email,
            consents: [
              { key: 'privacy', label: '개인정보', agreed: true },
              { key: 'marketing', label: '마케팅 수신', agreed: manageRow.no % 2 === 0 },
            ],
            createdAt: manageRow.appliedAt,
            updatedAt: manageAnswered[manageRow.id]?.at,
            updatedBy: manageAnswered[manageRow.id]?.by,
          }}
          qa={manageQaOf(manageRow)}
          answer={manageAnswers[manageRow.id] ?? ''}
          onAnswerChange={(value) => {
            setManageAnswers((prev) => ({ ...prev, [manageRow.id]: value }))
            clearManageError(manageRow.id)
          }}
          answerError={manageErrors[manageRow.id]}
          answerEnabled={manageAnswerOn[manageRow.id] ?? true}
          onAnswerEnabledChange={(value) =>
            setManageAnswerOn((prev) => ({ ...prev, [manageRow.id]: value }))
          }
          answeredAt={manageAnswered[manageRow.id]?.at}
          answeredBy={manageAnswered[manageRow.id]?.by}
          onSave={() => saveManageAnswer(manageRow)}
          onList={() => goMenu('inquiry-manage')}
          onDelete={() => {
            deleteManageRows([manageRow.id])
            goMenu('inquiry-manage')
          }}
        />
      )}

      {/* ── 문의 내역 — 상담 신청(InquiryBoard) ── */}
      {menu === 'inquiry-board' && (
        <InquiryBoard
          rows={visibleApplications}
          title={trail.title}
          description={trail.desc}
          categories={APPLICATION_CATEGORY_OPTIONS}
          onSearch={setApplicationQuery}
          onOpen={(row) => openApplication(row.id)}
          onStatusChange={(row, status) => patchApplication([row.id], status)}
          onDelete={(row) => deleteApplications([row.id])}
          onBulkStatus={patchApplication}
          onBulkDelete={deleteApplications}
        />
      )}

      {/* ── 문의 신청 상세 ── */}
      {menu === 'inquiry-application' && application != null && (
        <InquiryApplicationDetail
          title={pageTitle}
          description={`${application.category} · 신청일 ${application.appliedAt}`}
          applicant={{
            name: application.applicant,
            phone: application.phone,
            email: application.email,
            consents: [
              { key: 'privacy', label: '개인정보 수집·이용', agreed: true },
              { key: 'marketing', label: '마케팅 정보 수신', agreed: application.status !== 'pending' },
            ],
            createdAt: application.appliedAt,
            updatedAt: application.updatedAt,
            updatedBy: application.updatedAt != null ? (applicationAssignees[application.id] ?? 'CS팀') : undefined,
          }}
          answers={applicationAnswersOf(application)}
          statusSteps={applicationStepsOf(application, applicationAssignees[application.id] ?? null)}
          // Select는 초안만 바꾸고, 하단 [상태 변경]을 눌러야 목록에 반영된다
          status={applicationDraft[application.id] ?? application.status}
          statusOptions={APPLICATION_STATUS_OPTIONS}
          onStatusChange={(value) =>
            setApplicationDraft((prev) => ({
              ...prev,
              [application.id]: value as InquiryApplicationStatus,
            }))
          }
          onStatusApply={() => {
            const next = applicationDraft[application.id]
            if (next != null) patchApplication([application.id], next)
          }}
          assignee={applicationAssignees[application.id] ?? null}
          assigneeOptions={ASSIGNEES}
          onAssigneeChange={(value) =>
            setApplicationAssignees((prev) => ({ ...prev, [application.id]: value }))
          }
          memo={applicationMemos[application.id] ?? ''}
          onMemoChange={(value) =>
            setApplicationMemos((prev) => ({ ...prev, [application.id]: value }))
          }
          onMemoSave={() => {}}
          onList={() => goMenu('inquiry-board')}
          onDelete={() => {
            deleteApplications([application.id])
            goMenu('inquiry-board')
          }}
          hasPrev={applicationIndex > 0}
          hasNext={applicationIndex >= 0 && applicationIndex < visibleApplications.length - 1}
          onPrev={() => openApplication(visibleApplications[applicationIndex - 1].id)}
          onNext={() => openApplication(visibleApplications[applicationIndex + 1].id)}
        />
      )}

      {/* ── 문의 목록 — InquiryList 프리셋 ── */}
      {menu === 'inquiry-list' && (
        <PageContainer maxWidth="full">
          <InquiryList
            rows={inquiries}
            assignees={ASSIGNEES}
            onRowOpen={(row) => openInquiry(row.id)}
            onBulkAnswered={(ids) => patchInquiry(ids, { status: 'answered', answeredAt: TODAY })}
            onBulkAssign={(ids, assignee) => patchInquiry(ids, { assignee })}
            onBulkStatus={(ids, status) => patchInquiry(ids, { status })}
            onBulkDelete={(ids) =>
              setInquiries((prev) => prev.filter((row) => !ids.includes(row.id)))
            }
          />
        </PageContainer>
      )}

      {/* ── 문의 상세 — InquiryDetail(내부 AnswerForm) + AnswerHistory ── */}
      {menu === 'inquiry-detail' && inquiry != null && (
        <PageContainer maxWidth="full">
          <InquiryDetail
            header={{
              no: inquiry.no,
              status: TO_DETAIL_STATUS[inquiry.status],
              type: inquiry.type,
              createdAt: inquiry.createdAt,
              updatedAt: inquiry.answeredAt,
              assignee: inquiry.assignee,
              isPublic: inquiry.isPublic,
            }}
            author={{
              name: inquiry.author,
              memberId: `user_${inquiry.no.toLowerCase()}`,
              email: `${inquiry.id}@example.com`,
              phone: '010-1234-5678',
              grade: inquiry.memberGrade ?? '일반',
              recentOrder:
                inquiry.orderNo != null
                  ? { no: inquiry.orderNo, summary: `${inquiry.orderNo} · ${inquiry.productName ?? '주문 상품'}` }
                  : undefined,
            }}
            content={{
              title: inquiry.title,
              body: bodyOf(inquiry),
              attachments: attachmentsOf(inquiry),
            }}
            order={orderOf(inquiry)}
            products={productsOf(inquiry)}
            memos={memos[inquiry.id] ?? []}
            answer={answers[inquiry.id]}
            statusHistory={statusHistoryOf(inquiry)}
            history={historyOf(inquiry)}
            assignees={ASSIGNEES}
            answerTemplates={ANSWER_TEMPLATES}
            onStatusChange={(status) => patchInquiry([inquiry.id], { status: TO_LIST_STATUS[status] })}
            onAssigneeChange={(assignee) => patchInquiry([inquiry.id], { assignee })}
            onAnswerSubmit={(draft, meta) => submitAnswer(inquiry, draft, meta)}
            onAnswerDelete={() => {
              setAnswers((prev) => {
                const next = { ...prev }
                delete next[inquiry.id]
                return next
              })
              patchInquiry([inquiry.id], { status: 'checking', answeredAt: undefined })
            }}
            onMemoCreate={(content) => addMemo(inquiry.id, content)}
            onMemoUpdate={(memoId, content) => updateMemo(inquiry.id, memoId, content)}
            onMemoDelete={(memoId) => deleteMemo(inquiry.id, memoId)}
            onProductClick={(item) => openProduct(item.id)}
            onBackToList={() => goMenu('inquiry-list')}
            onDelete={() => {
              setInquiries((prev) => prev.filter((row) => row.id !== inquiry.id))
              goMenu('inquiry-list')
            }}
            onPrev={() => openInquiry(inquiries[inquiryIndex - 1].id)}
            onNext={() => openInquiry(inquiries[inquiryIndex + 1].id)}
            hasPrev={inquiryIndex > 0}
            hasNext={inquiryIndex >= 0 && inquiryIndex < inquiries.length - 1}
          />

          {/* 답변 이력 — 버전별 내용 보기/복원 */}
          <PageSection title="답변 이력" description="답변을 수정할 때마다 버전이 쌓입니다.">
            <AnswerHistory
              versions={versions[inquiry.id] ?? []}
              onRestore={(version) => restoreAnswer(inquiry, version)}
            />
          </PageSection>
        </PageContainer>
      )}

      {/* ── 문의 설정 ── */}
      {menu === 'inquiry-settings' && (
        <InquirySettings
          types={settingTypes}
          onTypesChange={setSettingTypes}
          automation={automation}
          onAutomationChange={setAutomation}
          notification={notification}
          onNotificationChange={setNotification}
          statuses={statuses}
          onStatusesChange={setStatuses}
          templates={templates}
          onTemplatesChange={setTemplates}
        />
      )}

      {/* ── 회원: 고객 목록(유형 탭 · 검색 · 메모) ── */}
      {menu === 'customer-list' && (
        <CustomerList
          rows={customers}
          title={trail.title}
          description={trail.desc}
          onOpen={(row) => openCustomerPage(row.id)}
          onMemoChange={(row, memo) => patchCustomer(row.id, { memo })}
          // 필터 패널이 없는 화면이다 — 눌러도 열 것이 없는 버튼은 아예 만들지 않는다
          show={{ filter: false }}
        />
      )}

      {/* ── 회원: 고객 상세 — 닉네임을 눌러 들어온다 ── */}
      {/* header='bar' — 제목 옆에 회원 유형 배지가 붙는 헤더(예전 'Page' 화면의 헤더)를 고른다 */}
      {menu === 'customer-page' && customer != null && (
        <CustomerDetail
          header="bar"
          title={pageTitle}
          description={trail.desc}
          profile={toCustomerPageProfile(customer)}
          activity={toCustomerPageActivity(customer)}
          consents={customerConsentsOf(customer)}
          memo={customer.memo ?? ''}
          onMemoChange={(value) => patchCustomer(customer.id, { memo: value })}
          onMemoSave={() => {}}
          blocked={customerBlocked[customer.id] === true}
          onBackToList={() => goMenu('customer-list')}
          // 이 데모에는 고객 수정 화면이 없다 — [수정]은 목록으로 돌려보낸다(아래 회원 상세와 같은 규칙)
          onEdit={() => goMenu('customer-list')}
          onBlock={(next) => blockCustomer(customer.id, next)}
          onDelete={() => {
            deleteCustomer(customer.id)
            goMenu('customer-list')
          }}
        />
      )}

      {/* ── 회원: 고객 목록(그룹 패널) ── */}
      {menu === 'member-list' && (
        <MemberList
          rows={visibleMembers}
          title={trail.title}
          description={trail.desc}
          groups={memberGroups}
          groupValue={memberGroup}
          onGroupChange={setMemberGroup}
          keyword={memberKeyword}
          onKeywordChange={setMemberKeyword}
          now={NOW_ISO}
          onOpen={(row) => openCustomer(row.id)}
          onGivePoints={(ids) =>
            setMembers((prev) =>
              prev.map((row) => (ids.includes(row.id) ? { ...row, points: row.points + 1000 } : row)),
            )
          }
          onBlock={(row) => blockMember(row.id, blocked[row.id] !== true)}
          onDelete={deleteMembers}
          onMemoChange={(row, memo) => patchMember([row.id], { memo })}
        />
      )}

      {/* ── 회원: 고객 상세 ── */}
      {menu === 'customer-detail' && member != null && (
        <CustomerDetail
          title={pageTitle}
          description={trail.desc}
          profile={toCustomerProfile(member)}
          activity={toCustomerActivity(member)}
          consents={consentsOf(member)}
          memo={member.memo ?? ''}
          onMemoChange={(value) => patchMember([member.id], { memo: value })}
          onMemoSave={() => {}}
          blocked={blocked[member.id] === true}
          onBackToList={() => goMenu('member-list')}
          onEdit={() => goMenu('member-list')}
          onBlock={(next) => blockMember(member.id, next)}
          onDelete={() => {
            deleteMembers([member.id])
            goMenu('member-list')
          }}
        />
      )}

      {/* ── 회원: 운영진 ── */}
      {menu === 'staff-list' && (
        <StaffList
          rows={staff}
          groups={STAFF_GROUPS}
          title={trail.title}
          description={trail.desc}
          onMemoChange={(row, memo) =>
            setStaff((prev) => prev.map((item) => (item.id === row.id ? { ...item, memo } : item)))
          }
          rowMenu={(row): AdminRowMenuItem[] => [
            {
              key: 'group',
              label: '그룹 변경',
              icon: <UserCog size={14} />,
              onSelect: () =>
                setStaff((prev) =>
                  prev.map((item) =>
                    item.id === row.id
                      ? { ...item, group: item.group === '최고 관리자' ? '상품·주문 운영' : '최고 관리자' }
                      : item,
                  ),
                ),
            },
            {
              key: 'remove',
              label: '운영진 해제',
              icon: <Trash2 size={14} />,
              tone: 'error',
              divider: true,
              onSelect: () => setStaff((prev) => prev.filter((item) => item.id !== row.id)),
            },
          ]}
          onBulkDelete={(ids) => setStaff((prev) => prev.filter((row) => !ids.includes(row.id)))}
        />
      )}

      {/* ── 게시판: 공지사항 ── */}
      {menu === 'notice-board' && (
        <NoticeBoard
          rows={visibleNotices}
          onSearch={setNoticeQuery}
          categories={[
            { label: '공지', value: '공지' },
            { label: '이벤트', value: '이벤트' },
            { label: '점검', value: '점검' },
            { label: '업데이트', value: '업데이트' },
            { label: '안내', value: '안내' },
          ]}
          onDelete={(ids) => setNotices((prev) => prev.filter((row) => !ids.includes(row.id)))}
          onToggleVisible={(row, next) =>
            patchNotices([row.id], (item) => ({ ...item, status: next ? 'visible' : 'hidden' }))
          }
          onTogglePin={(row, next) => patchNotices([row.id], (item) => ({ ...item, pinned: next }))}
          onBulkVisibility={(ids, visible) =>
            patchNotices(ids, (item) => ({ ...item, status: visible ? 'visible' : 'hidden' }))
          }
          onBulkPin={(ids, pinned) => patchNotices(ids, (item) => ({ ...item, pinned }))}
        />
      )}

      {/* ── 설정: 카테고리 관리 — 필터·정렬·페이징은 CategoryList가 내부에서 굴린다 ── */}
      {menu === 'category-list' && (
        <CategoryList
          rows={categories}
          title={trail.title}
          description={trail.desc}
          onAdd={() => goMenu('category-form')}
          onEdit={editCategory}
          onDelete={(row) => deleteCategories([row.id])}
          onToggleActive={(row, next) =>
            setCategories((prev) =>
              prev.map((item) => (item.id === row.id ? { ...item, active: next } : item)),
            )
          }
          // 표가 순번을 다시 매긴 rows 전체를 돌려준다 — 그대로 갈아끼우면 끝
          onReorder={setCategories}
          onBulkDelete={deleteCategories}
        />
      )}

      {/* ── 설정: 카테고리 등록/수정 ── */}
      {menu === 'category-form' && (
        <CategoryForm
          value={categoryForm}
          onChange={setCategoryForm}
          brands={CATEGORY_BRANDS}
          title={pageTitle}
          description={trail.desc}
          submitLabel={categoryId != null ? '수정' : '등록'}
          onSubmit={saveCategory}
          onCancel={() => goMenu('category-list')}
        />
      )}
    </AdminShell>
  )
}
