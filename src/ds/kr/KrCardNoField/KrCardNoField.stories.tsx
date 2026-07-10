import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrCardNoField, type KrCardNoFieldProps } from './KrCardNoField'

// 컨트롤드 컴포넌트용 데모
function KrCardNoFieldDemo(props: KrCardNoFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrCardNoField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/카드번호',
  component: KrCardNoField,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    label: '카드번호',
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof KrCardNoField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <KrCardNoFieldDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 입력 중 — 검증 전 */}
      <KrCardNoField value="4242-42" onChange={() => {}} />
      {/* Luhn 통과 → 성공 */}
      <KrCardNoField value="4242-4242-4242-4242" onChange={() => {}} />
      {/* Luhn 실패 → 에러 */}
      <KrCardNoField value="1234-5678-9012-3456" onChange={() => {}} />
      <KrCardNoField value="4242-4242-4242-4242" onChange={() => {}} disabled />
    </div>
  ),
}
