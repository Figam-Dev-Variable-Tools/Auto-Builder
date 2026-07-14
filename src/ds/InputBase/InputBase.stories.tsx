import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DollarSign, Mail, Search } from 'lucide-react'
import { FIGMA_FILE } from '../../shared/figma'
import { InputBase, type InputBaseProps } from './InputBase'

function Demo(props: InputBaseProps) {
  const [value, setValue] = useState(props.value)
  return <InputBase {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Input/InputBase',
  component: InputBase,
  tags: ['autodocs'],
  args: {
    label: '이메일',
    value: '',
    placeholder: 'name@example.com',
    size: 'md',
    error: false,
    success: false,
    disabled: false,
    readOnly: false,
    required: false,
    showCounter: false,
    fullWidth: false,
  },
  argTypes: {
    onChange: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof InputBase>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

/**
 * 라벨을 생략하고 ariaLabel만 주는 법 — label이 없으면 라벨 자리 자체가 렌더되지 않는다
 * (빈 공간이 남지 않는다). 툴바·필터바처럼 라벨을 그릴 자리가 없는 곳에서 이렇게 쓴다.
 */
export const WithoutLabel: Story = {
  args: { label: undefined, ariaLabel: '검색어', placeholder: '검색어를 입력하세요' },
  render: (args) => <Demo {...args} />,
}

// 오너 지시 대표 스토리 — "오른쪽에 아이콘 넣을 수 있게"
export const TrailingIcon: Story = {
  args: { trailing: <DollarSign size={18} aria-hidden="true" /> },
  render: (args) => <Demo {...args} />,
}

export const LeadingIcon: Story = {
  args: { leading: <Search size={18} aria-hidden="true" /> },
  render: (args) => <Demo {...args} />,
}

export const BothIcons: Story = {
  args: {
    leading: <Mail size={18} aria-hidden="true" />,
    trailing: <DollarSign size={18} aria-hidden="true" />,
  },
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 320 }}>
      <InputBase label="에러" value="" error helperText="필수 입력 항목입니다." />
      <InputBase label="성공" value="ok@example.com" success helperText="사용 가능한 이메일입니다." />
      <InputBase label="비활성" value="비활성 값" disabled />
      <InputBase label="읽기전용" value="읽기 전용 값" readOnly />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 320 }}>
      <InputBase label="Small" value="" size="sm" placeholder="name@example.com" />
      <InputBase label="Medium" value="" size="md" placeholder="name@example.com" />
      <InputBase label="Large" value="" size="lg" placeholder="name@example.com" />
    </div>
  ),
}

export const Counter: Story = {
  args: { label: '소개', value: '', maxLength: 40, showCounter: true, placeholder: '내용을 입력해 주세요.' },
  render: (args) => <Demo {...args} />,
}

export const FullWidth: Story = {
  args: { fullWidth: true },
  render: (args) => (
    <div style={{ width: 480 }}>
      <Demo {...args} />
    </div>
  ),
}
