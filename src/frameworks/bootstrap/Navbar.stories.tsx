import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About']
const PRODUCTS = ['Analytics', 'Automation', 'Billing']

// currentColor 벨 아이콘 (외부 에셋 불필요)
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z" />
    </svg>
  )
}

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
          {args.brand}
        </a>
        <ul className="navbar-nav me-auto">
          {LINKS.map((link) => (
            <li className="nav-item" key={link}>
              <a
                className={`nav-link${active === link ? ' active' : ''}`}
                aria-current={active === link ? 'page' : undefined}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setActive(link)
                  setMenuOpen(false)
                }}
              >
                {link}
              </a>
            </li>
          ))}
          {/* Bootstrap JS 없이 React 상태로 .show 를 토글하는 드롭다운 */}
          <li className={`nav-item dropdown${menuOpen ? ' show' : ''}`}>
            <a
              className={`nav-link dropdown-toggle${active === 'Products' ? ' active' : ''}${menuOpen ? ' show' : ''}`}
              href="#"
              role="button"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen((open) => !open)
              }}
            >
              Products
            </a>
            <ul className={`dropdown-menu${menuOpen ? ' show' : ''}`}>
              {PRODUCTS.map((item) => (
                <li key={item}>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setActive('Products')
                      setMenuOpen(false)
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                  See all products
                </a>
              </li>
            </ul>
          </li>
        </ul>
        <button
          type="button"
          className="btn btn-outline-secondary position-relative me-3"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">
            3<span className="visually-hidden">unread notifications</span>
          </span>
        </button>
        {args.showSearch && (
          <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-primary" type="submit">
              Search
            </button>
          </form>
        )}
      </div>
    </nav>
  )
}

const meta = {
  title: 'Frameworks/Bootstrap/Navbar',
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
      <div style={{ minHeight: '16rem' }}>
        <NavbarDemo {...args} />
      </div>
    </FrameworkScope>
  ),
}

function GalleryLinks({ active = 'Home' }: { active?: string }) {
  return (
    <ul className="navbar-nav me-auto">
      {LINKS.map((link) => (
        <li className="nav-item" key={link}>
          <a
            className={`nav-link${active === link ? ' active' : ''}`}
            aria-current={active === link ? 'page' : undefined}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Light" span={2}>
        <FrameworkScope styles={[css]}>
          <nav className="navbar navbar-expand bg-body-tertiary border rounded">
            <div className="container-fluid">
              <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
                Light
              </a>
              <GalleryLinks />
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dark" span={2}>
        <FrameworkScope styles={[css]}>
          <nav className="navbar navbar-expand navbar-dark bg-dark rounded">
            <div className="container-fluid">
              <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
                Dark
              </a>
              <GalleryLinks />
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Primary" span={2}>
        <FrameworkScope styles={[css]}>
          <nav className="navbar navbar-expand navbar-dark bg-primary rounded">
            <div className="container-fluid">
              <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
                Primary
              </a>
              <GalleryLinks />
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Search" span={3}>
        <FrameworkScope styles={[css]}>
          <nav className="navbar navbar-expand bg-body-tertiary border rounded">
            <div className="container-fluid">
              <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
                Search
              </a>
              <GalleryLinks />
              <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="form-control me-2"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                />
                <button className="btn btn-outline-primary" type="submit">
                  Search
                </button>
              </form>
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dropdown (Open)" span={2}>
        <FrameworkScope styles={[css]}>
          {/* 정적으로 .show 를 붙여 열린 상태를 보여준다 */}
          <div style={{ minHeight: '13rem' }}>
            <nav className="navbar navbar-expand bg-body-tertiary border rounded">
              <div className="container-fluid">
                <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
                  Dropdown
                </a>
                <ul className="navbar-nav me-auto">
                  <li className="nav-item">
                    <a
                      className="nav-link active"
                      aria-current="page"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      Home
                    </a>
                  </li>
                  <li className="nav-item dropdown show">
                    <a
                      className="nav-link dropdown-toggle show"
                      href="#"
                      role="button"
                      aria-expanded="true"
                      onClick={(e) => e.preventDefault()}
                    >
                      Products
                    </a>
                    <ul className="dropdown-menu show">
                      {PRODUCTS.map((item) => (
                        <li key={item}>
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => e.preventDefault()}
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                          See all products
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
