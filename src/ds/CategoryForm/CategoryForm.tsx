import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  AdminFormImageField,
  AdminFormPage,
  type AdminFormField,
} from '../AdminFormPage/AdminFormPage'
import { Toggle } from '../Toggle/Toggle'
import type { SelectOption } from '../Select/Select'
import { mergeLabels, type DeepPartialOneLevel } from '../../shared/labels'
import styles from './CategoryForm.module.css'

/** 카테고리 한 건의 값 — 화면이 들고 있는 유일한 상태 */
export type CategoryValue = {
  /** 이 카테고리를 등록하는 브랜드 — brands 옵션의 value와 맞아야 한다 */
  brand?: string
  name: string
  /** true면 이미지 업로드, false면 아이콘(이모지) 선택으로 대체된다 */
  useImage: boolean
  /** 업로드된 이미지 URL(data URL) — 없으면 드롭존이 뜬다 */
  image?: string
  /** useImage=false일 때 고르는 아이콘 */
  emoji?: string
  description?: string
  active: boolean
}

/** 필드별 에러 문구 — 있는 키만 해당 FieldRow가 에러 톤이 된다 */
export type CategoryFormErrors = {
  brand?: string
  name?: string
  image?: string
  description?: string
}

/**
 * 섹션·필드 단위 ON/OFF. 기본값은 전부 true이며,
 * false면 해당 영역이 DOM에서 완전히 사라진다(빈 자리·여백·구분선을 남기지 않는다).
 */
export type CategoryFormShow = {
  /** 페이지 헤더(타이틀·설명·저장) */
  header?: boolean
  /** '카테고리 정보' 섹션 카드 전체 */
  info?: boolean
  /** 브랜드 */
  brand?: boolean
  /** 카테고리명 */
  name?: boolean
  /** 카테고리 이미지 / 아이콘 */
  image?: boolean
  /** 설명 */
  description?: boolean
  /** 활성화 */
  active?: boolean
  /** 하단 [취소] [저장] 바 */
  footer?: boolean
}

/**
 * 화면에 나오는 모든 글자 — 값(value)과 아이콘 후보(emojiOptions)만 데이터다.
 * 중첩은 표면 기준 1단계다(sections / fields / placeholders / helpers / image / actions).
 */
export type CategoryFormLabels = {
  /** 페이지 헤더 — 등록/수정 화면이 같은 컴포넌트를 쓴다 */
  title: string
  /** 헤더 설명 — 기본값 없음(넘기지 않으면 설명 줄이 없다) */
  description?: string
  /** 섹션 카드 제목 */
  sections: { info: string }
  /** 섹션 카드 설명 */
  sectionDescriptions: { info: string }
  /** 필드 라벨 */
  fields: { brand: string; name: string; image: string; description: string; active: string }
  /** 필드 플레이스홀더 */
  placeholders: { brand: string; name: string; description: string }
  /** 필드 보조설명(FieldRow 설명 줄) */
  helpers: { image: string; active: string }
  /** 이미지·아이콘 블록 */
  image: {
    /** 업로드/아이콘을 맞바꾸는 스위치 라벨 */
    useImage: string
    /** 스위치 ON/OFF 표기 — Toggle의 label이 곧 접근성 이름이다 */
    on: string
    off: string
    /** 업로드 제약 안내 */
    hint: string
    /** 썸네일 옆 삭제 버튼 */
    removeLabel: string
    /** 아이콘 선택(radiogroup)의 접근성 이름 */
    emojiGroup: string
  }
  /** 액션 버튼 */
  actions: { submit: string; cancel: string; saving: string }
}

export type CategoryFormProps = {
  value: CategoryValue
  onChange: (v: CategoryValue) => void
  /** 문구 — 개별 prop(title·submitLabel·imageHint …)이 있으면 그쪽이 이긴다 */
  labels?: DeepPartialOneLevel<CategoryFormLabels>
  /** @deprecated labels.title을 쓴다(개별 prop이 우선한다) */
  title?: string
  /** @deprecated labels.description을 쓴다 */
  description?: string
  /**
   * 브랜드 Select 옵션 — 생략하면 빈 목록(화면이 채워야 실제로 고를 수 있다).
   * value는 CategoryValue.brand와 맞아야 한다.
   */
  brands?: SelectOption[]
  /** 아이콘 선택 후보 — 생략하면 내부 기본 목록 */
  emojiOptions?: string[]
  errors?: CategoryFormErrors
  onSubmit?: () => void
  onCancel?: () => void
  submitting?: boolean
  /** @deprecated labels.actions.submit을 쓴다 */
  submitLabel?: string
  /** @deprecated labels.actions.cancel을 쓴다 */
  cancelLabel?: string
  show?: CategoryFormShow
  /** 목록 밀도 — 페이지 리듬을 다른 폼(PortfolioForm·CompanyForm)과 맞춘다 */
  density?: 'compact' | 'comfortable'
  maxWidth?: 'md' | 'lg' | 'full'

  /**
   * 업로드된 이미지의 미리보기 블록(썸네일 + 안내 + 삭제 버튼). 기본 true.
   * 끄면 이미지가 이미 있어도 드롭존(교체 UI)만 남는다 — 목록에서 이미 썸네일을 보여 주는 화면이나,
   * 폼이 좁아 160×160 미리보기가 들어가지 않을 때를 위한 스위치다. 값(value.image)은 유지된다.
   */
  showPreview?: boolean

  /* ── 아이콘 슬롯 — 없으면 기존 lucide 기본 아이콘 ── */
  /** 미리보기 옆 '이미지 삭제' 버튼 아이콘 */
  removeImageIcon?: ReactNode

  /* ── 문구 (없으면 기존 기본 문구 그대로) ── */
  /** @deprecated labels.image.removeLabel을 쓴다 */
  removeImageLabel?: string
  /** @deprecated labels.image.hint를 쓴다 */
  imageHint?: string
  /** @deprecated labels.actions.saving을 쓴다 */
  savingLabel?: string
}

