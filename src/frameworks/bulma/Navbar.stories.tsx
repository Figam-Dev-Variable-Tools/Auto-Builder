import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  brand: string
  showSignup: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <nav className="navbar has-shadow" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <a className="navbar-item" href="#" onClick={(e) => e.preventDefault()}>
          <strong>{args.brand}</strong>
        </a>
      </div>
      {/* is-active keeps the menu links visible at all viewport widths */}
      <div className="navbar-menu is-active">
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

const meta = {
  title: 'Frameworks/Bulma/Navbar',
  args: { brand: 'Acme', showSignup: true },
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
