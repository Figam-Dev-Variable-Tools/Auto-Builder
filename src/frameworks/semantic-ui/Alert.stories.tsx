import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  message: string
  tone: 'warning' | 'negative' | 'positive' | 'info'
  dismissible: boolean
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="ui mini basic button" onClick={() => setVisible(true)}>
        Show alert
      </button>
    )
  }
  return (
    <div className={`ui ${args.tone} message`}>
      {args.dismissible && (
        <span
          style={{ float: 'right', cursor: 'pointer', fontWeight: 700 }}
          role="button"
          aria-label="Dismiss alert"
          onClick={() => setVisible(false)}
        >
          ×
        </span>
      )}
      <div className="header">Heads up!</div>
      <p>{args.message}</p>
    </div>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Alert',
  args: { message: 'This is a warning message.', tone: 'warning', dismissible: true },
  argTypes: {
    tone: {
      control: 'select',
      options: ['warning', 'negative', 'positive', 'info'],
    },
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
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}
