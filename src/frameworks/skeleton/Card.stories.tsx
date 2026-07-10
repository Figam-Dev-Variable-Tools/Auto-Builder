import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

const meta = {
  title: 'Frameworks/Skeleton/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[normalize, skeleton]}>
      <div className="container">
        <h5>Card title</h5>
        <p>This is a sample card.</p>
        <button type="button" className="button-primary">
          Button
        </button>
      </div>
    </FrameworkScope>
  ),
}
