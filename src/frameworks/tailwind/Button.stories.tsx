import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Color = 'blue' | 'gray' | 'green' | 'red' | 'yellow'
type Size = 'sm' | 'md' | 'lg'

type Args = {
  label: string
  color: Color
  size: Size
  disabled: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-lg font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

const COLOR_CLASSES: Record<Color, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus-visible:ring-blue-500',
  gray: 'bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white focus-visible:ring-gray-500',
  green: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus-visible:ring-green-500',
  red: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus-visible:ring-red-500',
  yellow: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-gray-900 focus-visible:ring-yellow-400',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const DISABLED_CLASSES = 'opacity-50 cursor-not-allowed'

// 갤러리: 참조 시안의 파란 프라이머리(#3D6BFF 계열) — 클래스는 전부 완전한 리터럴 문자열
const PRIMARY_BTN =
  'bg-[#3D6BFF] hover:bg-[#2F5BF0] active:bg-[#2450DB] text-white focus-visible:ring-[#3D6BFF]'
const SOFT_BTN =
  'bg-[#EDF2FF] text-[#3D6BFF] hover:bg-[#DFE8FF] shadow-none focus-visible:ring-[#3D6BFF]'
const TEXT_BTN = 'text-[#3D6BFF] hover:bg-[#EDF2FF] shadow-none focus-visible:ring-[#3D6BFF]'

// 참조 시안의 상태 열: 기본 / 호버 / 클릭 / 비활성 (정적 표현)
const STATE_ROW: [string, string][] = [
  ['Default', 'bg-[#3D6BFF] text-white'],
  ['Hover', 'bg-[#2F5BF0] text-white'],
  ['Active', 'bg-[#2450DB] text-white'],
  ['Disabled', 'bg-[#AFC4FF] text-white cursor-not-allowed'],
]

const SIZE_ROW: [string, string][] = [
  ['Small', 'px-3 py-1.5 text-sm'],
  ['Medium', 'px-4 py-2 text-sm'],
  ['Large', 'px-5 py-2.5 text-base'],
]

const meta = {
  title: 'Frameworks/Tailwind/Button',
  args: { label: 'Publish', color: 'blue', size: 'md', disabled: false },
  argTypes: {
    color: { control: 'select', options: ['blue', 'gray', 'green', 'red', 'yellow'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => {
    const className = [
      BASE_CLASSES,
      COLOR_CLASSES[args.color],
      SIZE_CLASSES[args.size],
      args.disabled ? DISABLED_CLASSES : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <FrameworkScope styles={[css]}>
        <div className="w-96 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Publish changes</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Your edits will go live immediately. You can roll back to a previous version at any
            time.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button type="button" className={className} disabled={args.disabled}>
              {args.label}
            </button>
          </div>
        </div>
      </FrameworkScope>
    )
  },
}

// 참조 디자인 시트 갤러리 — 흰 카드 하나가 논리 섹션 하나
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Hierarchy">
        <FrameworkScope styles={[css]}>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={`${BASE_CLASSES} px-4 py-2 text-sm ${PRIMARY_BTN}`}>
              텍스트
            </button>
            <button type="button" className={`${BASE_CLASSES} px-4 py-2 text-sm ${SOFT_BTN}`}>
              + 텍스트
            </button>
            <button type="button" className={`${BASE_CLASSES} px-4 py-2 text-sm ${TEXT_BTN}`}>
              텍스트
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css]}>
          <div className="flex flex-wrap items-start gap-3">
            {STATE_ROW.map(([label, classes]) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  className={`${BASE_CLASSES} px-4 py-2 text-sm ${classes}`}
                  disabled={label === 'Disabled'}
                >
                  텍스트
                </button>
                <span className="text-[11px] font-medium text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sizes">
        <FrameworkScope styles={[css]}>
          <div className="flex flex-wrap items-center gap-2">
            {SIZE_ROW.map(([label, classes]) => (
              <button key={label} type="button" className={`${BASE_CLASSES} ${classes} ${PRIMARY_BTN}`}>
                {label}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Variants">
        <FrameworkScope styles={[css]}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${BASE_CLASSES} px-4 py-2 text-sm bg-white border border-[#3D6BFF] text-[#3D6BFF] hover:bg-[#EDF2FF] focus-visible:ring-[#3D6BFF]`}
            >
              Outline
            </button>
            <button
              type="button"
              className={`${BASE_CLASSES} px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400`}
            >
              Neutral
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#3D6BFF] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2F5BF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF] focus-visible:ring-offset-2"
            >
              Pill
            </button>
            <button
              type="button"
              className={`${BASE_CLASSES} h-9 w-9 p-0 ${SOFT_BTN}`}
              aria-label="Add item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
