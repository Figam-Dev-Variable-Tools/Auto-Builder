import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { SearchField, type SearchFieldProps } from './SearchField'

function Demo(props: SearchFieldProps) {
  const [value, setValue] = useState(props.value)
  const [submitted, setSubmitted] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SearchField {...props} value={value} onChange={setValue} onSearch={setSubmitted} />
      {submitted && (
        <span style={{ fontFamily: 'var(--ds-font-family)', fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-color-secondary)' }}>
          검색: {submitted}
        </span>
      )}
    </div>
  )
}

const meta = {
  title: '3. 컴포넌트/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  args: {
    value: '',
    placeholder: '검색어를 입력하세요',
    disabled: false,
    showClear: true,
  },
  argTypes: {
    onChange: { control: false },
    onSearch: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Demo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SearchField value="" />
      <SearchField value="디자인 토큰" />
      <SearchField value="" label="문서 검색" placeholder="키워드" />
      <SearchField value="비활성" disabled />
    </div>
  ),
}
