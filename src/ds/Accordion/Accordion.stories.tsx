import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Accordion, type AccordionItem } from './Accordion'

const faqItems: AccordionItem[] = [
  {
    id: 'faq1',
    title: '배송은 얼마나 걸리나요?',
    content:
      '평일 오후 2시 이전 주문은 당일 출고되며, 보통 1~2일 내에 도착합니다. 도서 산간 지역은 2~3일이 더 소요될 수 있습니다.',
  },
  {
    id: 'faq2',
    title: '교환·환불은 어떻게 하나요?',
    content:
      '상품 수령 후 7일 이내에 마이페이지 > 주문 내역에서 신청할 수 있습니다. 단순 변심의 경우 왕복 배송비가 부과됩니다.',
  },
  {
    id: 'faq3',
    title: '회원 등급 혜택이 궁금해요.',
    content:
      '최근 3개월 구매 금액에 따라 등급이 산정되며, 등급별로 적립률과 무료 배송 쿠폰이 차등 지급됩니다.',
  },
  {
    id: 'faq4',
    title: '해외 배송도 가능한가요?',
    content: '현재 준비 중인 서비스입니다.',
    disabled: true,
  },
]

const meta = {
  title: '3. 컴포넌트/Layout/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  args: {
    items: faqItems,
    multiple: false,
    defaultOpenIds: ['faq1'],
  },
  argTypes: {
    items: { control: false },
    defaultOpenIds: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// 열림/닫힘 상태는 컴포넌트 내부 state — args 스토리 자체가 인터랙티브 데모
export const Default: Story = {
  render: (args) => (
    <div style={{ width: 420 }}>
      <Accordion {...args} />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 420 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          단일 열림(기본) + 비활성 항목
        </p>
        <Accordion items={faqItems} defaultOpenIds={['faq1']} />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          multiple — 여러 항목 동시 열림
        </p>
        <Accordion items={faqItems} multiple defaultOpenIds={['faq1', 'faq2']} />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          모두 닫힘
        </p>
        <Accordion items={faqItems.slice(0, 3)} />
      </div>
    </div>
  ),
}
