import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Carousel } from './Carousel'

const slideStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  color: 'var(--ds-color-bg)',
  fontFamily: 'var(--ds-font-family)',
  fontSize: 'var(--ds-font-size-xl)',
  fontWeight: 700,
}

const demoSlides = [
  <div key="1" style={{ ...slideStyle, background: 'var(--ds-color-primary)' }}>
    슬라이드 1
  </div>,
  <div key="2" style={{ ...slideStyle, background: 'var(--ds-color-success)' }}>
    슬라이드 2
  </div>,
  <div key="3" style={{ ...slideStyle, background: 'var(--ds-color-warning)' }}>
    슬라이드 3
  </div>,
]

const meta = {
  title: '3. 컴포넌트/Data/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  args: {
    slides: demoSlides,
    showDots: true,
    showArrows: true,
    loop: true,
    aspectRatio: '16 / 9',
  },
  argTypes: {
    slides: { control: false },
    index: { control: false },
    onIndexChange: { control: false },
    aspectRatio: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Carousel {...args} />
    </div>
  ),
}

const captionStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--ds-font-family)',
  fontSize: 'var(--ds-font-size-sm)',
  color: 'var(--ds-color-secondary)',
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 720 }}>
      <div>
        <p style={captionStyle}>화살표 없음</p>
        <Carousel slides={demoSlides} showArrows={false} />
      </div>
      <div>
        <p style={captionStyle}>도트 없음</p>
        <Carousel slides={demoSlides} showDots={false} />
      </div>
      <div>
        <p style={captionStyle}>loop 없음 — 끝에서 정지</p>
        <Carousel slides={demoSlides} loop={false} />
      </div>
      <div style={{ maxWidth: 200 }}>
        <p style={captionStyle}>정사각형 비율(1 / 1)</p>
        <Carousel slides={demoSlides} aspectRatio="1 / 1" />
      </div>
    </div>
  ),
}
