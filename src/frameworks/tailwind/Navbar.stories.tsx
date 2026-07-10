import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About'] as const

// Tailwind JIT scans this file: every class must be a full literal string.
const ACTIVE_LINK_CLASSES = 'text-white font-semibold border-b-2 border-blue-400 pb-0.5'
const INACTIVE_LINK_CLASSES = 'text-gray-300 hover:text-white transition-colors'

function NavbarDemo(args: Args) {
  const [active, setActive] = useState<string>('Home')

  return (
    <nav className="flex items-center gap-6 bg-gray-800 text-white px-4 py-3 border-b border-gray-700 shadow-md">
      <span className="font-semibold">{args.brand}</span>
      {LINKS.map((link) => (
        <a
          key={link}
          href="#"
          className={active === link ? ACTIVE_LINK_CLASSES : INACTIVE_LINK_CLASSES}
          aria-current={active === link ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            setActive(link)
          }}
        >
          {link}
        </a>
      ))}
      {args.showSearch && (
        <div className="ml-auto flex gap-2">
          <input
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="rounded px-3 py-1.5 text-gray-900 text-sm"
          />
          <button
            type="button"
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm font-medium"
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}
