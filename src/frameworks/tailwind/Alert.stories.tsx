import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Tone = 'yellow' | 'red' | 'green' | 'blue'

type Args = {
  message: string
  tone: Tone
  dismissible: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
const TONE_CLASSES: Record<Tone, string> = {
  yellow: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  red: 'border-red-400 bg-red-50 text-red-800',
  green: 'border-green-400 bg-green-50 text-green-800',
  blue: 'border-blue-400 bg-blue-50 text-blue-800',
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
        onClick={() => setVisible(true)}
      >
        Show alert
      </button>
    )
  }
  return (
    <div
      className={`rounded border-l-4 p-4 flex items-start justify-between shadow-sm ${TONE_CLASSES[args.tone]}`}
      role="alert"
    >
      <span>
        <strong className="font-semibold">Heads up!</strong> {args.message}
      </span>
      {args.dismissible && (
        <button
          type="button"
          className="ml-4 font-bold opacity-60 hover:opacity-100"
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
  title: 'Frameworks/Tailwind/Alert',
  args: { message: 'This is a warning message.', tone: 'yellow', dismissible: true },
  argTypes: {
    tone: { control: 'select', options: ['yellow', 'red', 'green', 'blue'] },
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
