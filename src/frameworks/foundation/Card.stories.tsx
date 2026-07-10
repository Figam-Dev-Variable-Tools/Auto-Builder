import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ width: '300px', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
        <div className="card-divider">{args.title}</div>
        {args.showImage && (
          <svg width="100%" height="140" role="img" aria-label="Placeholder image">
            <rect width="100%" height="100%" fill="#8a8a8a" />
            <text x="50%" y="50%" fill="#e6e6e6" dy=".3em" textAnchor="middle">
              Image
            </text>
          </svg>
        )}
        <div className="card-section">
          <p>{args.text}</p>
          <button type="button" className="button">
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
