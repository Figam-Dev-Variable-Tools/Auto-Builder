import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

const meta = {
  title: 'Frameworks/Semantic UI/Button',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <button type="button" className="ui primary button">
        Button
      </button>{' '}
      <button type="button" className="ui primary disabled button" disabled>
        Button
      </button>
    </FrameworkScope>
  ),
}
