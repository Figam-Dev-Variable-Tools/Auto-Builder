import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  message: string
  variant: 'warning' | 'danger' | 'success' | 'info' | 'primary'
  dismissible: boolean
}

// currentColor 를 쓰는 인라인 아이콘 (외부 에셋 불필요)
function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="flex-shrink-0 me-2"
      role="img"
      aria-label="Alert icon"
    >
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  )
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => setVisible(true)}
      >
        Show alert
      </button>
    )
  }
  return (
    <div
      className={`alert alert-${args.variant}${args.dismissible ? ' alert-dismissible' : ''} d-flex align-items-start shadow-sm`}
      role="alert"
      style={{ maxWidth: '32rem' }}
    >
      <AlertIcon />
      <div>
        <strong>Heads up!</strong> {args.message}{' '}
        <a href="#" className="alert-link" onClick={(e) => e.preventDefault()}>
          Learn more
        </a>
      </div>
      {args.dismissible && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => setVisible(false)}
        />
      )}
    </div>
  )
}

const meta = {
  title: 'Frameworks/Bootstrap/Alert',
  args: { message: 'This is a warning message.', variant: 'warning', dismissible: true },
  argTypes: {
    variant: {
      control: 'select',
      options: ['warning', 'danger', 'success', 'info', 'primary'],
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

const ALL_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
] as const

function GalleryDismissible() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => setVisible(true)}
      >
        Show dismissed alert again
      </button>
    )
  }
  return (
    <div className="alert alert-warning alert-dismissible mb-0" role="alert">
      <strong>Holy guacamole!</strong> You should check in on some of those fields below.
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={() => setVisible(false)}
      />
    </div>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Variants" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-column gap-2">
            {ALL_VARIANTS.map((variant) => (
              <div key={variant} className={`alert alert-${variant} py-2 mb-0`} role="alert">
                A simple {variant} alert — check it out!
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Heading & Link">
        <FrameworkScope styles={[css]}>
          <div className="alert alert-success mb-0" role="alert">
            <h5 className="alert-heading">Well done!</h5>
            <p>
              You successfully read this important alert message. This example text runs a bit
              longer so you can see how spacing works within an alert body.
            </p>
            <hr />
            <p className="mb-0">
              Whenever you need to, use{' '}
              <a href="#" className="alert-link" onClick={(e) => e.preventDefault()}>
                this alert link
              </a>{' '}
              to draw attention.
            </p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <FrameworkScope styles={[css]}>
          <GalleryDismissible />
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
