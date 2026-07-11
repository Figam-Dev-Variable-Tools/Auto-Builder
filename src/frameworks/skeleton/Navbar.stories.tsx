import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  brand: string
}

// Skeleton 에는 내비게이션 컴포넌트가 없어 얇은 보더로 흉내낸다 (섀도 루트 안에서만 주입)
const navCss = `
.sk-navbar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E1E1E1;
  background: #fff;
}
.sk-navbar a {
  color: #555;
  text-decoration: none;
}
.sk-navbar a:hover {
  color: #333;
}
.sk-navbar a.is-active {
  color: #1EAEDB;
  font-weight: 600;
  border-bottom: 2px solid #1EAEDB;
}
.sk-navbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2rem;
}
`

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <div style={{ minWidth: 480 }}>
      <nav className="sk-navbar" style={{ boxShadow: '0 2px 4px rgba(0,0,0,.05)' }}>
        <strong>{args.brand}</strong>
        {LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className={active === link ? 'is-active' : undefined}
            aria-current={active === link ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              setActive(link)
            }}
          >
            {link}
          </a>
        ))}
        <div className="sk-navbar__right">
          <button type="button" className="button-primary" style={{ marginBottom: 0 }}>
            Sign in
          </button>
        </div>
      </nav>
      {/* 내비게이션 아래의 여백 많은 히어로 섹션 */}
      <div style={{ padding: '3rem 1.5rem' }}>
        <h5 style={{ marginBottom: '.5rem' }}>{active}</h5>
        <p style={{ color: '#555', marginBottom: 0 }}>
          A dead simple, responsive boilerplate. Use the links above to switch pages.
        </p>
      </div>
    </div>
  )
}

const meta = {
  title: 'Frameworks/Skeleton/Navbar',
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
    <FrameworkScope styles={[normalize, skeleton, navCss]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Plain" span={2}>
        <FrameworkScope styles={[normalize, skeleton, navCss]}>
          <nav className="sk-navbar">
            <strong>Acme</strong>
            {LINKS.map((link) => (
              <a key={link} href="#" onClick={(e) => e.preventDefault()}>
                {link}
              </a>
            ))}
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Active link" span={2}>
        <FrameworkScope styles={[normalize, skeleton, navCss]}>
          <nav className="sk-navbar">
            <strong>Acme</strong>
            {LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className={link === 'Docs' ? 'is-active' : undefined}
                aria-current={link === 'Docs' ? 'page' : undefined}
                onClick={(e) => e.preventDefault()}
              >
                {link}
              </a>
            ))}
          </nav>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Right aligned" span={2}>
        <FrameworkScope styles={[normalize, skeleton, navCss]}>
          <nav className="sk-navbar">
            <strong>Acme</strong>
            <div className="sk-navbar__right">
              {LINKS.map((link) => (
                <a key={link} href="#" onClick={(e) => e.preventDefault()}>
                  {link}
                </a>
              ))}
            </div>
          </nav>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
