import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Alert } from './Alert'

const meta = {
  title: '3. 컴포넌트/Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    variant: 'error',
    label: 'This is a warning message.',
    showIcon: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['error', 'success'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Alert variant="error" label="This is a warning message." />
      <Alert variant="error" label="This is a warning message." showIcon />
      <Alert variant="success" label="저장이 완료되었습니다." />
      <Alert variant="success" label="저장이 완료되었습니다." showIcon />
    </div>
  ),
}
