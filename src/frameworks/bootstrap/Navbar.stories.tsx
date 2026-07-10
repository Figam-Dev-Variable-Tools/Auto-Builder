import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  brand: string
  showSearch: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
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
                }}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}
