import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showActions: boolean
}

function Placeholder({ height = 140, label = 'Image' }: { height?: number; label?: string }) {
  return (
    <svg width="100%" height={height} role="img" aria-label="Placeholder image">
      <rect width="100%" height="100%" fill="#767676" />
      <text x="50%" y="50%" fill="#eeeeee" dy=".3em" textAnchor="middle">
        {label}
      </text>
    </svg>
  )
}

// 카드마다 독립 Shadow DOM 스코프 — 시트 크롬(캔버스/카드)은 밖, Semantic 마크업만 안쪽에 둔다.
function Scope({ children }: { children: ReactNode }) {
  return (
    <FrameworkScope styles={[css]} rootClassName="ui">
      {children}
    </FrameworkScope>
  )
}

function CardGallery() {
  return (
    <SheetCanvas>
      <SheetCard title="Basic">
        <Scope>
          <div className="ui card">
            <div className="image">
              <Placeholder />
            </div>
            <div className="content">
              <div className="header">Molly Thomas</div>
              <div className="meta">Interior designer</div>
              <div className="description">Molly is an interior designer living in New York.</div>
            </div>
            <div className="extra content">Joined in 2019</div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Actions">
        <Scope>
          <div className="ui card">
            <div className="content">
              <div className="header">New request</div>
              <div className="meta">2 minutes ago</div>
              <div className="description">Jamie wants to join the design workspace.</div>
            </div>
            <div className="extra content">
              <div className="ui two buttons">
                <button type="button" className="ui primary button">
                  Approve
                </button>
                <button type="button" className="ui button">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Group" span={2}>
        <Scope>
          <div className="ui three cards">
            <div className="ui card">
              <div className="content">
                <div className="header">Starter</div>
                <div className="meta">Free</div>
                <div className="description">For personal projects and evaluation.</div>
              </div>
              <div className="extra content">
                <span className="ui small blue label">Popular</span>
              </div>
            </div>
            <div className="ui card">
              <div className="content">
                <div className="header">Team</div>
                <div className="meta">$12 / month</div>
                <div className="description">Collaboration for growing teams.</div>
              </div>
              <div className="extra content">Up to 20 seats</div>
            </div>
            <div className="ui card">
              <div className="content">
                <div className="header">Enterprise</div>
                <div className="meta">Custom</div>
                <div className="description">Security review and dedicated support.</div>
              </div>
              <div className="extra content">Contact sales</div>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Fluid">
        <Scope>
          <div className="ui fluid card">
            <div className="content">
              <div className="header">Quarterly report</div>
              <div className="meta">Finance</div>
              <div className="description">
                A fluid card stretches to fill the width of its container.
              </div>
            </div>
          </div>
        </Scope>
      </SheetCard>
    </SheetCanvas>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
    showImage: true,
    showActions: true,
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
    <FrameworkScope styles={[css]} rootClassName="ui">
      <div className="ui card">
        {args.showImage && (
          <div className="image">
            <Placeholder />
          </div>
        )}
        <div className="content">
          <div className="header">{args.title}</div>
          <div className="meta">
            <span className="date">Updated in July 2026</span>
          </div>
          <div className="description">{args.text}</div>
        </div>
        <div className="extra content">
          <span className="ui small teal label">Design</span>
          <span style={{ float: 'right' }}>12 members</span>
        </div>
        {args.showActions && (
          <div className="extra content">
            <div className="ui two buttons">
              <button type="button" className="ui positive button">
                {args.buttonLabel}
              </button>
              <button type="button" className="ui button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => <CardGallery />,
}
