import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showFooter: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
const TAG_PILL_CLASSES = 'rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600'

// 커버 플레이스홀더 — 그라데이션 SVG (id는 카드마다 고유해야 함)
function CoverPlaceholder({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <svg className="block h-36 w-full" role="img" aria-label="Cover placeholder" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <circle cx="85%" cy="15%" r="46" fill="#ffffff" opacity="0.15" />
      <circle cx="10%" cy="90%" r="60" fill="#ffffff" opacity="0.1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

const meta = {
  title: 'Frameworks/Tailwind/Card',
  args: {
    title: 'Redesigning the onboarding flow',
    text: 'A behind-the-scenes look at how we cut sign-up drop-off in half with three small changes.',
    buttonLabel: 'Read article',
    showImage: true,
    showFooter: true,
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
      <div className="max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg">
        {args.showImage && <CoverPlaceholder id="twCardCoverDefault" from="#6366f1" to="#a855f7" />}
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5">
            <span className={TAG_PILL_CLASSES}>Design</span>
            <span className={TAG_PILL_CLASSES}>Research</span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              Featured
            </span>
          </div>
          <h5 className="mt-3 text-lg font-bold leading-snug text-gray-900">{args.title}</h5>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{args.text}</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              JL
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">Jamie Lee</p>
              <p className="text-xs text-gray-500">Updated 2h ago · 5 min read</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {args.buttonLabel}
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              Share
            </button>
          </div>
        </div>
        {args.showFooter && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-2.5 text-xs text-gray-500">
            <span>Updated just now</span>
            <span className="font-medium text-gray-400">v2.4</span>
          </div>
        )}
      </div>
    </FrameworkScope>
  ),
}

// 참조 디자인 시트 갤러리 — 흰 카드 하나가 논리 섹션 하나, 액센트는 #3D6BFF 계열
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Simple">
        <FrameworkScope styles={[css]}>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h5 className="font-semibold text-gray-900">Weekly digest</h5>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Get a summary of activity across all your projects every Monday morning.
            </p>
            <a
              href="#"
              className="mt-3 inline-block text-sm font-medium text-[#3D6BFF] transition-colors hover:text-[#2F5BF0]"
              onClick={(e) => e.preventDefault()}
            >
              Configure →
            </a>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Stat">
        <FrameworkScope styles={[css]}>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Monthly revenue</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-gray-900">$48.2k</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
                12.4%
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">vs. last month</p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="With cover">
        <FrameworkScope styles={[css]}>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CoverPlaceholder id="twCardCoverGallery" from="#3D6BFF" to="#7C9BFF" />
            <div className="p-5">
              <h5 className="font-semibold text-gray-900">Ship faster with previews</h5>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Every pull request gets its own live preview environment.
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-[#3D6BFF] px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2F5BF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF] focus-visible:ring-offset-2"
              >
                Learn more
              </button>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Pricing">
        <FrameworkScope styles={[css]}>
          <div className="relative rounded-xl border-2 border-[#3D6BFF] bg-white p-5 shadow-sm">
            <span className="absolute -top-3 right-4 rounded-full bg-[#3D6BFF] px-2.5 py-0.5 text-xs font-semibold text-white">
              Popular
            </span>
            <p className="text-sm font-semibold text-[#3D6BFF]">Pro</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-gray-900">$29</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><CheckIcon /> Unlimited projects</li>
              <li className="flex gap-2"><CheckIcon /> 10 team members</li>
              <li className="flex gap-2"><CheckIcon /> Priority support</li>
            </ul>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-[#3D6BFF] py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2F5BF0] active:bg-[#2450DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF] focus-visible:ring-offset-2"
            >
              Start free trial
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Horizontal" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="w-40 shrink-0">
              <svg className="block h-full w-full" role="img" aria-label="Cover placeholder" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="twCardCoverHorizontal" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#twCardCoverHorizontal)" />
                <circle cx="20%" cy="25%" r="34" fill="#ffffff" opacity="0.15" />
              </svg>
            </div>
            <div className="flex flex-col justify-center p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3D6BFF]">Case study</p>
              <h5 className="mt-1 font-bold text-gray-900">
                How Northwind cut onboarding time by 40%
              </h5>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                A distributed team of 200 moved their entire workflow in under two weeks.
              </p>
              <a
                href="#"
                className="mt-2 text-sm font-medium text-[#3D6BFF] transition-colors hover:text-[#2F5BF0]"
                onClick={(e) => e.preventDefault()}
              >
                Read the story →
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
