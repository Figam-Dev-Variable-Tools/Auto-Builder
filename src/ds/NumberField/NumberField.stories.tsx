import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { NumberField, type NumberFieldProps } from './NumberField'

function Demo(props: NumberFieldProps) {
  const [value, setValue] = useState(props.value)
  return <NumberField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Input/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  args: {
    label: '수량',
    value: 1,
    min: 0,
    max: 99,
    step: 1,
    unit: '개',
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Demo label="수량" value={1} min={0} max={99} unit="개" />
      <Demo label="할인율" value={10} min={0} max={100} step={5} unit="%" />
      <NumberField label="고정값" value={42} readOnly />
      <NumberField label="비활성" value={0} disabled />
    </div>
  ),
}
