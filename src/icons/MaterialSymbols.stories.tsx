import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../shared/figma'
import styles from './MaterialSymbols.module.css'
import notifications from '@material-symbols/svg-400/outlined/notifications.svg?raw'
import book from '@material-symbols/svg-400/outlined/book_2.svg?raw'
import calendar from '@material-symbols/svg-400/outlined/calendar_month.svg?raw'
import camera from '@material-symbols/svg-400/outlined/photo_camera.svg?raw'
import chat from '@material-symbols/svg-400/outlined/chat.svg?raw'
import cloud from '@material-symbols/svg-400/outlined/cloud.svg?raw'
import settings from '@material-symbols/svg-400/outlined/settings.svg?raw'
import favorite from '@material-symbols/svg-400/outlined/favorite.svg?raw'
import home from '@material-symbols/svg-400/outlined/home.svg?raw'
import cart from '@material-symbols/svg-400/outlined/shopping_cart.svg?raw'
import star from '@material-symbols/svg-400/outlined/star.svg?raw'
import person from '@material-symbols/svg-400/outlined/person.svg?raw'

// Material Symbols는 React 컴포넌트 패키지가 없어 SocialLoginButton과 동일한 ?raw 방식으로
// SVG 마크업을 인라인한다. 원본 SVG에 fill 속성이 없어(기본 black) CSS 모듈에서 fill:
// currentColor로 지정해 색을 상속시킨다 — Shadow DOM 등 격리 구조에서도 동작(KI-1 권장 인라인 SVG).
const ICONS = [
  ['notifications', notifications],
  ['book_2', book],
  ['calendar_month', calendar],
  ['photo_camera', camera],
  ['chat', chat],
  ['cloud', cloud],
  ['settings', settings],
  ['favorite', favorite],
  ['home', home],
  ['shopping_cart', cart],
  ['star', star],
  ['person', person],
] as const

const meta = {
  title: 'Icons/Material Symbols (SVG)',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className={styles.grid}>
      {ICONS.map(([name, svg]) => (
        <div key={name}>
          <span
            className={styles.icon}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div>{name}</div>
        </div>
      ))}
    </div>
  ),
}
