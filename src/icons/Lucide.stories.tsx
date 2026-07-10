import type { Meta, StoryObj } from '@storybook/react'
import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Cloud,
  Heart,
  Home,
  MessageCircle,
  Settings,
  ShoppingCart,
  Star,
  User,
} from 'lucide-react'
import { FIGMA_FILE } from '../shared/figma'

// Heroicons와 동일한 인라인 SVG 컴포넌트 방식(currentColor stroke) — 외부 폰트·에셋이
// 없어 Shadow DOM 등 어떤 격리 구조에서도 동작한다(docs/known-issues.md KI-1 권장 방식).
const ICONS = [
  ['Bell', Bell],
  ['BookOpen', BookOpen],
  ['Calendar', Calendar],
  ['Camera', Camera],
  ['MessageCircle', MessageCircle],
  ['Cloud', Cloud],
  ['Settings', Settings],
  ['Heart', Heart],
  ['Home', Home],
  ['ShoppingCart', ShoppingCart],
  ['Star', Star],
  ['User', User],
] as const

const meta = {
  title: 'Icons/Lucide (SVG)',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      {ICONS.map(([name, Icon]) => (
        <div key={name}>
          <Icon size={24} style={{ margin: '0 auto' }} />
          <div>{name}</div>
        </div>
      ))}
    </div>
  ),
}
