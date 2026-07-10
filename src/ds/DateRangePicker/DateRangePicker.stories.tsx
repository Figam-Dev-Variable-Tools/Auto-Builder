import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { DateRangePicker, type DateRangePickerProps } from './DateRangePicker'

// 컨트롤드 컴포넌트용 데모
function DateRangePickerDemo(props: DateRangePickerProps) {
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: props.start,
    end: props.end,
  })
  return <DateRangePicker {...props} start={range.start} end={range.end} onChange={setRange} />
}

const meta = {
  title: '3. 컴포넌트/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  args: {
    label: '기간',
    start: null,
    end: null,
    disabled: false,
  },
  argTypes: {
    start: { control: false },
    end: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof DateRangePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DateRangePickerDemo {...args} />,
}

const START = new Date(2026, 6, 1)
const END = new Date(2026, 6, 15)

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DateRangePicker label="빈 값" start={null} end={null} />
      <DateRangePicker label="시작일만" start={START} end={null} helperText="종료일을 선택해주세요" />
      <DateRangePicker label="기간 선택됨" start={START} end={END} />
      <DateRangePicker label="비활성" start={START} end={END} disabled />
    </div>
  ),
}
