import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About']
const PRODUCTS = ['Analytics', 'Automation', 'Billing']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')
  const [open, setOpen] = useState(false)

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
          {/* 드롭다운 서브메뉴 — Foundation JS 대신 React 상태로 열림 제어 */}
          <li className={`is-dropdown-submenu-parent opens-right${open ? ' is-active' : ''}`}>
            <a
              href="#"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={(e) => {
                e.preventDefault()
                setOpen((v) => !v)
              }}
            >
              Products
            </a>
            <ul
              className={`menu submenu is-dropdown-submenu first-sub vertical${
                open ? ' js-dropdown-active' : ''
              }`}
            >
              {PRODUCTS.map((item) => (
                <li className="is-submenu-item is-dropdown-submenu-item" key={item}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setOpen(false)
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </li>
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}

// 메뉴 아이콘용 인라인 SVG
function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ marginRight: '0.35rem' }}>
      <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Top bar" span={3}>
        <FrameworkScope styles={[css]}>
          <div className="top-bar" style={{ border: '1px solid #e6e6e6' }}>
            <div className="top-bar-left">
              <ul className="menu">
                <li className="menu-text">Acme</li>
                <li className="is-active">
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    About
                  </a>
                </li>
              </ul>
            </div>
            <div className="top-bar-right">
              <ul className="menu">
                <li>
                  <button type="button" className="button small" style={{ marginBottom: 0 }}>
                    Sign up
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Stacked" span={3}>
        <FrameworkScope styles={[css]}>
          {/* stacked-for-large — large 이하 뷰포트에서 좌/우 영역이 세로로 쌓인다 */}
          <div className="top-bar stacked-for-large" style={{ border: '1px solid #e6e6e6' }}>
            <div className="top-bar-left">
              <ul className="menu">
                <li className="menu-text">Acme</li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Reports
                  </a>
                </li>
              </ul>
            </div>
            <div className="top-bar-right">
              <ul className="menu">
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Settings
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Log out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Menu" span={2}>
        <FrameworkScope styles={[css]}>
          <ul className="menu" style={{ border: '1px solid #e6e6e6' }}>
            <li className="is-active">
              <a href="#" onClick={(e) => e.preventDefault()}>
                <MenuIcon />
                <span>Overview</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <MenuIcon />
                <span>Members</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <MenuIcon />
                <span>Billing</span>
              </a>
            </li>
          </ul>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Vertical">
        <FrameworkScope styles={[css]}>
          <ul className="vertical menu" style={{ border: '1px solid #e6e6e6' }}>
            <li className="is-active">
              <a href="#" onClick={(e) => e.preventDefault()}>
                Profile
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Security
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Notifications
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Integrations
              </a>
            </li>
          </ul>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
