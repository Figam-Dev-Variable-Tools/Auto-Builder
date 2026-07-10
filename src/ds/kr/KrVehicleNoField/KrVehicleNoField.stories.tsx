import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../../shared/figma'
import { KrVehicleNoField, type KrVehicleNoFieldProps } from './KrVehicleNoField'

// 컨트롤드 컴포넌트용 데모
function VehicleNoDemo(props: KrVehicleNoFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrVehicleNoField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/차량번호',
  component: KrVehicleNoField,
  tags: ['autodocs'],
  args: {
    label: '차량번호',
    value: '',
    validate: true,
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof KrVehicleNoField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <VehicleNoDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrVehicleNoField value="12가3456" />
      <KrVehicleNoField value="12가34567" />
      <KrVehicleNoField value="12가3456" disabled />
    </div>
  ),
}
