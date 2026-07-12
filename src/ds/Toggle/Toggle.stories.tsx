import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Toggle, type ToggleProps } from './Toggle'

// 컨트롤드 컴포넌트용 데모
function ToggleDemo(props: ToggleProps) {
  const [checked, setChecked] = useState(props.checked)
  return <Toggle {...props} checked={checked} onChange={setChecked} />
}

const meta = {
  title: '3. 컴포넌트/Selection/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: {
    checked: false,
    size: 'md',
    disabled: false,
    label: '알림 받기',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <ToggleDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Toggle checked />
        <Toggle checked={false} />
        <Toggle checked disabled />
        <Toggle checked={false} disabled />
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Toggle checked size="sm" />
        <Toggle checked={false} size="sm" />
        <Toggle checked label="알림 받기" />
      </div>
    </div>
  ),
}
