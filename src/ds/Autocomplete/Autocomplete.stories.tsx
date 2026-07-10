import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Autocomplete, type AutocompleteProps } from './Autocomplete'

const FRUITS = [
  '사과',
  '사과주스',
  '바나나',
  '오렌지',
  '오렌지주스',
  '포도',
  '복숭아',
  '수박',
  '딸기',
  '딸기우유',
  '멜론',
  '자몽',
]

function Demo(props: AutocompleteProps) {
  const [value, setValue] = useState(props.value)
  return <Autocomplete {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  args: {
    label: '상품 검색',
    value: '',
    options: FRUITS,
    placeholder: '입력하여 검색',
    disabled: false,
    error: false,
    maxSuggestions: 8,
    helperText: '두 글자 이상 입력하면 후보가 표시됩니다.',
  },
  argTypes: {
    onChange: { control: false },
    onSelect: { control: false },
    options: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Autocomplete>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 200 }}>
      <Autocomplete value="" options={FRUITS} label="기본" />
      <Autocomplete value="사과" options={FRUITS} label="값 있음" />
      <Autocomplete value="" options={FRUITS} label="비활성" disabled />
    </div>
  ),
}
