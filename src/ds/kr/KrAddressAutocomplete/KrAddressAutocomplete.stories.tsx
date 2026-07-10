import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrAddressAutocomplete, type KrAddressAutocompleteProps } from './KrAddressAutocomplete'
import type { KrAddress } from '../addressData'

// 선택 결과까지 보여주는 컨트롤드 데모
function AutocompleteDemo(props: KrAddressAutocompleteProps) {
  const [value, setValue] = useState(props.value)
  const [selected, setSelected] = useState<KrAddress | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 340, minWidth: 320 }}>
      <KrAddressAutocomplete {...props} value={value} onChange={setValue} onSelect={setSelected} />
      {selected && (
        <span style={{ fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          우편번호 {selected.postcode} · 지번 {selected.jibun}
        </span>
      )}
    </div>
  )
}

const meta = {
  title: '6. KR 컴포넌트/주소 자동완성',
  component: KrAddressAutocomplete,
  tags: ['autodocs'],
  args: {
    label: '주소',
    value: '',
    disabled: false,
    error: false,
    helperText: '도로명·지번·건물명으로 검색할 수 있어요 (예: 테헤란, 판교)',
    onChange: () => {},
  },
  argTypes: {
    onChange: { control: false },
    onSelect: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '주소 자동완성 필드. 입력값으로 내장 샘플 주소를 필터해 드롭다운으로 제안하며, 방향키/Enter 선택과 Escape·바깥 클릭 닫기를 지원한다. 실제 서비스에서는 주소 검색 API 연동 지점의 mock.',
      },
    },
  },
} satisfies Meta<typeof KrAddressAutocomplete>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <AutocompleteDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrAddressAutocomplete
        label="선택 완료"
        value="서울 강남구 테헤란로 152"
        onChange={() => {}}
        helperText="드롭다운에서 선택된 도로명 주소"
      />
      <KrAddressAutocomplete
        label="에러"
        value=""
        onChange={() => {}}
        error
        helperText="주소를 검색해 선택해주세요"
      />
      <KrAddressAutocomplete label="비활성" value="" onChange={() => {}} disabled />
    </div>
  ),
}
