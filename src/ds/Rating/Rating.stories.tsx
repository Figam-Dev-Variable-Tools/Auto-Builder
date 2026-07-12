import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Rating } from './Rating'

const meta = {
  title: '3. 컴포넌트/Data/Rating',
  component: Rating,
  tags: ['autodocs'],
  args: {
    value: 3,
    max: 5,
    size: 'md',
    readOnly: false,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Rating>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Rating size="sm" value={3.5} />
      <Rating size="md" value={3.5} />
    </div>
  ),
}

export const ReadOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Rating readOnly value={4} />
      <Rating readOnly value={2.5} />
      <Rating readOnly value={5} />
    </div>
  ),
}
