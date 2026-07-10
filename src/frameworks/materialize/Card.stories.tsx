import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
}

const meta = {
  title: 'Frameworks/Materialize/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
    showImage: true,
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
      <div className="card hoverable" style={{ width: '300px' }}>
        {args.showImage && (
          <div className="card-image">
            <svg width="100%" height="140" role="img" aria-label="Placeholder image">
              <rect width="100%" height="100%" fill="#78909c" />
              <text x="50%" y="50%" fill="#ffffff" dy=".3em" textAnchor="middle">
                Image
              </text>
            </svg>
            <span className="card-title">{args.title}</span>
          </div>
        )}
        <div className="card-content">
          {!args.showImage && <span className="card-title">{args.title}</span>}
          <p>{args.text}</p>
        </div>
        <div className="card-action">
          <a href="#" onClick={(e) => e.preventDefault()}>
            {args.buttonLabel}
          </a>
        </div>
      </div>
    </FrameworkScope>
  ),
}
