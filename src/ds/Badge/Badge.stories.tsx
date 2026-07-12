import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Badge } from './Badge'

const meta = {
  title: '3. 컴포넌트/Action/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    label: 'Badge',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'error', 'success'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['primary', 'secondary', 'error', 'success'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant={variant} size="sm" label="Badge" />
          <Badge variant={variant} size="md" label="Badge" />
        </div>
      ))}
    </div>
  ),
}
