import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Textarea, type TextareaProps } from './Textarea'

function Demo(props: TextareaProps) {
  const [value, setValue] = useState(props.value)
  return <Textarea {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    label: '문의 내용',
    value: '',
    placeholder: '내용을 입력하세요',
    rows: 3,
    maxLength: 500,
    showCounter: true,
    autoResize: true,
    error: false,
    disabled: false,
    required: false,
    helperText: '최대 500자까지 입력할 수 있습니다.',
  },
  argTypes: {
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Textarea label="기본" value="" placeholder="내용을 입력하세요" />
      <Textarea label="카운터" value="자동 높이와 카운터를 지원합니다." maxLength={100} showCounter />
      <Textarea label="에러" value="너무 짧은 내용" error helperText="10자 이상 입력하세요." />
      <Textarea label="읽기 전용" value="수정할 수 없는 내용입니다." readOnly />
      <Textarea label="비활성" value="" disabled placeholder="입력 불가" />
    </div>
  ),
}
