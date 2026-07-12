import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Chip } from './Chip'

const FILTERS = ['전체', '식비', '교통', '쇼핑']

// 멀티 토글 필터 데모
function ChipFilterDemo({ size, disabled }: { size?: 'sm' | 'md'; disabled?: boolean }) {
  const [selected, setSelected] = useState<string[]>(['전체'])
  const toggle = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]))
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {FILTERS.map((name) => (
        <Chip
          key={name}
          label={name}
          size={size}
          disabled={disabled}
          selected={selected.includes(name)}
          onSelect={() => toggle(name)}
        />
      ))}
    </div>
  )
}

const starIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M6 0.8L7.5 4L11 4.4L8.4 6.8L9.1 10.3L6 8.5L2.9 10.3L3.6 6.8L1 4.4L4.5 4Z" />
  </svg>
)

const meta = {
  title: '3. 컴포넌트/Selection/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: {
    label: '식비',
    selected: false,
    disabled: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    onSelect: { control: false },
    onRemove: { control: false },
    leading: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <ChipFilterDemo size={args.size} disabled={args.disabled} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip label="기본" />
      <Chip label="선택됨" selected />
      <Chip label="삭제 가능" onRemove={() => {}} />
      <Chip label="아이콘" leading={starIcon} />
      <Chip label="비활성" disabled />
      <Chip label="작은 칩" size="sm" />
    </div>
  ),
}
