import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

const meta = {
  title: 'Frameworks/Foundation/Button',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <button type="button" className="button">
        Button
      </button>{' '}
      <button type="button" className="button disabled" disabled>
        Button
      </button>
    </FrameworkScope>
  ),
}
