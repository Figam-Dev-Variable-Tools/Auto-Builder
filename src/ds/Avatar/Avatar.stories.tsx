import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Avatar } from './Avatar'

// 외부 URL 대신 inline SVG data URI (named color만 사용)
const demoImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" +
      "<rect width='64' height='64' fill='steelblue'/>" +
      "<circle cx='32' cy='24' r='11' fill='white'/>" +
      "<path d='M10 58c2-13 11-20 22-20s20 7 22 20z' fill='white'/>" +
      '</svg>'
  )

const meta = {
  title: '3. 컴포넌트/Data/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: '홍길동',
    size: 'md',
    shape: 'circle',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'rounded'] },
    status: { control: 'inline-radio', options: ['online', 'offline', 'busy'] },
    src: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 사이즈 4종 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="홍길동" size="sm" />
        <Avatar name="김민지" size="md" />
        <Avatar name="Jane Doe" size="lg" />
        <Avatar name="Alex Kim" size="xl" />
      </div>
      {/* 이니셜 vs 이미지 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="박서준" />
        <Avatar name="박서준" src={demoImage} />
        <Avatar name="박서준" src={demoImage} size="xl" />
      </div>
      {/* 상태 점 3종 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="온라인" status="online" />
        <Avatar name="오프라인" status="offline" />
        <Avatar name="바쁨" status="busy" />
      </div>
      {/* rounded */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="라운드" shape="rounded" />
        <Avatar name="Round Shape" shape="rounded" size="xl" src={demoImage} />
      </div>
    </div>
  ),
}
