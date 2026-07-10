import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

const meta = {
  title: 'Frameworks/Tailwind/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="max-w-sm rounded-lg border shadow p-4">
        <h5 className="font-bold">Card title</h5>
        <p>This is a sample card.</p>
        <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white font-medium">
          Button
        </button>
      </div>
    </FrameworkScope>
  ),
}
