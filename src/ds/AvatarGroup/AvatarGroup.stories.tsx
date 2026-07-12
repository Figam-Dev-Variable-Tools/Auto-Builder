import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { AvatarGroup } from './AvatarGroup'

const meta = {
  title: '3. 컴포넌트/Data/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
  args: {
    names: ['김민준', '이서연', '박도윤', '최지우'],
    max: 3,
    size: 'md',
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof AvatarGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <AvatarGroup size="sm" />
      <AvatarGroup size="md" />
    </div>
  ),
}
