import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrCvcField, type KrCvcFieldProps } from './KrCvcField'

// 컨트롤드 컴포넌트용 데모
function KrCvcFieldDemo(props: KrCvcFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrCvcField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/CVC',
  component: KrCvcField,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    label: 'CVC',
    disabled: false,
    error: false,
    helperText: '카드 뒷면 3자리',
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof KrCvcField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <KrCvcFieldDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 정상 — 마스킹 상태(눈 아이콘으로 표시 전환) */}
      <KrCvcFieldDemo value="123" onChange={() => {}} />
      <KrCvcFieldDemo value="12" onChange={() => {}} error helperText="CVC를 다시 확인해 주세요" />
      <KrCvcFieldDemo value="123" onChange={() => {}} disabled />
    </div>
  ),
}
