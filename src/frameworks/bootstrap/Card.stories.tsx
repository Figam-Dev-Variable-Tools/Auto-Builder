import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showHeader: boolean
  showImage: boolean
  showFooter: boolean
}

// 외부 이미지 없이 쓰는 플레이스홀더 SVG
function PlaceholderImg({
  className,
  height = 140,
  label = 'Image cap',
}: {
  className?: string
  height?: number | string
  label?: string
}) {
  return (
    <svg
      className={className}
      width="100%"
      height={height}
      role="img"
      aria-label="Placeholder image"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="100%" height="100%" fill="#868e96" />
      <text x="50%" y="50%" fill="#dee2e6" dy=".3em" textAnchor="middle">
        {label}
      </text>
    </svg>
  )
}

const meta = {
  title: 'Frameworks/Bootstrap/Card',
  args: {
    title: 'Realtime dashboard templates',
    text: 'Production-ready dashboard layouts with charts, tables and filters you can drop into any project.',
    buttonLabel: 'Preview',
    showHeader: true,
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
      <div className="card shadow-sm" style={{ width: '20rem' }}>
        {args.showHeader && (
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Featured</span>
            <span className="badge text-bg-primary">New</span>
          </div>
        )}
        {args.showImage && <PlaceholderImg className="card-img-top" />}
        <div className="card-body">
          <h5 className="card-title mb-1">{args.title}</h5>
          <p className="card-subtitle text-body-secondary small mb-2">
            Updated 2 days ago · 4 min read
          </p>
          <p className="card-text">{args.text}</p>
          <div className="mb-3">
            <span className="badge text-bg-secondary me-1">React</span>
            <span className="badge text-bg-secondary me-1">Charts</span>
            <span className="badge text-bg-secondary">Bootstrap 5</span>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-primary">
              {args.buttonLabel}
            </button>
            <button type="button" className="btn btn-outline-secondary">
              Save for later
            </button>
          </div>
        </div>
        {args.showFooter && (
          <div className="card-footer text-body-secondary small">
            By Design Systems team · 1.2k views
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
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Basic card</h5>
              <p className="card-text">
                Some quick example text to build on the card title and make up the bulk of the
                content.
              </p>
              <a href="#" className="btn btn-primary" onClick={(e) => e.preventDefault()}>
                Go somewhere
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Header & Footer">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <div className="card-header">Header</div>
            <div className="card-body">
              <h5 className="card-title">Header + footer</h5>
              <p className="card-text">Cards can hold a header and footer around the body content.</p>
            </div>
            <div className="card-footer text-body-secondary">2 days ago</div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Image Top">
        <FrameworkScope styles={[css]}>
          <div className="card">
            <PlaceholderImg className="card-img-top" height={110} />
            <div className="card-body">
              <h5 className="card-title">Image top</h5>
              <p className="card-text">The classic image-cap layout with a call to action.</p>
              <a href="#" className="card-link" onClick={(e) => e.preventDefault()}>
                Card link
              </a>
              <a href="#" className="card-link" onClick={(e) => e.preventDefault()}>
                Another link
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Horizontal" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="card" style={{ maxWidth: '34rem' }}>
            <div className="row g-0">
              <div className="col-4">
                <PlaceholderImg className="rounded-start h-100" height={160} label="Image" />
              </div>
              <div className="col-8">
                <div className="card-body">
                  <h5 className="card-title">Horizontal card</h5>
                  <p className="card-text">
                    Using a grid row with no gutters places the image beside the body.
                  </p>
                  <p className="card-text">
                    <small className="text-body-secondary">Last updated 3 mins ago</small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Background" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap gap-3">
            {(['primary', 'success', 'danger', 'dark'] as const).map((variant) => (
              <div key={variant} className={`card text-bg-${variant}`} style={{ width: '13rem' }}>
                <div className="card-body">
                  <h6 className="card-title">{variant} card</h6>
                  <p className="card-text small mb-0">Filled with text-bg-{variant}.</p>
                </div>
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Border" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap gap-3">
            {(['primary', 'success', 'warning', 'danger'] as const).map((variant) => (
              <div key={variant} className={`card border-${variant}`} style={{ width: '13rem' }}>
                <div className={`card-body text-${variant}`}>
                  <h6 className="card-title">border-{variant}</h6>
                  <p className="card-text small mb-0">Outlined card with matching text color.</p>
                </div>
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
