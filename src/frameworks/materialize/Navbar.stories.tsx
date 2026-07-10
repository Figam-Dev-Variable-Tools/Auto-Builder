import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

const meta = {
  title: 'Frameworks/Materialize/Navbar',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <nav>
        <div className="nav-wrapper">
          <a href="#" className="brand-logo">
            Acme
          </a>
          <ul className="right">
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">Docs</a>
            </li>
            <li>
              <a href="#">About</a>
            </li>
          </ul>
        </div>
      </nav>
    </FrameworkScope>
  ),
}
