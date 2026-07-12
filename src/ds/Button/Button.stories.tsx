import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from './Button'

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.28L18.2 20 12 16.56 5.8 20l1.45-6.45L2.5 9.27l6.6-1.01L12 2z" />
    </svg>
  )
}

const meta = {
  title: '3. 컴포넌트/Action/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Button',
    showIcon: false,
    icon: <IconStar />,
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'error', 'success'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['primary', 'secondary', 'error', 'success'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} variant={variant} size={size} label="Button" />
          ))}
          <Button variant={variant} size="md" label="Button" showIcon icon={<IconStar />} />
          <Button variant={variant} size="md" label="Button" disabled />
        </div>
      ))}
    </div>
  ),
}
