import { useState, type MouseEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  brand: string
}

const LINKS = ['Home', 'Docs', 'About']

// 데모 링크 이동 방지
const noNav = (e: MouseEvent) => e.preventDefault()

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav>
      <div className="nav-wrapper teal">
        <a href="#" className="brand-logo" style={{ paddingLeft: '16px' }} onClick={noNav}>
          {args.brand}
        </a>
        <ul className="right">
          {LINKS.map((link) => (
            <li key={link} className={active === link ? 'active' : ''}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setActive(link)
                }}
              >
                {link}
              </a>
            </li>
          ))}
          <li>
            <div className="input-field">
              <input
                id="mzNavSearch"
                type="search"
                placeholder="Search"
                style={{ color: '#fff', width: '130px', margin: '8px 8px 0', paddingLeft: '4px' }}
              />
            </div>
          </li>
          {/* 드롭다운 JS가 없으므로 React 상태로 토글 */}
          <li style={{ position: 'relative' }}>
            <a
              href="#"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen((open) => !open)
              }}
            >
              More ▾
            </a>
            {menuOpen && (
              <ul
                className="dropdown-content"
                style={{
                  display: 'block',
                  opacity: 1,
                  position: 'absolute',
                  top: '100%',
                  left: 'auto',
                  right: 0,
                  minWidth: '140px',
                }}
              >
                <li>
                  <a href="#" onClick={noNav}>
                    Profile
                  </a>
                </li>
                <li>
                  <a href="#" onClick={noNav}>
                    Settings
                  </a>
                </li>
                <li className="divider" role="separator" />
                <li>
                  <a href="#" onClick={noNav}>
                    Log out
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}

const meta = {
  title: 'Frameworks/Materialize/Navbar',
  args: { brand: 'Acme' },
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

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Teal, centered brand" span={2}>
        <FrameworkScope styles={[css]}>
          <nav>
            <div className="nav-wrapper teal">
              <ul className="left">
                <li className="active">
                  <a href="#" onClick={noNav}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" onClick={noNav}>
                    Docs
                  </a>
                </li>
              </ul>
              <a href="#" className="brand-logo center" onClick={noNav}>
                Acme
              </a>
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Default" span={2}>
        <FrameworkScope styles={[css]}>
          <nav>
            <div className="nav-wrapper">
              <a href="#" className="brand-logo" style={{ paddingLeft: '16px' }} onClick={noNav}>
                Acme
              </a>
              <ul className="right">
                <li className="active">
                  <a href="#" onClick={noNav}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" onClick={noNav}>
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" onClick={noNav}>
                    About
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Tabs" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="nav-extended">
            <div className="nav-wrapper">
              <a href="#" className="brand-logo" style={{ paddingLeft: '16px' }} onClick={noNav}>
                Acme
              </a>
              <ul className="right">
                <li>
                  <a href="#" onClick={noNav}>
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div className="nav-content">
              <ul className="tabs tabs-transparent">
                <li className="tab">
                  <a className="active" href="#" onClick={noNav}>
                    Overview
                  </a>
                </li>
                <li className="tab">
                  <a href="#" onClick={noNav}>
                    Activity
                  </a>
                </li>
                <li className="tab">
                  <a href="#" onClick={noNav}>
                    Settings
                  </a>
                </li>
                <li className="tab disabled">
                  <a href="#" onClick={noNav}>
                    Billing
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="With CTA" span={2}>
        <FrameworkScope styles={[css]}>
          <nav>
            <div className="nav-wrapper grey darken-3">
              <a href="#" className="brand-logo" style={{ paddingLeft: '16px' }} onClick={noNav}>
                Acme
              </a>
              <ul className="right">
                <li>
                  <a href="#" onClick={noNav}>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" onClick={noNav}>
                    Docs
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="btn amber darken-2"
                    style={{ margin: '0 12px' }}
                    onClick={noNav}
                  >
                    Sign up
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
