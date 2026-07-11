import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Tone = 'yellow' | 'red' | 'green' | 'blue'

type Args = {
  message: string
  tone: Tone
  dismissible: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
const TONE_CLASSES: Record<Tone, string> = {
  yellow: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  red: 'border-red-400 bg-red-50 text-red-800',
  green: 'border-green-400 bg-green-50 text-green-800',
  blue: 'border-blue-400 bg-blue-50 text-blue-800',
}

const TONE_TITLES: Record<Tone, string> = {
  yellow: 'Warning',
  red: 'Something went wrong',
  green: 'Success',
  blue: 'Good to know',
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        onClick={() => setVisible(true)}
      >
        Show alert
      </button>
    )
  }
  return (
    <div
      className={`w-full max-w-md rounded-lg border-l-4 p-4 shadow-sm ${TONE_CLASSES[args.tone]}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{TONE_TITLES[args.tone]}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{args.message}</p>
        </div>
        {args.dismissible && (
          <button
            type="button"
            className="-m-1 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss alert"
            onClick={() => setVisible(false)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// 갤러리용 닫기 가능 알림 — 상태는 컴포넌트 내부에 유지
function DismissibleGalleryAlert() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        onClick={() => setVisible(true)}
      >
        Show dismissed alert
      </button>
    )
  }
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-800"
      role="alert"
    >
      <p>
        <span className="font-semibold">Scheduled maintenance</span> — the API will be read-only
        on Sunday from 02:00 to 04:00 UTC.
      </p>
      <button
        type="button"
        className="-m-1 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label="Dismiss alert"
        onClick={() => setVisible(false)}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// 갤러리 데이터: 클래스는 전부 완전한 리터럴 문자열
const GALLERY_TONES: [string, string, string][] = [
  [
    'Info',
    'A new version is available. See the changelog for details.',
    'rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-800',
  ],
  [
    'Success',
    'Your changes have been saved and deployed to production.',
    'rounded-md border-l-4 border-green-400 bg-green-50 px-4 py-3 text-sm text-green-800',
  ],
  [
    'Warning',
    'Your trial ends in 3 days. Add a payment method to keep access.',
    'rounded-md border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800',
  ],
  [
    'Error',
    'Deployment failed: build step exited with code 1.',
    'rounded-md border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-800',
  ],
]

// 참조 시트의 Toast 카드 — 점 아이콘 + 파스텔 배경 바 (메시지, 바 클래스, 점 클래스)
const TOAST_ROW: [string, string, string][] = [
  [
    '저장되었습니다.',
    'flex items-center gap-2.5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800',
    'h-2 w-2 shrink-0 rounded-full bg-green-500',
  ],
  [
    '새 댓글이 도착했습니다.',
    'flex items-center gap-2.5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800',
    'h-2 w-2 shrink-0 rounded-full bg-blue-500',
  ],
  [
    '저장 공간이 거의 가득 찼습니다.',
    'flex items-center gap-2.5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800',
    'h-2 w-2 shrink-0 rounded-full bg-amber-500',
  ],
  [
    '요청을 처리하지 못했습니다.',
    'flex items-center gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800',
    'h-2 w-2 shrink-0 rounded-full bg-red-500',
  ],
]

const meta = {
  title: 'Frameworks/Tailwind/Alert',
  args: { message: 'Your trial expires in 3 days. Upgrade to keep your projects.', tone: 'yellow', dismissible: true },
  argTypes: {
    tone: { control: 'select', options: ['yellow', 'red', 'green', 'blue'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

// 참조 디자인 시트 갤러리 — 흰 카드 하나가 논리 섹션 하나
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Toast">
        <FrameworkScope styles={[css]}>
          <div className="space-y-2">
            {TOAST_ROW.map(([message, barClasses, dotClasses]) => (
              <div key={message} className={barClasses} role="status">
                <span className={dotClasses} aria-hidden="true"></span>
                {message}
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Tones">
        <FrameworkScope styles={[css]}>
          <div className="space-y-2">
            {GALLERY_TONES.map(([title, body, classes]) => (
              <div key={title} className={classes} role="alert">
                <span className="font-semibold">{title}.</span> {body}
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="With title & actions">
        <FrameworkScope styles={[css]}>
          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-4" role="alert">
            <p className="text-sm font-semibold text-amber-800">Payment method expiring</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-700">
              Your card ending in 4242 expires this month. Update it now to avoid any interruption
              to your service.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-md bg-amber-100 px-2.5 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Update card
              </button>
              <button
                type="button"
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Remind me later
              </button>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <FrameworkScope styles={[css]}>
          <DismissibleGalleryAlert />
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
