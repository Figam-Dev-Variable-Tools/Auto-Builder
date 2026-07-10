import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <div
      className="top-bar"
      style={{ borderBottom: '1px solid #e6e6e6', boxShadow: '0 2px 4px rgba(0,0,0,.08)' }}
    >
      <div className="top-bar-left">
        <ul className="dropdown menu">
          <li className="menu-text">{args.brand}</li>
          {LINKS.map((link) => (
            <li className={active === link ? 'is-active' : undefined} key={link}>
              <a
                href="#"
                aria-current={active === link ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setActive(link)
                }}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {args.showSearch && (
        <div className="top-bar-right">
          <ul className="menu">
            <li>
              <input type="search" placeholder="Search" aria-label="Search" />
            </li>
            <li>
              <button type="button" className="button">
                Search
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Foundation/Navbar',
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
