import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  message: string
  variant: 'warning' | 'alert' | 'success' | 'primary'
  dismissible: boolean
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="button small hollow secondary"
        onClick={() => setVisible(true)}
      >
        Show alert
      </button>
    )
  }
  return (
    <div className={`callout ${args.variant}`}>
      <strong>Heads up!</strong> {args.message}
      {args.dismissible && (
        <button
          className="close-button"
          aria-label="Dismiss alert"
          type="button"
          onClick={() => setVisible(false)}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Foundation/Alert',
  args: { message: 'This is a warning message.', variant: 'warning', dismissible: true },
  argTypes: {
    variant: {
      control: 'select',
      options: ['warning', 'alert', 'success', 'primary'],
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
    <FrameworkScope styles={[css]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}
