import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Checkbox, type CheckboxProps } from './Checkbox'

// 컨트롤드 컴포넌트용 데모
function CheckboxDemo(props: CheckboxProps) {
  const [checked, setChecked] = useState(props.checked)
  return <Checkbox {...props} checked={checked} onChange={setChecked} />
}

const meta = {
  title: '3. 컴포넌트/Selection/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    checked: false,
    label: '약관에 동의합니다',
    disabled: false,
    indeterminate: false,
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <CheckboxDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox checked label="Checked" />
      <Checkbox checked={false} label="Unchecked" />
      <Checkbox checked indeterminate label="Indeterminate" />
      <Checkbox checked disabled label="Disabled checked" />
      <Checkbox checked={false} disabled label="Disabled unchecked" />
    </div>
  ),
}
