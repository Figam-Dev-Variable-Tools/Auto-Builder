import type { MouseEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
}

// 데모 링크 이동 방지
const noNav = (e: MouseEvent) => e.preventDefault()

const meta = {
  title: 'Frameworks/Materialize/Card',
  args: {
    title: 'Alpine Lake',
    text: 'Quiet trails and lakeside cabins for a weekend escape, curated by local guides.',
    buttonLabel: 'Read more',
    showImage: true,
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
      <div className="card hoverable" style={{ width: '300px' }}>
        {args.showImage && (
          <div className="card-image">
            <svg
              width="100%"
              height="140"
              role="img"
              aria-label="Placeholder image"
              style={{ display: 'block' }}
            >
              <rect width="100%" height="100%" fill="#78909c" />
              <circle cx="82%" cy="32" r="16" fill="#eceff1" />
              <polygon points="0,140 110,55 220,140" fill="#546e7a" />
              <polygon points="150,140 240,80 330,140" fill="#607d8b" />
            </svg>
            <span className="card-title">{args.title}</span>
          </div>
        )}
        <div className="card-content">
          {!args.showImage && <span className="card-title">{args.title}</span>}
          <p>{args.text}</p>
          <div style={{ marginTop: '12px' }}>
            <div className="chip">Guide</div>
            <div className="chip">Outdoors</div>
          </div>
        </div>
        <div className="card-action">
          <a href="#" onClick={noNav}>
            {args.buttonLabel}
          </a>
          <a href="#" onClick={noNav}>
            Share
          </a>
        </div>
      </div>
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Panels">
        <FrameworkScope styles={[css]}>
          <div>
            <div className="card-panel blue lighten-5" style={{ margin: '0 0 12px' }}>
              A simple card panel for plain text content, without title or actions.
            </div>
            <div className="card-panel teal lighten-5" style={{ margin: 0 }}>
              Tint panels with any Materialize color class.
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Image">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-image">
              <svg
                width="100%"
                height="120"
                role="img"
                aria-label="Placeholder image"
                style={{ display: 'block' }}
              >
                <rect width="100%" height="100%" fill="#26a69a" />
                <circle cx="50%" cy="60" r="28" fill="#b2dfdb" />
              </svg>
              <span className="card-title">Harbor</span>
            </div>
            <div className="card-content">
              <p>Image cards overlay the title on the media area.</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Actions">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-content">
              <span className="card-title">Weekly report</span>
              <p>Traffic is up 12% compared to last week.</p>
            </div>
            <div className="card-action">
              <a href="#" onClick={noNav}>
                Download
              </a>
              <a href="#" onClick={noNav}>
                Share
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Horizontal">
        <FrameworkScope styles={[css]}>
          <div className="card horizontal" style={{ margin: 0 }}>
            <div className="card-image">
              <svg
                width="110"
                height="150"
                role="img"
                aria-label="Placeholder image"
                style={{ display: 'block' }}
              >
                <rect width="100%" height="100%" fill="#8d6e63" />
                <circle cx="55" cy="60" r="22" fill="#d7ccc8" />
              </svg>
            </div>
            <div className="card-stacked">
              <div className="card-content">
                <p>Horizontal cards place the media beside the content.</p>
              </div>
              <div className="card-action">
                <a href="#" onClick={noNav}>
                  Open
                </a>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Badge">
        <FrameworkScope styles={[css]}>
          <div className="card small" style={{ margin: 0 }}>
            <div className="card-content">
              <span className="card-title">
                Inbox{' '}
                <span className="new badge" data-badge-caption="new">
                  4
                </span>
              </span>
              <p>Four new messages arrived while you were away.</p>
            </div>
            <div className="card-action">
              <a href="#" onClick={noNav}>
                View all
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
