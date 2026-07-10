import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Slider, type SliderProps } from './Slider'

// 컨트롤드 컴포넌트용 데모
function SliderDemo(props: SliderProps) {
  const [value, setValue] = useState(props.value)
  return <Slider {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Slider',
  component: Slider,
  tags: ['autodocs'],
  args: {
    label: '볼륨',
    value: 40,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    showValue: true,
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <SliderDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      <Slider label="최솟값" value={0} unit="%" />
      <Slider label="중간값" value={50} unit="%" />
      <Slider label="최댓값" value={100} unit="%" />
      <Slider label="가격" value={45000} min={0} max={100000} step={1000} unit="원" />
      <Slider label="비활성" value={30} unit="%" disabled />
      <Slider value={70} showValue={false} />
    </div>
  ),
}
