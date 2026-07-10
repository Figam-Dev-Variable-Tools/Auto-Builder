import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  brand: string
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <nav>
      <div className="nav-wrapper teal">
        <a href="#" className="brand-logo" style={{ paddingLeft: '16px' }}>
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}
