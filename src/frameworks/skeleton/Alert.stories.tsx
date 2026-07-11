import { useState, type ReactNode } from 'react'
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  message: string
  tone: 'warning' | 'danger' | 'success'
  dismissible: boolean
}

// Skeleton 에는 알럿 컴포넌트가 없어 얇은 보더와 은은한 배경으로 흉내낸다
const TONES: Record<Args['tone'], CSSProperties> = {
  warning: { borderLeft: '4px solid #F0AD4E', background: '#FDF7EC', color: '#8A6D3B' },
  danger: { borderLeft: '4px solid #D9534F', background: '#FBEDEC', color: '#A94442' },
  success: { borderLeft: '4px solid #5CB85C', background: '#F1F9F1', color: '#3D8B3D' },
}

const TITLES: Record<Args['tone'], string> = {
  warning: 'Heads up!',
  danger: 'Something went wrong.',
  success: 'All set.',
}

function EmulatedAlert({
  tone,
  onDismiss,
  children,
  style,
}: {
  tone: Args['tone']
  onDismiss?: () => void
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      role="alert"
      style={{
        ...TONES[tone],
        padding: '1rem 1.25rem',
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...style,
      }}
    >
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onDismiss}
          style={{
            border: 'none',
            background: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 0,
            padding: '0 .5rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  return (
    <div style={{ maxWidth: 480 }}>
      {/* 설정 페이지 상단에 알럿이 놓인 컴포지션 */}
      <h5 style={{ marginBottom: '.5rem' }}>Account settings</h5>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Changes are saved automatically as you edit.
      </p>
      {visible ? (
        <EmulatedAlert
          tone={args.tone}
          onDismiss={args.dismissible ? () => setVisible(false) : undefined}
        >
          <strong>{TITLES[args.tone]}</strong> {args.message}
        </EmulatedAlert>
      ) : (
        <button type="button" className="button" onClick={() => setVisible(true)}>
          Show alert
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[normalize, skeleton]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

function GalleryDismissible() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="button" onClick={() => setVisible(true)}>
        Show dismissed alert again
      </button>
    )
  }
  return (
    <EmulatedAlert tone="warning" onDismiss={() => setVisible(false)}>
      <strong>Heads up!</strong> This alert can be dismissed with the × button.
    </EmulatedAlert>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Tones" span={2}>
        <FrameworkScope styles={[normalize, skeleton]}>
          <EmulatedAlert tone="success" style={{ marginBottom: '1rem' }}>
            <strong>All set.</strong> Your profile has been updated.
          </EmulatedAlert>
          <EmulatedAlert tone="warning" style={{ marginBottom: '1rem' }}>
            <strong>Heads up!</strong> Your trial ends in 3 days.
          </EmulatedAlert>
          <EmulatedAlert tone="danger">
            <strong>Something went wrong.</strong> We could not reach the server.
          </EmulatedAlert>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <FrameworkScope styles={[normalize, skeleton]}>
          <GalleryDismissible />
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
