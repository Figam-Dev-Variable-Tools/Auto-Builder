import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Calendar, type CalendarProps } from './Calendar'

// 컨트롤드 컴포넌트용 데모
function CalendarDemo(props: CalendarProps) {
  const [value, setValue] = useState<Date | null>(props.value ?? null)
  return <Calendar {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Date & Time/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  args: {
    value: null,
    disabled: false,
  },
  argTypes: {
    value: { control: false },
    month: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <CalendarDemo {...args} />,
}

const SELECTED = new Date(2026, 6, 10)

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13 }}>선택됨 + 오늘 링</span>
        <Calendar value={SELECTED} month={SELECTED} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13 }}>min/max 제한 (7.5 ~ 7.20)</span>
        <Calendar
          month={SELECTED}
          minDate={new Date(2026, 6, 5)}
          maxDate={new Date(2026, 6, 20)}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13 }}>비활성</span>
        <Calendar value={SELECTED} month={SELECTED} disabled />
      </div>
    </div>
  ),
}
