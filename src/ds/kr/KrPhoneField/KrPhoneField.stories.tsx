import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../../shared/figma'
import { KrCarrierSelect } from '../KrCarrierSelect/KrCarrierSelect'
import { KrPhoneField, type KrPhoneFieldProps } from './KrPhoneField'

// 본인인증 폼 데모 — 통신사 선택 + 휴대폰 번호
function PhoneAuthDemo(props: KrPhoneFieldProps) {
  const [carrier, setCarrier] = useState('SKT')
  const [phone, setPhone] = useState(props.value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-sm)',
            fontWeight: 500,
            color: 'var(--ds-color-text)',
          }}
        >
          통신사 선택
        </span>
        <KrCarrierSelect value={carrier} onChange={setCarrier} disabled={props.disabled} />
      </div>
      <KrPhoneField {...props} value={phone} onChange={setPhone} />
    </div>
  )
}

const meta = {
  title: '6. KR 컴포넌트/휴대폰 번호',
  component: KrPhoneField,
  tags: ['autodocs'],
  args: {
    label: '휴대폰 번호',
    value: '',
    validate: true,
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
    onValidChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof KrPhoneField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <PhoneAuthDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrPhoneField value="010-1234-5678" />
      <KrPhoneField value="012-3456-7890" />
      <KrPhoneField value="010-1234-5678" disabled />
    </div>
  ),
}
