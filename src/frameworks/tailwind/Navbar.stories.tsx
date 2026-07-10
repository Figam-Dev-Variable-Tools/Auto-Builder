import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

const meta = {
  title: 'Frameworks/Tailwind/Navbar',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <nav className="flex items-center gap-4 bg-gray-800 text-white px-4 py-3">
        <span className="font-medium">Acme</span>
        <a href="#">Home</a>
        <a href="#">Docs</a>
        <a href="#">About</a>
      </nav>
    </FrameworkScope>
  ),
}
