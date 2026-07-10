import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../../shared/figma'
import { KrCarrierSelect, type KrCarrierSelectProps } from './KrCarrierSelect'

// 컨트롤드 컴포넌트용 데모
function CarrierDemo(props: KrCarrierSelectProps) {
  const [value, setValue] = useState(props.value)
  return <KrCarrierSelect {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/통신사 선택',
  component: KrCarrierSelect,
  tags: ['autodocs'],
  args: {
    value: 'SKT',
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof KrCarrierSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <CarrierDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrCarrierSelect value="KT" />
      <KrCarrierSelect value="LG U+ 알뜰폰" />
      <KrCarrierSelect value="SKT" disabled />
    </div>
  ),
}
