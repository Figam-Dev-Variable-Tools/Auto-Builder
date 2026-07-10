import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrBizNoField, type KrBizNoFieldProps } from './KrBizNoField'

// 컨트롤드 컴포넌트용 데모
function BizNoDemo(props: KrBizNoFieldProps) {
  const [value, setValue] = useState(props.value)
  return <KrBizNoField {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '6. KR 컴포넌트/사업자등록번호',
  component: KrBizNoField,
  tags: ['autodocs'],
  args: {
    label: '사업자등록번호',
    value: '',
    disabled: false,
    helperText: '숫자 10자리를 입력하세요',
    onChange: () => {},
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '사업자등록번호 입력 필드. 123-45-67890 형태로 자동 포맷하고, 10자리 완성 시 국세청 검증식으로 체크한다. 유효 예시: 120-81-47521',
      },
    },
  },
} satisfies Meta<typeof KrBizNoField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <BizNoDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrBizNoField label="유효한 번호" value="120-81-47521" onChange={() => {}} />
      <KrBizNoField label="유효하지 않은 번호" value="123-45-67890" onChange={() => {}} />
      <KrBizNoField label="비활성" value="" onChange={() => {}} disabled />
    </div>
  ),
}
