import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showFooter: boolean
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="card" style={{ maxWidth: 320 }}>
        {args.showImage && (
          <div className="card-image">
            <svg width="100%" height="140" role="img" aria-label="Placeholder image">
              <rect width="100%" height="100%" fill="#7a7a7a" />
              <text x="50%" y="50%" fill="#f5f5f5" dy=".3em" textAnchor="middle">
                Image
              </text>
            </svg>
          </div>
        )}
        <header className="card-header">
          <p className="card-header-title">{args.title}</p>
        </header>
        <div className="card-content">
          <div className="content">{args.text}</div>
          <button type="button" className="button is-primary">
            {args.buttonLabel}
          </button>
        </div>
        {args.showFooter && (
          <footer className="card-footer">
            <a className="card-footer-item" href="#" onClick={(e) => e.preventDefault()}>
              Save
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
