import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  message: string
  variant: 'warning' | 'danger' | 'success' | 'info'
  dismissible: boolean
}

const COLORS = ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

// Bulma의 두 가지 알림 패턴: notification과 message — 참조 시트 룩(캔버스 + 카드) 구성
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Notification">
        <FrameworkScope styles={[css]}>
          <div>
            {COLORS.map((color) => (
              <div key={color} className={`notification is-${color}`}>
                <button type="button" className="delete" aria-label="Dismiss" />
                <strong>{cap(color)}.</strong> Colored notification block.
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Notification (light)">
        <FrameworkScope styles={[css]}>
          <div>
            {COLORS.map((color) => (
              <div key={color} className={`notification is-${color} is-light`}>
                <button type="button" className="delete" aria-label="Dismiss" />
                <strong>{cap(color)}.</strong> With the is-light modifier.
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Message">
        <FrameworkScope styles={[css]}>
          <div>
            <article className="message is-link">
              <div className="message-header">
                <p>Scheduled maintenance</p>
                <button type="button" className="delete" aria-label="Dismiss" />
              </div>
              <div className="message-body">
                The <strong>message</strong> component pairs a header bar with a body. Maintenance
                starts <strong>Saturday at 02:00 UTC</strong>.
              </div>
            </article>
            <article className="message is-danger">
              <div className="message-body">
                A body-only message, useful for inline form errors or contextual notes.
              </div>
            </article>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
