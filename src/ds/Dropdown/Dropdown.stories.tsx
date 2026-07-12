import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Dropdown, type DropdownProps } from './Dropdown'

// 마지막 선택 항목을 표시하는 데모
function DropdownDemo(props: DropdownProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const items = props.items.map((item) => ({
    ...item,
    onSelect: () => setSelected(item.label),
  }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220 }}>
      <div>
        <Dropdown {...props} items={items} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--ds-color-secondary)' }}>
        선택: {selected ?? '없음'}
      </span>
    </div>
  )
}

const meta = {
  title: '3. 컴포넌트/Navigation/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  args: {
    label: '더보기',
    items: [
      { label: '복제' },
      { label: '이름 바꾸기' },
      { label: '공유', disabled: true },
      { label: '삭제', danger: true, divider: true },
    ],
    disabled: false,
    align: 'start',
  },
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DropdownDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Dropdown
        label="더보기"
        items={[
          { label: '복제' },
          { label: '이름 바꾸기' },
          { label: '삭제', danger: true, divider: true },
        ]}
      />
      <Dropdown
        label="정렬 기준"
        align="end"
        items={[
          { label: '최신순' },
          { label: '이름순' },
          { label: '수정일순', disabled: true },
        ]}
      />
      <Dropdown label="비활성" disabled items={[{ label: '복제' }]} />
    </div>
  ),
}
