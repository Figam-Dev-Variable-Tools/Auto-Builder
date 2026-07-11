import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  brand: string
  showSignup: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')
  // Bulma는 CSS 전용이라 burger/dropdown 토글은 React 상태로 처리
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <nav className="navbar has-shadow" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
          <strong>{args.brand}</strong>
        </a>
        <a
          role="button"
          className={`navbar-burger${menuOpen ? ' is-active' : ''}`}
          aria-label="menu"
          aria-expanded={menuOpen}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setMenuOpen((open) => !open)
          }}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </a>
      </div>
      {/* 모바일 폭에서는 burger가 is-active를 토글해 메뉴를 연다 */}
      <div className={`navbar-menu${menuOpen ? ' is-active' : ''}`}>
        <div className="navbar-start">
          {LINKS.map((link) => (
            <a
              key={link}
              className={`navbar-item${active === link ? ' is-active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActive(link)
              }}
            >
              {link}
            </a>
          ))}
          <div className={`navbar-item has-dropdown${dropdownOpen ? ' is-active' : ''}`}>
            <a
              className="navbar-link"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setDropdownOpen((open) => !open)
              }}
            >
              More
            </a>
            <div className="navbar-dropdown">
              <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                Team
              </a>
              <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                Pricing
              </a>
              <hr className="navbar-divider" />
              <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                Report an issue
              </a>
            </div>
          </div>
        </div>
        {args.showSignup && (
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <a className="button is-primary" href="#" onClick={(e) => e.preventDefault()}>
                  <strong>Sign up</strong>
                </a>
                <a className="button is-light" href="#" onClick={(e) => e.preventDefault()}>
                  Log in
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// 갤러리용 정적 내비게이션 바
function GalleryBar({
  color,
  dropdown = false,
}: {
  color?: 'primary' | 'dark'
  dropdown?: boolean
}) {
  return (
    <nav
      className={`navbar${color ? ` is-${color}` : ' has-shadow'}`}
      role="navigation"
      aria-label="example navigation"
    >
      <div className="navbar-brand">
        <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
          <strong>Acme</strong>
        </a>
      </div>
      {/* is-active keeps the menu links visible at all viewport widths */}
      <div className="navbar-menu is-active">
        <div className="navbar-start">
          <a className="navbar-item is-active" href="#" onClick={(e) => e.preventDefault()}>
            Home
          </a>
          <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
            Docs
          </a>
          <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
            About
          </a>
          {dropdown && (
            <div className="navbar-item has-dropdown is-active">
              <a className="navbar-link" href="#" onClick={(e) => e.preventDefault()}>
                More
              </a>
              <div className="navbar-dropdown">
                <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                  Team
                </a>
                <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                  Pricing
                </a>
                <hr className="navbar-divider" />
                <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
                  Report an issue
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              <a
                className={`button ${color ? 'is-light' : 'is-primary'}`}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <strong>Sign up</strong>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

const meta = {
  title: 'Frameworks/Bulma/Navbar',
  args: { brand: 'Acme', showSignup: true },
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

// 내비게이션 바 변형 모음 — 참조 시트 룩(캔버스 + 카드) 구성, 파랑/프라이머리 우선
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Primary" span={3}>
        <FrameworkScope styles={[css]}>
          <GalleryBar color="primary" />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Default" span={3}>
        <FrameworkScope styles={[css]}>
          <GalleryBar />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dark" span={3}>
        <FrameworkScope styles={[css]}>
          <GalleryBar color="dark" />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dropdown" span={3}>
        <FrameworkScope styles={[css]}>
          {/* 열린 드롭다운이 카드 밖으로 흘러넘치지 않게 하단 여백 확보 */}
          <div style={{ paddingBottom: '9rem' }}>
            <GalleryBar dropdown />
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
