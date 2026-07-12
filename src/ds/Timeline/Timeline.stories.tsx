import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Timeline, type TimelineItem } from './Timeline'

const orderItems: TimelineItem[] = [
  {
    id: 'ordered',
    title: '주문 접수',
    time: '오전 9:12',
    description: '주문이 정상적으로 접수되었습니다.',
    status: 'done',
  },
  {
    id: 'paid',
    title: '결제 완료',
    time: '오전 9:13',
    description: '카드 결제가 완료되었습니다.',
    status: 'done',
  },
  {
    id: 'shipping',
    title: '배송 중',
    time: '오후 2:40',
    description: '상품이 배송지로 이동하고 있습니다.',
    status: 'active',
  },
  {
    id: 'delivered',
    title: '배송 완료',
    status: 'pending',
  },
]

const meta = {
  title: '3. 컴포넌트/Data/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  args: {
    items: orderItems,
  },
  argTypes: {
    items: { control: 'object' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
      <Timeline
        items={[
          {
            id: 'done',
            title: '완료 단계',
            time: '오전 10:00',
            description: '설명과 시간이 모두 있는 항목입니다.',
            status: 'done',
          },
          { id: 'active', title: '진행 중 단계', time: '오전 11:00', status: 'active' },
          { id: 'pending', title: '대기 단계', status: 'pending' },
        ]}
      />
      <Timeline
        items={[
          { id: 'title-only', title: '제목만 있는 항목' },
          { id: 'with-time', title: '시간이 있는 항목', time: '어제' },
        ]}
      />
    </div>
  ),
}
