import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

const meta = {
  title: 'Frameworks/Tailwind/Alert',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">
        This is a warning message.
      </div>
    </FrameworkScope>
  ),
}
