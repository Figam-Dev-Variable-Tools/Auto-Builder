import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

const meta = {
  title: 'Frameworks/Tailwind/Form',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <form>
        <label htmlFor="tailwindEmail">Email</label>
        <input
          id="tailwindEmail"
          className="border rounded px-3 py-2 w-full"
          placeholder="Email"
        />
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-medium">
          Submit
        </button>
      </form>
    </FrameworkScope>
  ),
}
