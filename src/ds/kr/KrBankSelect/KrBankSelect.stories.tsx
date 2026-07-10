import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrBankSelect, type KrBankSelectProps } from './KrBankSelect'

// 컨트롤드 컴포넌트용 데모
function KrBankSelectDemo(props: KrBankSelectProps) {
  const [value, setValue] = useState(props.value)
  return <KrBankSelect {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/은행 선택',
  component: KrBankSelect,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    disabled: false,
    label: '은행',
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof KrBankSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <KrBankSelectDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 260 }}>
      <KrBankSelectDemo value="" onChange={() => {}} label="은행 (미선택)" />
      <KrBankSelect value="카카오뱅크" onChange={() => {}} label="은행 (선택됨)" />
      <KrBankSelect value="신한" onChange={() => {}} disabled label="은행 (비활성)" />
    </div>
  ),
}
