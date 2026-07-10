import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { DatePicker, type DatePickerProps } from './DatePicker'

// 컨트롤드 컴포넌트용 데모
function DatePickerDemo(props: DatePickerProps) {
  const [value, setValue] = useState<Date | null>(props.value)
  return <DatePicker {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  args: {
    label: '날짜',
    value: null,
    placeholder: '날짜 선택',
    disabled: false,
    error: false,
  },
  argTypes: {
    value: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DatePickerDemo {...args} />,
}

const SELECTED = new Date(2026, 6, 10)

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DatePicker label="빈 값" value={null} />
      <DatePicker label="값 있음" value={SELECTED} helperText="예약일 기준 3일 전까지 변경 가능" />
      <DatePicker label="에러" value={null} error helperText="날짜를 선택해주세요" />
      <DatePicker label="비활성" value={SELECTED} disabled />
    </div>
  ),
}
