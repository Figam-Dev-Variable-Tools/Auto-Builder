import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

// 닫기 버튼이 있는 콜아웃 — React 상태로 제거
function DismissibleCallout() {
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
    <div className="callout alert">
      <strong>Error!</strong> Something went wrong — dismiss me with the close button.
      <button
        className="close-button"
        aria-label="Dismiss alert"
        type="button"
        onClick={() => setVisible(false)}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Callouts" span={2}>
        <FrameworkScope styles={[css]}>
          <div>
            <div className="callout primary">
              <strong>Primary.</strong> Highlights the main message of the page.
            </div>
            <div className="callout">
              <strong>Default.</strong> A plain callout for neutral information.
            </div>
            <div className="callout secondary">
              <strong>Secondary.</strong> Supporting information with less emphasis.
            </div>
            <div className="callout success">
              <strong>Success!</strong> Your changes have been saved.
            </div>
            <div className="callout warning">
              <strong>Warning.</strong> Your subscription expires in 3 days.
            </div>
            <div className="callout alert" style={{ marginBottom: 0 }}>
              <strong>Alert!</strong> The operation could not be completed.
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <FrameworkScope styles={[css]}>
          <DismissibleCallout />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Badges">
        <FrameworkScope styles={[css]}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge">1</span>
            <span className="badge secondary">2</span>
            <span className="badge success">3</span>
            <span className="badge warning">12</span>
            <span className="badge alert">99</span>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Labels">
        <FrameworkScope styles={[css]}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span className="label">Default</span>
            <span className="label secondary">Secondary</span>
            <span className="label success">Success</span>
            <span className="label warning">Warning</span>
            <span className="label alert">Alert</span>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
