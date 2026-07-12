import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { OtpField, type OtpFieldProps } from './OtpField'

function Demo(props: OtpFieldProps) {
  const [value, setValue] = useState(props.value)
  const [done, setDone] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <OtpField {...props} value={value} onChange={setValue} onComplete={setDone} />
      {done && (
        <span style={{ fontFamily: 'var(--ds-font-family)', fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-color-success)' }}>
          입력 완료: {done}
        </span>
      )}
    </div>
  )
}

const meta = {
  title: '3. 컴포넌트/Input/OtpField',
  component: OtpField,
  tags: ['autodocs'],
  args: {
    label: '인증번호',
    value: '',
    length: 6,
    error: false,
    disabled: false,
    helperText: '문자로 받은 6자리 숫자를 입력하세요.',
  },
  argTypes: {
    length: { control: { type: 'number', min: 4, max: 8 } },
    onChange: { control: false },
    onComplete: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof OtpField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <OtpField value="" />
      <OtpField value="123" />
      <OtpField value="123456" error helperText="인증번호가 일치하지 않습니다." />
      <OtpField value="12" length={4} label="PIN" />
      <OtpField value="" disabled />
    </div>
  ),
}
