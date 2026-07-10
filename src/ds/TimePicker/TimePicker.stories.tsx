import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { TimePicker, type TimePickerProps } from './TimePicker'

// 컨트롤드 컴포넌트용 데모
function TimePickerDemo(props: TimePickerProps) {
  const [value, setValue] = useState(props.value)
  return <TimePicker {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  args: {
    label: '시간',
    value: '',
    minuteStep: 5,
    disabled: false,
  },
  argTypes: {
    minuteStep: { control: 'inline-radio', options: [5, 10, 15, 30] },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof TimePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <TimePickerDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TimePicker label="빈 값" value="" />
      <TimePicker label="값 있음" value="09:30" helperText="영업시간 내에서 선택해주세요" />
      <TimePicker label="30분 단위" value="14:30" minuteStep={30} />
      <TimePicker label="비활성" value="09:30" disabled />
    </div>
  ),
}
