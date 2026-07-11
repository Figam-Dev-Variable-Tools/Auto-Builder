import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  brand: string
  showCta: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="ui menu">
      <div className="header item">{args.brand}</div>
      {LINKS.map((link) => (
        <a
          key={link}
          className={`item${active === link ? ' active' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setActive(link)
          }}
        >
          {link}
        </a>
      ))}
      <div className="right menu">
        <div className="item">
          <div className="ui input">
            <input type="text" placeholder="Search..." />
          </div>
        </div>
        {/* jQuery 미로드 — simple 드롭다운에 active/visible 클래스를 React 상태로 토글 */}
        <div
          className={`ui simple dropdown item${menuOpen ? ' active visible' : ''}`}
          role="button"
          tabIndex={0}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Account <span aria-hidden="true">&#9662;</span>
          <div className="menu">
            <a className="item" href="#" onClick={(e) => e.preventDefault()}>
              Profile
            </a>
            <a className="item" href="#" onClick={(e) => e.preventDefault()}>
              Settings
            </a>
            <a className="item" href="#" onClick={(e) => e.preventDefault()}>
              Sign out
            </a>
          </div>
        </div>
        {args.showCta && (
          <div className="item">
            <button type="button" className="ui primary button">
              Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GalleryMenu({ className }: { className: string }) {
  return (
    <div className={className}>
      <div className="header item">Acme</div>
      <a className="active item" href="#" onClick={(e) => e.preventDefault()}>
        Home
      </a>
      <a className="item" href="#" onClick={(e) => e.preventDefault()}>
        Docs
      </a>
      <a className="item" href="#" onClick={(e) => e.preventDefault()}>
        About
      </a>
    </div>
  )
}

// 카드마다 독립 Shadow DOM 스코프 — 시트 크롬(캔버스/카드)은 밖, Semantic 마크업만 안쪽에 둔다.
function Scope({ children }: { children: ReactNode }) {
  return (
    <FrameworkScope styles={[css]} rootClassName="ui">
      {children}
    </FrameworkScope>
  )
}

function NavbarGallery() {
  return (
    <SheetCanvas>
      <SheetCard title="Default" span={2}>
        <Scope>
          <GalleryMenu className="ui menu" />
        </Scope>
      </SheetCard>
      <SheetCard title="Colored" span={2}>
        <Scope>
          <GalleryMenu className="ui blue inverted menu" />
        </Scope>
      </SheetCard>
      <SheetCard title="Inverted" span={2}>
        <Scope>
          <GalleryMenu className="ui inverted menu" />
        </Scope>
      </SheetCard>
      <SheetCard title="Secondary" span={2}>
        <Scope>
          <GalleryMenu className="ui secondary menu" />
        </Scope>
      </SheetCard>
      <SheetCard title="Pointing" span={2}>
        <Scope>
          <GalleryMenu className="ui pointing menu" />
        </Scope>
      </SheetCard>
    </SheetCanvas>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Navbar',
  args: { brand: 'Acme', showCta: true },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => <NavbarGallery />,
}
