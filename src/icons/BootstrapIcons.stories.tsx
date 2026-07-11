import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../shared/FrameworkScope'
import { FIGMA_FILE } from '../shared/figma'
import { IconGallery } from './IconGallery'
import css from 'bootstrap-icons/font/bootstrap-icons.css?inline'

// Known Issue KI-1: @font-face는 Shadow Root 내부 <style>에서 등록되지 않는 브라우저
// 제약이 있어, 폰트 선언 블록만 분리해 document 레벨에 1회 주입한다. 셀렉터가 없는
// @font-face 단독 주입이므로 전역 스타일 충돌은 발생하지 않는다(docs/known-issues.md).
const FONT_FACE = css.match(/@font-face\s*\{[^}]*\}/)?.[0] ?? ''
const GLYPHS = FONT_FACE ? css.replace(FONT_FACE, '') : css

function ensureIconFontRegistered() {
  if (document.head.querySelector('style[data-bootstrap-icons-font]')) return
  const style = document.createElement('style')
  style.setAttribute('data-bootstrap-icons-font', '')
  style.textContent = FONT_FACE
  document.head.appendChild(style)
}

const ICONS = [
  'alarm',
  'bell',
  'book',
  'calendar',
  'camera',
  'cart',
  'chat',
  'cloud',
  'gear',
  'heart',
  'house',
  'star',
  'search',
  'trash',
  'pencil',
  'plus',
  'dash',
  'x',
  'check',
  'check-circle',
  'x-circle',
  'exclamation-triangle',
  'info-circle',
  'question-circle',
  'envelope',
  'telephone',
  'geo-alt',
  'clock',
  'eye',
  'eye-slash',
  'lock',
  'unlock',
  'key',
  'link',
  'share',
  'paperclip',
  'folder',
  'file-text',
  'image',
  'play-circle',
  'pause-circle',
  'credit-card',
  'gift',
  'tag',
  'bookmark',
  'flag',
  'list',
  'chevron-down',
]

const ITEMS = ICONS.map(
  (name) => [name, <i key={name} className={`bi bi-${name}`} style={{ fontSize: 24 }} />] as const,
)

const meta = {
  title: 'Icons/Bootstrap Icons',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    ensureIconFontRegistered()
    return (
      <IconGallery
        items={ITEMS}
        renderGrid={(children) => <FrameworkScope styles={[GLYPHS]}>{children}</FrameworkScope>}
      />
    )
  },
}
