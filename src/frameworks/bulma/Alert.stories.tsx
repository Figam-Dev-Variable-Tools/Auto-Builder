import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  message: string
  variant: 'warning' | 'danger' | 'success' | 'info'
  dismissible: boolean
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="button is-small" onClick={() => setVisible(true)}>
        Show alert
      </button>
    )
  }
  return (
    <div className={`notification is-${args.variant}`}>
      {args.dismissible && (
        <button
          type="button"
          className="delete"
          aria-label="Dismiss alert"
          onClick={() => setVisible(false)}
        />
      )}
      <strong>Heads up!</strong> {args.message}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Bulma/Alert',
  args: { message: 'This is a warning message.', variant: 'warning', dismissible: true },
  argTypes: {
    variant: {
      control: 'select',
      options: ['warning', 'danger', 'success', 'info'],
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
