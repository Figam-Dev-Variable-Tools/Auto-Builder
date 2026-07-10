import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

const meta = {
  title: 'Frameworks/Bulma/Navbar',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="navbar-item" href="#">
            Acme
          </a>
        </div>
        <div className="navbar-menu is-active">
          <div className="navbar-start">
            <a className="navbar-item" href="#">
              Home
            </a>
            <a className="navbar-item" href="#">
              Docs
            </a>
            <a className="navbar-item" href="#">
              About
            </a>
          </div>
        </div>
      </nav>
    </FrameworkScope>
  ),
}
