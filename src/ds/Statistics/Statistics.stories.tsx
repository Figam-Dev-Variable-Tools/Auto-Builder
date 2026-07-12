import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Statistics, type StatItem } from './Statistics'

const demoStats: StatItem[] = [
  { label: '월 매출', value: '₩4.2억', delta: 12.4, hint: '지난달 대비' },
  { label: '신규 가입', value: '1,824명', delta: 3.1, hint: '지난달 대비' },
  { label: '이탈률', value: '2.4%', delta: -0.8, hint: '지난달 대비' },
]

const meta = {
  title: '3. 컴포넌트/Data/Statistics',
  component: Statistics,
  tags: ['autodocs'],
  args: {
    items: demoStats,
    columns: 3,
  },
  argTypes: {
    items: { control: 'object' },
    columns: { control: 'inline-radio', options: [2, 3, 4] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Statistics>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Statistics
        columns={2}
        items={[
          { label: '총 방문자', value: '82,400명', delta: 5.2, hint: '지난주 대비' },
          { label: '전환율', value: '3.6%', delta: -1.4, hint: '지난주 대비' },
        ]}
      />
      <Statistics
        columns={4}
        items={[
          { label: '주문 수', value: '1,204건', delta: 8.1 },
          { label: '평균 객단가', value: '₩38,500', delta: 0 },
          { label: '취소율', value: '1.2%', delta: -0.3 },
          { label: '재구매율', value: '27%' },
        ]}
      />
    </div>
  ),
}
