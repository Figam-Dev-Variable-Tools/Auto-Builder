import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showFooter: boolean
}

// Skeleton 에는 카드 컴포넌트가 없어 얇은 보더로 흉내낸다 (섀도 루트 안에서만 주입)
const cardCss = `
.sk-card {
  border: 1px solid #E1E1E1;
  border-radius: 4px;
  background: #fff;
  padding: 1.5rem;
}
.sk-card--raised {
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
.sk-card__eyebrow {
  text-transform: uppercase;
  letter-spacing: .1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #999;
  margin-bottom: .5rem;
}
.sk-card__meta {
  color: #888;
  font-size: 1.2rem;
}
.sk-card__footer {
  border-top: 1px solid #E1E1E1;
  margin-top: 1rem;
  padding-top: .75rem;
}
`

const meta = {
  title: 'Frameworks/Skeleton/Card',
  args: {
    title: 'Quarterly report',
    text: 'A lightweight summary of activity across all projects this quarter.',
    buttonLabel: 'Open report',
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
    <FrameworkScope styles={[normalize, skeleton, cardCss]}>
      <div className="sk-card sk-card--raised" style={{ maxWidth: 320 }}>
        <div className="sk-card__eyebrow">Report</div>
        <h5 style={{ marginBottom: '.5rem' }}>{args.title}</h5>
        <p style={{ marginBottom: '1.5rem' }}>{args.text}</p>
        <button type="button" className="button-primary" style={{ marginBottom: 0 }}>
          {args.buttonLabel}
        </button>
        {args.showFooter && <div className="sk-card__footer sk-card__meta">Updated just now</div>}
      </div>
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Plain">
        <FrameworkScope styles={[normalize, skeleton, cardCss]}>
          <div className="sk-card">
            <p style={{ marginBottom: 0 }}>
              A minimal bordered card. Just a thin border and generous whitespace.
            </p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="With heading">
        <FrameworkScope styles={[normalize, skeleton, cardCss]}>
          <div className="sk-card">
            <h5 style={{ marginBottom: '.5rem' }}>Heading</h5>
            <p className="sk-card__meta" style={{ marginBottom: '1rem' }}>
              Posted 2 days ago
            </p>
            <p style={{ marginBottom: 0 }}>Body copy sits below a small heading and meta line.</p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Footer actions">
        <FrameworkScope styles={[normalize, skeleton, cardCss]}>
          <div className="sk-card">
            <h5 style={{ marginBottom: '.5rem' }}>Invite team</h5>
            <p style={{ marginBottom: 0 }}>Share this workspace with your teammates.</p>
            <div
              className="sk-card__footer"
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}
            >
              <button type="button" className="button-primary" style={{ marginBottom: 0 }}>
                Invite
              </button>
              <a href="#" style={{ fontSize: '1.2rem' }} onClick={(e) => e.preventDefault()}>
                Maybe later
              </a>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
