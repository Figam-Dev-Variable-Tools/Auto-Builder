import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

const meta = {
  title: 'Frameworks/Bootstrap/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ width: '18rem' }}>
        <div className="card-body">
          <h5 className="card-title">Card title</h5>
          <p className="card-text">This is a sample card.</p>
          <a href="#" className="btn btn-primary">
            Button
          </a>
        </div>
      </div>
    </FrameworkScope>
  ),
}