/** 기본 아이콘 후보 — 쇼핑몰/시공 카테고리에서 실제로 쓰이는 결 */
const DEFAULT_EMOJIS = ['🛋️', '🏠', '🍽️', '🛏️', '🚿', '💡', '🪴', '🧺', '🎨', '🔧', '📦', '⭐'] as const

export const DEFAULT_CATEGORY_FORM_LABELS: CategoryFormLabels = {
  title: '카테고리 등록',
  sections: { info: '카테고리 정보' },
  sectionDescriptions: {
    info: '목록과 상단 메뉴에 노출되는 카테고리의 기본 정보입니다.',
  },
  fields: {
    brand: '브랜드',
    name: '카테고리명',
    image: '카테고리 이미지',
    description: '설명',
    active: '활성화',
  },
  placeholders: {
    brand: '브랜드를 선택하세요',
    name: '예: 거실 인테리어',
    description: '카테고리를 설명하는 문구를 입력하세요.',
  },
  helpers: {
    image: '이미지를 쓰지 않으면 아이콘으로 대신 표시됩니다.',
    active: '끄면 목록과 메뉴에서 이 카테고리가 노출되지 않습니다.',
  },
  image: {
    useImage: '이미지 사용',
    on: 'ON',
    off: 'OFF',
    // 레퍼런스의 이미지 영역 하단 문구
    hint: '권장 640×640 · JPG/PNG · 2MB 이하',
    removeLabel: '이미지 삭제',
    emojiGroup: '카테고리 아이콘',
  },
  actions: { submit: '저장', cancel: '취소', saving: '저장 중…' },
}

/** 업로드 제약 — 안내 문구(labels.image.hint)와 DropZone 검증이 같은 상한을 본다 */
const MAX_IMAGE_MB = 2

const DEFAULT_SHOW: Required<CategoryFormShow> = {
  header: true,
  info: true,
  brand: true,
  name: true,
  image: true,
  description: true,
  active: true,
  footer: true,
}

