import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Card } from './Card'

const meta = {
  title: '3. 컴포넌트/Layout/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Card title',
    showFooter: true,
    children: 'This is a sample card.',
  },
  argTypes: {
    children: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <Card title="Card title">This is a sample card.</Card>
      <Card title="Card title" showFooter>
        This is a sample card.
      </Card>
    </div>
  ),
}
