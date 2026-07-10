import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  message: string
  tone: 'amber' | 'red' | 'green' | 'blue'
  dismissible: boolean
}

const TONE_CLASS: Record<Args['tone'], string> = {
  amber: 'card-panel amber lighten-4',
  red: 'card-panel red lighten-4',
  green: 'card-panel green lighten-4',
  blue: 'card-panel blue lighten-4',
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="btn-small btn-flat" onClick={() => setVisible(true)}>
        Show alert
      </button>
    )
  }
  return (
    <div
      className={TONE_CLASS[args.tone]}
      role="alert"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <span>
        <strong>Heads up!</strong> {args.message}
      </span>
      {args.dismissible && (
        <button
          type="button"
          className="btn-flat"
          aria-label="Dismiss alert"
          onClick={() => setVisible(false)}
        >
          ×
        </button>
      )}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Materialize/Alert',
  args: { message: 'This is a warning message.', tone: 'amber', dismissible: true },
  argTypes: {
    tone: { control: 'select', options: ['amber', 'red', 'green', 'blue'] },
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
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}
