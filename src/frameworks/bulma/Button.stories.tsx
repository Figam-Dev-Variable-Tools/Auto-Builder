import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

const meta = {
  title: 'Frameworks/Bulma/Button',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <button type="button" className="button is-primary">
        Button
      </button>{' '}
      <button type="button" className="button is-primary" disabled>
        Button
      </button>
    </FrameworkScope>
  ),
}
