import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { EmailField, type EmailFieldProps } from './EmailField'

function Demo(props: EmailFieldProps) {
  const [value, setValue] = useState(props.value)
  return <EmailField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Input/EmailField',
  component: EmailField,
  tags: ['autodocs'],
  args: {
    label: '이메일',
    value: '',
    placeholder: 'name@example.com',
    validate: true,
    disabled: false,
    required: false,
    helperText: '업무용 이메일을 입력하세요.',
  },
  argTypes: {
    onChange: { control: false },
    onValidChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof EmailField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <EmailField value="" helperText="업무용 이메일을 입력하세요." />
      <EmailField value="user@example.com" validate={false} />
      <EmailField value="user@example.com" disabled />
      <EmailField value="" required />
    </div>
  ),
}
