import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About'] as const
const DROPDOWN_ITEMS = ['Blog', 'Changelog', 'Community', 'Support'] as const

// Tailwind JIT scans this file: every class must be a full literal string.
const ACTIVE_LINK_CLASSES = 'rounded-md bg-gray-700/60 px-3 py-1.5 text-sm font-medium text-white'
const INACTIVE_LINK_CLASSES =
  'rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/40 hover:text-white'

function BrandMark({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
        {label.charAt(0)}
      </span>
      <span className="font-semibold tracking-tight">{label}</span>
    </span>
  )
}

function NavbarDemo(args: Args) {
  const [active, setActive] = useState<string>('Home')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="flex w-[42rem] items-center gap-1 rounded-lg bg-gray-800 px-4 py-2.5 text-white shadow-md">
      <span className="mr-4">
        <BrandMark label={args.brand} />
      </span>
      {LINKS.map((link) => (
        <a
          key={link}
          href="#"
          className={active === link ? ACTIVE_LINK_CLASSES : INACTIVE_LINK_CLASSES}
          aria-current={active === link ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            setActive(link)
            setMenuOpen(false)
          }}
        >
          {link}
        </a>
      ))}
      {/* React 상태 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          className={
            menuOpen
              ? 'flex items-center gap-1 rounded-md bg-gray-700/60 px-3 py-1.5 text-sm font-medium text-white'
              : 'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700/40 hover:text-white'
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Resources
          <svg
            className={menuOpen ? 'h-3.5 w-3.5 rotate-180 transition-transform' : 'h-3.5 w-3.5 transition-transform'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute left-0 z-10 mt-2 w-44 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5">
            {DROPDOWN_ITEMS.map((item) => (
              <a
                key={item}
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
                }}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </div>
      {args.showSearch && (
        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="w-44 rounded-lg bg-gray-700/60 px-3 py-1.5 text-sm text-white placeholder:text-gray-400 transition-colors focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Search
          </button>
        </div>
      )}
    </nav>
  )
}

const meta = {
  title: 'Frameworks/Tailwind/Navbar',
  args: { brand: 'Acme', showSearch: true },
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
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}

// 참조 디자인 시트 갤러리 — 흰 카드 하나가 논리 섹션 하나, 액센트는 #3D6BFF 계열
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Light" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="mr-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-[#3D6BFF]"></span>
              <span className="font-semibold tracking-tight text-gray-900">Acme</span>
            </span>
            <a href="#" className="rounded-md bg-[#EDF2FF] px-3 py-1.5 text-sm font-medium text-[#3D6BFF]" onClick={(e) => e.preventDefault()}>
              Dashboard
            </a>
            <a href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
              Projects
            </a>
            <a href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
              Settings
            </a>
            <button
              type="button"
              className="ml-auto rounded-lg bg-[#3D6BFF] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2F5BF0]"
            >
              New project
            </button>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dark" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="flex items-center gap-1 rounded-lg bg-gray-900 px-4 py-2.5 shadow-md">
            <span className="mr-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-blue-400"></span>
              <span className="font-semibold tracking-tight text-white">Acme</span>
            </span>
            <a href="#" className="border-b-2 border-blue-400 px-3 py-1.5 text-sm font-medium text-white" onClick={(e) => e.preventDefault()}>
              Overview
            </a>
            <a href="#" className="border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white" onClick={(e) => e.preventDefault()}>
              Metrics
            </a>
            <a href="#" className="border-b-2 border-transparent px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white" onClick={(e) => e.preventDefault()}>
              Alerts
            </a>
            <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
              JL
            </span>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Brand" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="flex items-center gap-1 rounded-lg bg-[#3D6BFF] px-4 py-2.5 shadow-md">
            <span className="mr-4 font-semibold tracking-tight text-white">Acme Cloud</span>
            <a href="#" className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white" onClick={(e) => e.preventDefault()}>
              Home
            </a>
            <a href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white" onClick={(e) => e.preventDefault()}>
              Pricing
            </a>
            <a href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white" onClick={(e) => e.preventDefault()}>
              Docs
            </a>
            <button
              type="button"
              className="ml-auto rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#3D6BFF] shadow-sm transition-colors hover:bg-blue-50"
            >
              Sign up
            </button>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Centered links" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="grid grid-cols-3 items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="font-semibold tracking-tight text-gray-900">Acme</span>
            <div className="flex justify-center gap-1">
              <a href="#" className="rounded-full bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white" onClick={(e) => e.preventDefault()}>
                Work
              </a>
              <a href="#" className="rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                Studio
              </a>
              <a href="#" className="rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                Contact
              </a>
            </div>
            <span className="justify-self-end text-sm font-medium text-gray-400">EN</span>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="With search" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[#3D6BFF] to-indigo-500"></span>
              <span className="font-semibold tracking-tight text-gray-900">Acme</span>
            </span>
            <div className="relative ml-2 flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="search"
                placeholder="Search projects, docs, people…"
                aria-label="Search"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 transition-colors focus:border-[#3D6BFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3D6BFF]/30"
              />
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF2FF] text-xs font-semibold text-[#3D6BFF]">
              JL
            </span>
          </nav>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
