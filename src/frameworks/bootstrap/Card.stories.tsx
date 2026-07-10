import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
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

const meta = {
  title: 'Frameworks/Bootstrap/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="card shadow-sm" style={{ width: '18rem' }}>
        {args.showHeader && <div className="card-header">Featured</div>}
        {args.showImage && (
          <svg
            className="card-img-top"
            width="100%"
            height="140"
            role="img"
            aria-label="Placeholder image"
          >
            <rect width="100%" height="100%" fill="#868e96" />
            <text x="50%" y="50%" fill="#dee2e6" dy=".3em" textAnchor="middle">
              Image cap
            </text>
          </svg>
        )}
        <div className="card-body">
          <h5 className="card-title">{args.title}</h5>
          <p className="card-text">{args.text}</p>
          <button type="button" className="btn btn-primary">
            {args.buttonLabel}
          </button>
        </div>
        {args.showFooter && (
          <div className="card-footer text-body-secondary">Updated just now</div>
        )}
      </div>
    </FrameworkScope>
  ),
}
