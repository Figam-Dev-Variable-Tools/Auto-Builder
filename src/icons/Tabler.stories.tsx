import type { Meta, StoryObj } from '@storybook/react'
import {
  IconBell,
  IconBook,
  IconCalendar,
  IconCamera,
  IconCloud,
  IconHeart,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconShoppingCart,
  IconStar,
  IconUser,
} from '@tabler/icons-react'
import { FIGMA_FILE } from '../shared/figma'

// Heroicons/Lucide와 동일한 인라인 SVG 컴포넌트 방식(currentColor stroke).
const ICONS = [
  ['IconBell', IconBell],
  ['IconBook', IconBook],
  ['IconCalendar', IconCalendar],
  ['IconCamera', IconCamera],
  ['IconMessageCircle', IconMessageCircle],
  ['IconCloud', IconCloud],
  ['IconSettings', IconSettings],
  ['IconHeart', IconHeart],
  ['IconHome', IconHome],
  ['IconShoppingCart', IconShoppingCart],
  ['IconStar', IconStar],
  ['IconUser', IconUser],
] as const

const meta = {
  title: 'Icons/Tabler (SVG)',
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
