import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { MultiSelect, type MultiSelectProps } from './MultiSelect'

const OPTIONS = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
  { value: 'jquery', label: 'jQuery (비활성)', disabled: true },
]

function Demo(props: MultiSelectProps) {
  const [values, setValues] = useState<string[]>(props.values)
  return <MultiSelect {...props} values={values} onChange={setValues} />
}

const meta = {
  title: '3. 컴포넌트/Input/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  args: {
    label: '사용 기술',
    values: [],
    options: OPTIONS,
    placeholder: '선택하세요',
    maxSelected: 3,
    disabled: false,
    helperText: '최대 3개까지 선택할 수 있습니다.',
  },
  argTypes: {
    onChange: { control: false },
    options: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 240 }}>
      <MultiSelect values={[]} options={OPTIONS} label="기본" />
      <MultiSelect values={['react', 'svelte']} options={OPTIONS} label="선택됨" />
      <MultiSelect values={['vue']} options={OPTIONS} label="비활성" disabled />
    </div>
  ),
}
