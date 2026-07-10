import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  message: string
  tone: 'warning' | 'danger' | 'success'
  dismissible: boolean
}

const TONES: Record<Args['tone'], CSSProperties> = {
  warning: { borderLeft: '4px solid #F0AD4E', background: '#FDF7EC', color: '#8A6D3B' },
  danger: { borderLeft: '4px solid #D9534F', background: '#FBEDEC', color: '#A94442' },
  success: { borderLeft: '4px solid #5CB85C', background: '#F1F9F1', color: '#3D8B3D' },
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="button" onClick={() => setVisible(true)}>
        Show alert
      </button>
    )
  }
  return (
    <div
      role="alert"
      style={{
        ...TONES[args.tone],
        padding: '1rem 1.25rem',
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>
        <strong>Heads up!</strong> {args.message}
      </span>
      {args.dismissible && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={() => setVisible(false)}
          style={{
            border: 'none',
            background: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Skeleton/Alert',
  args: { message: 'This is a warning message.', tone: 'warning', dismissible: true },
  argTypes: {
    tone: { control: 'select', options: ['warning', 'danger', 'success'] },
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
    <FrameworkScope styles={[normalize, skeleton]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}
