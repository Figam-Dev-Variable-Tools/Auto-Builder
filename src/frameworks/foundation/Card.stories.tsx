import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

const meta = {
  title: 'Frameworks/Foundation/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ width: '300px' }}>
        <div className="card-divider">Card title</div>
        <div className="card-section">
          <p>This is a sample card.</p>
          <button type="button" className="button">
            Button
          </button>
        </div>
      </div>
    </FrameworkScope>
  ),
}
