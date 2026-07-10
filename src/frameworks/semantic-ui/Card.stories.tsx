import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showActions: boolean
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <div className="ui card">
        {args.showImage && (
          <div className="image">
            <svg width="100%" height="140" role="img" aria-label="Placeholder image">
              <rect width="100%" height="100%" fill="#767676" />
              <text x="50%" y="50%" fill="#eeeeee" dy=".3em" textAnchor="middle">
                Image
              </text>
            </svg>
          </div>
        )}
        <div className="content">
          <div className="header">{args.title}</div>
          <div className="meta">Project</div>
          <div className="description">{args.text}</div>
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
