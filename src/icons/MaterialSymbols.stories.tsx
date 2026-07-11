import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../shared/figma'
import { IconGallery } from './IconGallery'
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
import search from '@material-symbols/svg-400/outlined/search.svg?raw'
import del from '@material-symbols/svg-400/outlined/delete.svg?raw'
import edit from '@material-symbols/svg-400/outlined/edit.svg?raw'
import add from '@material-symbols/svg-400/outlined/add.svg?raw'
import remove from '@material-symbols/svg-400/outlined/remove.svg?raw'
import close from '@material-symbols/svg-400/outlined/close.svg?raw'
import check from '@material-symbols/svg-400/outlined/check.svg?raw'
import checkCircle from '@material-symbols/svg-400/outlined/check_circle.svg?raw'
import cancel from '@material-symbols/svg-400/outlined/cancel.svg?raw'
import warning from '@material-symbols/svg-400/outlined/warning.svg?raw'
import errorIcon from '@material-symbols/svg-400/outlined/error.svg?raw'
import info from '@material-symbols/svg-400/outlined/info.svg?raw'
import help from '@material-symbols/svg-400/outlined/help.svg?raw'
import mail from '@material-symbols/svg-400/outlined/mail.svg?raw'
import call from '@material-symbols/svg-400/outlined/call.svg?raw'
import locationOn from '@material-symbols/svg-400/outlined/location_on.svg?raw'
import schedule from '@material-symbols/svg-400/outlined/schedule.svg?raw'
import visibility from '@material-symbols/svg-400/outlined/visibility.svg?raw'
import visibilityOff from '@material-symbols/svg-400/outlined/visibility_off.svg?raw'
import lock from '@material-symbols/svg-400/outlined/lock.svg?raw'
import lockOpen from '@material-symbols/svg-400/outlined/lock_open.svg?raw'
import key from '@material-symbols/svg-400/outlined/key.svg?raw'
import link from '@material-symbols/svg-400/outlined/link.svg?raw'
import share from '@material-symbols/svg-400/outlined/share.svg?raw'
import attachFile from '@material-symbols/svg-400/outlined/attach_file.svg?raw'
import folder from '@material-symbols/svg-400/outlined/folder.svg?raw'
import description from '@material-symbols/svg-400/outlined/description.svg?raw'
import image from '@material-symbols/svg-400/outlined/image.svg?raw'
import playCircle from '@material-symbols/svg-400/outlined/play_circle.svg?raw'
import pauseCircle from '@material-symbols/svg-400/outlined/pause_circle.svg?raw'
import creditCard from '@material-symbols/svg-400/outlined/credit_card.svg?raw'
import redeem from '@material-symbols/svg-400/outlined/redeem.svg?raw'
import sell from '@material-symbols/svg-400/outlined/sell.svg?raw'
import bookmark from '@material-symbols/svg-400/outlined/bookmark.svg?raw'
import flag from '@material-symbols/svg-400/outlined/flag.svg?raw'
import menu from '@material-symbols/svg-400/outlined/menu.svg?raw'

// Material Symbols는 React 컴포넌트 패키지가 없어 SocialLoginButton과 동일한 ?raw 방식으로
// SVG 마크업을 인라인한다. 원본 SVG에 fill 속성이 없어(기본 black) CSS 모듈에서 fill:
// currentColor로 지정해 색을 상속시킨다 — Shadow DOM 등 격리 구조에서도 동작(KI-1 권장 인라인 SVG).
const RAW: ReadonlyArray<readonly [string, string]> = [
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
  ['search', search],
  ['delete', del],
  ['edit', edit],
  ['add', add],
  ['remove', remove],
  ['close', close],
  ['check', check],
  ['check_circle', checkCircle],
  ['cancel', cancel],
  ['warning', warning],
  ['error', errorIcon],
  ['info', info],
  ['help', help],
  ['mail', mail],
  ['call', call],
  ['location_on', locationOn],
  ['schedule', schedule],
  ['visibility', visibility],
  ['visibility_off', visibilityOff],
  ['lock', lock],
  ['lock_open', lockOpen],
  ['key', key],
  ['link', link],
  ['share', share],
  ['attach_file', attachFile],
  ['folder', folder],
  ['description', description],
  ['image', image],
  ['play_circle', playCircle],
  ['pause_circle', pauseCircle],
  ['credit_card', creditCard],
  ['redeem', redeem],
  ['sell', sell],
  ['bookmark', bookmark],
  ['flag', flag],
  ['menu', menu],
]

const ITEMS = RAW.map(
  ([name, svg]) =>
    [
      name,
      <span
        key={name}
        className={styles.icon}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />,
    ] as const,
)

const meta = {
  title: 'Icons/Material Symbols (SVG)',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <IconGallery items={ITEMS} />,
}