/** 아이콘(이모지) 선택 — 단일 선택이라 radiogroup 의미를 준다(roving tabindex) */
function EmojiPicker({
  options,
  selected,
  onSelect,
  groupLabel,
}: {
  options: string[]
  selected?: string
  onSelect: (emoji: string) => void
  /** radiogroup의 접근성 이름 */
  groupLabel: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  // 선택이 없으면 첫 칸이 탭 진입점이 된다
  const selectedIndex = selected == null ? -1 : options.indexOf(selected)
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length
    onSelect(options[next])
    refs.current[next]?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      move(index, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(index, -1)
    }
  }

  return (
    <div className={styles.emojiGrid} role="radiogroup" aria-label={groupLabel}>
      {options.map((emoji, index) => {
        const on = emoji === selected
        return (
          <button
            key={emoji}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={index === activeIndex ? 0 : -1}
            className={[styles.emojiItem, on ? styles.emojiItemOn : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(emoji)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}

/**
 * CategoryForm — 카테고리 등록/수정 화면.
 *
 * 화면 골격(AdminPageLayout · PageHeaderBar · FormSection · FieldRow · sticky 액션 바)과
 * 이미지 업로드/썸네일/삭제는 AdminFormPage 셸이 갖는다.
 * 이 파일에 남는 것은 이 화면만의 것 세 가지뿐이다 —
 *   1) 값 타입    : CategoryValue / CategoryFormErrors
 *   2) 필드 선언  : 브랜드 · 카테고리명 · 이미지(또는 아이콘) · 설명 · 활성화
 *   3) 한국어 문구: 타이틀 · 섹션 제목 · 플레이스홀더 · 업로드 안내
 *
 * 두 종류의 ON/OFF가 있다(섞이지 않는다).
 *  1) show — 화면 구성. false면 그 필드가 스키마에서 빠진다. 필드가 전부 꺼지면 셸이 섹션 카드도 지운다.
 *  2) value.useImage — 데이터. 이미지 업로드 영역과 아이콘(이모지) 선택을 **맞바꾼다**(빈 자리 없음).
 */
export function CategoryForm({
  value,
  onChange,
  labels,
  title,
  description,
  brands = [],
  emojiOptions = [...DEFAULT_EMOJIS],
  errors,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
  cancelLabel,
  show,
  density = 'compact',
  maxWidth = 'lg',
  showPreview = true,
  removeImageIcon,
  removeImageLabel,
  imageHint,
  savingLabel,
}: CategoryFormProps) {
  // 우선순위: 개별 prop > labels > 기본값. mergeLabels는 undefined를 무시하므로
  // 넘기지 않은 개별 prop이 기본 문구를 지우지 않는다.
  const L = mergeLabels(mergeLabels(DEFAULT_CATEGORY_FORM_LABELS, labels), {
    title,
    description,
    image: { hint: imageHint, removeLabel: removeImageLabel },
    actions: { submit: submitLabel, cancel: cancelLabel, saving: savingLabel },
  })

  const s = { ...DEFAULT_SHOW, ...show }

  const fields: AdminFormField<CategoryValue>[] = []

  if (s.brand) {
    fields.push({
      kind: 'select',
      key: 'brand',
      label: L.fields.brand,
      required: true,
      span: 2,
      options: brands,
      placeholder: L.placeholders.brand,
    })
  }

  if (s.name) {
    fields.push({
      kind: 'text',
      key: 'name',
      label: L.fields.name,
      required: true,
      span: 2,
      placeholder: L.placeholders.name,
      maxLength: 30,
    })
  }

  if (s.image) {
    fields.push({
      kind: 'custom',
      key: 'image',
      label: L.fields.image,
      description: L.helpers.image,
      /*
       * 셸의 image 필드를 그대로 쓰되, 그 위에 '이미지 사용' 스위치를 얹는다 —
       * 스위치가 OFF면 업로드 영역이 통째로 사라지고 아이콘(이모지) 선택이 그 자리를 채운다.
       * 이 '맞바꿈'은 이 화면만의 규약이라 셸에 넣지 않고 여기 남긴다.
       */
      render: ({ value: v, patch }) => (
        <div className={styles.imageField}>
          <div
            className={[styles.switchRow, v.useImage ? styles.switchOn : styles.switchOff].join(' ')}
          >
            <span className={styles.switchLabel}>{L.image.useImage}</span>
            <Toggle
              checked={v.useImage}
              onChange={(useImage) => patch({ useImage })}
              size="sm"
              label={v.useImage ? L.image.on : L.image.off}
            />
          </div>

          {v.useImage ? (
            <AdminFormImageField
              value={v.image}
              onChange={(image) => patch({ image })}
              showPreview={showPreview}
              ratio="1x1"
              previewWidth={160}
              remove="side"
              removeLabel={L.image.removeLabel}
              removeIcon={removeImageIcon}
              previewHint={L.image.hint}
              hint={L.image.hint}
              accept="image/*"
              maxSizeMb={MAX_IMAGE_MB}
            />
          ) : (
            <EmojiPicker
              options={emojiOptions}
              selected={v.emoji}
              onSelect={(emoji) => patch({ emoji })}
              groupLabel={L.image.emojiGroup}
            />
          )}
        </div>
      ),
    })
  }

  if (s.description) {
    fields.push({
      kind: 'textarea',
      key: 'description',
      label: L.fields.description,
      placeholder: L.placeholders.description,
      rows: 4,
      maxLength: 200,
      showCounter: true,
    })
  }

  if (s.active) {
    fields.push({
      kind: 'toggle',
      key: 'active',
      label: L.fields.active,
      description: L.helpers.active,
    })
  }

  return (
    <AdminFormPage<CategoryValue>
      value={value}
      onChange={onChange}
      errors={errors}
      sections={[
        {
          key: 'info',
          title: L.sections.info,
          description: L.sectionDescriptions.info,
          // show.info=false면 필드를 넘기지 않는다 — 셸이 빈 카드를 그리지 않는다
          fields: s.info ? fields : [],
        },
      ]}
      title={L.title}
      description={L.description}
      submitLabel={L.actions.submit}
      submittingLabel={L.actions.saving}
      cancelLabel={L.actions.cancel}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={onCancel}
      density={density}
      maxWidth={maxWidth}
      // 하단 [취소]는 핸들러가 있을 때만 — [저장]은 항상 자리를 지킨다(기존 화면 규약)
      show={{ header: s.header, footer: s.footer, footerCancel: onCancel != null }}
    />
  )
}
