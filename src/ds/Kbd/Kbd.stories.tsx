import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Kbd } from './Kbd'

const meta = {
  title: '3. 컴포넌트/Data/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: {
    keys: ['⌘', 'K'],
    withSeparator: false,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Examples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <Kbd keys={['⌘', 'K']} />
      <Kbd keys={['Ctrl', 'C']} withSeparator />
      <Kbd keys={['⌘', 'Shift', 'P']} withSeparator />
      <Kbd keys={['Esc']} />
      <Kbd keys={['↑']} />
    </div>
  ),
}
