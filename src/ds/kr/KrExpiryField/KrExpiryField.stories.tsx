import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrExpiryField, type KrExpiryFieldProps } from './KrExpiryField'

// 컨트롤드 컴포넌트용 데모
function KrExpiryFieldDemo(props: KrExpiryFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrExpiryField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/유효기간',
  component: KrExpiryField,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    label: '유효기간',
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof KrExpiryField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <KrExpiryFieldDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 정상 (MM 01~12) */}
      <KrExpiryField value="12/28" onChange={() => {}} />
      {/* 에러 (13월) */}
      <KrExpiryField value="13/28" onChange={() => {}} />
      <KrExpiryField value="12/28" onChange={() => {}} disabled />
    </div>
  ),
}
