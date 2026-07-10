import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

const meta = {
  title: 'Frameworks/Bulma/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ maxWidth: '20rem' }}>
        <div className="card-content">
          <p className="title is-5">Card title</p>
          <div className="content">This is a sample card.</div>
          <button type="button" className="button is-primary">
            Button
          </button>
        </div>
      </div>
    </FrameworkScope>
  ),
}
