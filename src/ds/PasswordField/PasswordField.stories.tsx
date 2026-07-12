import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { PasswordField, type PasswordFieldProps } from './PasswordField'

function Demo(props: PasswordFieldProps) {
  const [value, setValue] = useState(props.value)
  return <PasswordField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Input/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  args: {
    label: '비밀번호',
    value: '',
    placeholder: '비밀번호를 입력하세요',
    error: false,
    success: false,
    disabled: false,
    required: false,
    showToggle: true,
    helperText: '8자 이상, 영문·숫자·특수문자 조합',
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PasswordField value="" helperText="8자 이상, 영문·숫자·특수문자 조합" />
      <PasswordField value="hunter2!" />
      <PasswordField value="1234" error helperText="비밀번호가 너무 짧습니다." />
      <PasswordField value="Str0ng!Pass" success helperText="사용 가능한 비밀번호입니다." />
      <PasswordField value="hunter2!" disabled />
      <PasswordField value="" required label="비밀번호" />
    </div>
  ),
}
