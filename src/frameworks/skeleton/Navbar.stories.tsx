import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  brand: string
}

const LINKS = ['Home', 'Docs', 'About']

function NavbarDemo(args: Args) {
  const [active, setActive] = useState('Home')

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #E1E1E1',
        boxShadow: '0 2px 4px rgba(0,0,0,.05)',
        background: '#fff',
      }}
    >
      <strong>{args.brand}</strong>
      {LINKS.map((link) => (
        <a
          key={link}
          href="#"
          aria-current={active === link ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            setActive(link)
          }}
          style={
            active === link
              ? {
                  color: '#1EAEDB',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: '2px solid #1EAEDB',
                }
              : { color: '#555', textDecoration: 'none' }
          }
        >
          {link}
        </a>
      ))}
    </nav>
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[normalize, skeleton]}>
      <NavbarDemo {...args} />
    </FrameworkScope>
  ),
}
