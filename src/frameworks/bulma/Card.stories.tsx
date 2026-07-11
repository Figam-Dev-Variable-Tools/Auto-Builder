import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showFooter: boolean
}

// 외부 이미지 대신 인라인 SVG 플레이스홀더 사용
function ImagePlaceholder({ height = 140, label = 'Image' }: { height?: number; label?: string }) {
  return (
    <svg width="100%" height={height} role="img" aria-label="Placeholder image">
      <rect width="100%" height="100%" fill="#7a7a7a" />
      <text x="50%" y="50%" fill="#f5f5f5" dy=".3em" textAnchor="middle">
        {label}
      </text>
    </svg>
  )
}

function AvatarPlaceholder({ initials = 'JS' }: { initials?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Placeholder avatar">
      <circle cx="24" cy="24" r="24" fill="#00d1b2" />
      <text
        x="50%"
        y="50%"
        fill="#fff"
        dy=".35em"
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
      >
        {initials}
      </text>
    </svg>
  )
}

const meta = {
  title: 'Frameworks/Bulma/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
    showImage: true,
    showFooter: true,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ maxWidth: 360 }}>
        {args.showImage && (
          <div className="card-image">
            <ImagePlaceholder height={160} />
          </div>
        )}
        <div className="card-content">
          <div className="media">
            <div className="media-left">
              <figure className="image is-48x48">
                <AvatarPlaceholder />
              </figure>
            </div>
            <div className="media-content">
              <p className="title is-5" style={{ marginBottom: '0.25rem' }}>
                {args.title}
              </p>
              <p className="subtitle is-6">@acme · Product team</p>
            </div>
          </div>
          <div className="content">
            {args.text} Ships with media block, tags and footer actions.
            <br />
            <time dateTime="2026-07-10">Jul 10, 2026</time>
          </div>
          <div className="tags">
            <span className="tag is-primary is-light">design</span>
            <span className="tag is-link is-light">release</span>
          </div>
          <button type="button" className="button is-primary is-fullwidth">
            {args.buttonLabel}
          </button>
        </div>
        {args.showFooter && (
          <footer className="card-footer">
            <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
              Save
            </a>
            <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
              Share
            </a>
            <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
              Cancel
            </a>
          </footer>
        )}
      </div>
    </FrameworkScope>
  ),
}

// 카드 구성 패턴 모음 — 참조 시트 룩(캔버스 + 카드) 구성
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Basic">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <div className="card-content">
              <p className="title is-5">Plain card</p>
              <p className="subtitle is-6">Just a card-content block</p>
              <div className="content">
                The simplest composition: a single content block with a title and some text.
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Image">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <div className="card-image">
              <ImagePlaceholder height={120} label="4:3 Image" />
            </div>
            <div className="card-content">
              <p className="title is-5">Image card</p>
              <div className="content">
                A card-image section on top, followed by a content block.
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Header & footer">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">Weekly report</p>
              <button type="button" className="card-header-icon" aria-label="More options">
                <span aria-hidden="true">⋯</span>
              </button>
            </header>
            <div className="card-content">
              <div className="content">
                A card-header with a title and icon button, plus footer actions below.
              </div>
            </div>
            <footer className="card-footer">
              <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
                Edit
              </a>
              <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
                Delete
              </a>
            </footer>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Media">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <div className="card-content">
              <div className="media">
                <div className="media-left">
                  <figure className="image is-48x48">
                    <AvatarPlaceholder initials="KO" />
                  </figure>
                </div>
                <div className="media-content">
                  <p className="title is-5" style={{ marginBottom: '0.25rem' }}>
                    Kim Onyu
                  </p>
                  <p className="subtitle is-6">@konyu</p>
                </div>
              </div>
              <div className="content">
                A media block inside card-content — the classic profile / comment layout.
              </div>
              <div className="buttons">
                <button type="button" className="button is-primary is-small">
                  Follow
                </button>
                <button type="button" className="button is-small">
                  Message
                </button>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
