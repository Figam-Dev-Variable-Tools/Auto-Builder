import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  brand: string
  showCta: boolean
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

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
      {args.showCta && (
        <div className="right menu">
          <div className="item">
            <button type="button" className="ui primary button">
              Sign up
            </button>
          </div>
        </div>
      )}
    </div>
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}
