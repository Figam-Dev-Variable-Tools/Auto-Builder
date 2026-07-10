import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../../shared/figma'
import { KrRrnField, type KrRrnFieldProps } from './KrRrnField'

// 컨트롤드 컴포넌트용 데모 — value 는 숫자 원본만 보관
function RrnDemo(props: KrRrnFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrRrnField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/주민등록번호',
  component: KrRrnField,
  tags: ['autodocs'],
  args: {
    value: '',
    foreigner: false,
    validate: true,
    disabled: false,
  },
  argTypes: {
    onChange: { control: false },
    label: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof KrRrnField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <RrnDemo {...args} />,
}

export const Foreigner: Story = {
  args: { foreigner: true },
  render: (args) => <RrnDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrRrnField value="9001012345678" />
      <KrRrnField value="9013011234567" />
      <KrRrnField value="9001012345678" disabled />
      <KrRrnField value="9001015234567" foreigner />
    </div>
  ),
}
