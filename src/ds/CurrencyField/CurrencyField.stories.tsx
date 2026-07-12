import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { CurrencyField, type CurrencyFieldProps } from './CurrencyField'

function Demo(props: CurrencyFieldProps) {
  const [value, setValue] = useState(props.value)
  return <CurrencyField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Input/CurrencyField',
  component: CurrencyField,
  tags: ['autodocs'],
  args: {
    label: '금액',
    value: '',
    currency: '원',
    placeholder: '0',
    disabled: false,
    error: false,
    helperText: '이체할 금액을 입력하세요.',
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof CurrencyField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <CurrencyField value="1500000" />
      <Demo label="한도 5만원" value="" max={50000} helperText="최대 50,000원까지 입력됩니다." />
      <CurrencyField value="9900" currency="₩" label="구독료" readOnly />
      <CurrencyField value="120000" error helperText="잔액이 부족합니다." />
      <CurrencyField value="" disabled />
    </div>
  ),
}
