import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Radio, type RadioProps } from './Radio'

// 컨트롤드 컴포넌트용 데모
function RadioDemo(props: RadioProps) {
  const [value, setValue] = useState(props.value)
  return <Radio {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Selection/Radio',
  component: Radio,
  tags: ['autodocs'],
  args: {
    options: [
      { value: 'email', label: '이메일' },
      { value: 'sms', label: '문자' },
      { value: 'push', label: '앱 푸시' },
    ],
    value: 'email',
    name: 'channel',
    direction: 'row',
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['row', 'column'] },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <RadioDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Radio
        name="states-row"
        value="selected"
        options={[
          { value: 'selected', label: 'Selected' },
          { value: 'unselected', label: 'Unselected' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]}
      />
      <Radio
        name="states-column"
        value="selected"
        direction="column"
        options={[
          { value: 'selected', label: 'Selected' },
          { value: 'unselected', label: 'Unselected' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]}
      />
    </div>
  ),
}
