import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

const meta = {
  title: 'Frameworks/Semantic UI/Card',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <div className="ui card">
        <div className="content">
          <div className="header">Card title</div>
          <div className="description">This is a sample card.</div>
        </div>
        <div className="extra content">
          <button type="button" className="ui primary button">
            Button
          </button>
        </div>
      </div>
    </FrameworkScope>
  ),
}
