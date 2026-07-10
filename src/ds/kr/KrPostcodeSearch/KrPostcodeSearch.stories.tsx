import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KrPostcodeSearch, type KrPostcodeSearchProps } from './KrPostcodeSearch'
import type { KrAddress } from '../addressData'

// 선택 결과까지 보여주는 컨트롤드 데모
function PostcodeDemo(props: KrPostcodeSearchProps) {
  const [address, setAddress] = useState<KrAddress | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>
      <KrPostcodeSearch {...props} postcode={address?.postcode ?? props.postcode} onSelect={setAddress} />
      {address && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--ds-color-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span>도로명: {address.road}</span>
          <span>지번: {address.jibun}</span>
        </div>
      )}
    </div>
  )
}

const meta = {
  title: '6. KR 컴포넌트/우편번호 조회',
  component: KrPostcodeSearch,
  tags: ['autodocs'],
  args: {
    label: '우편번호',
    postcode: '',
    disabled: false,
    error: false,
    helperText: '조회 버튼을 눌러 주소를 검색하세요',
    onSelect: () => {},
  },
  argTypes: {
    onSelect: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '우편번호 조회 필드. 실제 서비스에서는 카카오(다음) 우편번호 서비스를 embed하는 연동 지점이며, 이 컴포넌트는 동일한 UX(조회 버튼 → 검색 패널 → 선택 시 우편번호/도로명/지번 자동 입력)를 내장 샘플 데이터로 재현한 mock이다. 예: "테헤란" 또는 "판교"로 검색.',
      },
    },
  },
} satisfies Meta<typeof KrPostcodeSearch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <PostcodeDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KrPostcodeSearch postcode="06236" onSelect={() => {}} helperText="선택된 주소의 우편번호입니다" />
      <KrPostcodeSearch postcode="" onSelect={() => {}} error helperText="우편번호를 조회해주세요" />
      <KrPostcodeSearch postcode="" onSelect={() => {}} disabled helperText="비활성 상태" />
    </div>
  ),
}
