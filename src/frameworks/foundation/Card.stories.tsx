import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showFooter: boolean
}

const meta = {
  title: 'Frameworks/Foundation/Card',
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

// SVG 플레이스홀더 이미지
function PlaceholderImage({ height = 140 }: { height?: number }) {
  return (
    <svg width="100%" height={height} role="img" aria-label="Placeholder image">
      <rect width="100%" height="100%" fill="#8a8a8a" />
      <text x="50%" y="50%" fill="#e6e6e6" dy=".3em" textAnchor="middle">
        Image
      </text>
    </svg>
  )
}

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ width: '300px', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
        <div className="card-divider">
          <strong>Featured</strong>
          <span className="badge" style={{ marginLeft: 'auto' }}>
            3
          </span>
        </div>
        {args.showImage && <PlaceholderImage />}
        <div className="card-section">
          <h5 style={{ marginBottom: '0.25rem' }}>{args.title}</h5>
          <span className="label success">New</span>
          <p style={{ margin: '0.5rem 0' }}>{args.text}</p>
          <button type="button" className="button small" style={{ marginBottom: 0 }}>
            {args.buttonLabel}
          </button>
        </div>
        {args.showFooter && (
          <div className="card-section" style={{ borderTop: '1px solid #e6e6e6' }}>
            <small style={{ color: '#8a8a8a' }}>Updated just now</small>
          </div>
        )}
      </div>
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Basic">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-section">
              <p style={{ marginBottom: 0 }}>
                A simple card with a single section and nothing else.
              </p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Divider">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-divider">
              <strong>Card header</strong>
            </div>
            <div className="card-section">
              <p style={{ marginBottom: 0 }}>The divider acts as a header for the card body.</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Image">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ marginBottom: 0 }}>
            <PlaceholderImage height={100} />
            <div className="card-section">
              <h5 style={{ marginBottom: '0.25rem' }}>Photo card</h5>
              <p style={{ marginBottom: 0 }}>An image placeholder sits above the section.</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sections">
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-divider">
              <strong>Release notes</strong>
              <span className="badge alert" style={{ marginLeft: 'auto' }}>
                2
              </span>
            </div>
            <PlaceholderImage height={80} />
            <div className="card-section">
              <h5 style={{ marginBottom: '0.25rem' }}>v2.4 shipped</h5>
              <p style={{ margin: '0.25rem 0' }}>Dark mode and faster search are live.</p>
              <button type="button" className="button tiny" style={{ marginBottom: 0 }}>
                Read more
              </button>
            </div>
            <div className="card-section" style={{ borderTop: '1px solid #e6e6e6' }}>
              <small style={{ color: '#8a8a8a' }}>2 days ago</small>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
