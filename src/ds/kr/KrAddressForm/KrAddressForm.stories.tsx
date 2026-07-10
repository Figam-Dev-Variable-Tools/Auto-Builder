import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Card } from '../../Card/Card'
import { Button } from '../../Button/Button'
import {
  KrAddressForm,
  EMPTY_KR_ADDRESS,
  type KrAddressFormProps,
  type KrAddressFormValue,
} from './KrAddressForm'

// 실제 배송지 입력 카드처럼 구성한 데모 — 저장 시 상세주소 필수 검증
function DeliveryCardDemo(props: KrAddressFormProps) {
  const [value, setValue] = useState(props.value)
  const [submitted, setSubmitted] = useState(false)
  const detailError = submitted && value.detail.trim() === ''

  return (
    <Card title="배송지 입력">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <KrAddressForm {...props} value={value} onChange={setValue} detailError={detailError} />
        {/* DS Button은 onClick 미지원이라 데모에서는 래퍼 span으로 클릭을 받는다 */}
        <span onClick={() => setSubmitted(true)}>
          <Button variant="primary" size="md" label="배송지 저장" />
        </span>
      </div>
    </Card>
  )
}

const filled: KrAddressFormValue = {
  postcode: '06236',
  road: '서울 강남구 테헤란로 152',
  jibun: '서울 강남구 역삼동 737',
  detail: '강남파이낸스센터 27층',
  request: '문 앞에 놓아주세요',
  requestNote: '',
}

const meta = {
  title: '6. KR 컴포넌트/주소 입력',
  component: KrAddressForm,
  tags: ['autodocs'],
  args: {
    value: EMPTY_KR_ADDRESS,
    withRequest: true,
    detailError: false,
    disabled: false,
    onChange: () => {},
  },
  argTypes: {
    onChange: { control: false },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '배송지 입력 composite. 우편번호 조회(카카오 우편번호 서비스 연동 지점의 mock)로 우편번호/도로명/지번이 자동 입력되고, 탭으로 도로명·지번 표시를 전환한다. 상세주소는 직접 입력, 배송 요청사항은 선택형이며 "직접 입력" 선택 시 textarea가 열린다.',
      },
    },
  },
} satisfies Meta<typeof KrAddressForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DeliveryCardDemo {...args} />,
}

// 상세주소 필수 미입력 에러
export const DetailError: Story = {
  args: {
    value: { ...filled, detail: '', request: '', requestNote: '' },
    withRequest: false,
    detailError: true,
  },
}

export const Disabled: Story = {
  args: {
    value: filled,
    disabled: true,
  },
}
