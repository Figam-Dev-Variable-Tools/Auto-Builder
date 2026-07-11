import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'alert' | 'warning'
  size: 'small' | 'default' | 'large'
  hollow: boolean
  disabled: boolean
}

const meta = {
  title: 'Frameworks/Foundation/Button',
  args: { label: 'Button', variant: 'primary', size: 'default', hollow: false, disabled: false },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'alert', 'warning'],
    },
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => {
    const className = [
      'button',
      args.variant === 'primary' ? '' : args.variant,
      args.size === 'default' ? '' : args.size,
      args.hollow ? 'hollow' : '',
      args.disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <FrameworkScope styles={[css]}>
        <button type="button" className={className} disabled={args.disabled}>
          {args.label}
        </button>
      </FrameworkScope>
    )
  },
}

// 카드 안에서 샘플을 가로로 정렬하는 래퍼 — 마지막 줄 여백(버튼 margin-bottom)만 상쇄한다
function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 0.5rem',
        alignItems: 'center',
        marginBottom: '-1rem',
      }}
    >
      {children}
    </div>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Variants" span={2}>
        <FrameworkScope styles={[css]}>
          <Row>
            <button type="button" className="button">
              Primary
            </button>
            <button type="button" className="button secondary">
              Secondary
            </button>
            <button type="button" className="button success">
              Success
            </button>
            <button type="button" className="button alert">
              Alert
            </button>
            <button type="button" className="button warning">
              Warning
            </button>
          </Row>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Hollow" span={2}>
        <FrameworkScope styles={[css]}>
          <Row>
            <button type="button" className="button hollow">
              Primary
            </button>
            <button type="button" className="button hollow secondary">
              Secondary
            </button>
            <button type="button" className="button hollow success">
              Success
            </button>
            <button type="button" className="button hollow alert">
              Alert
            </button>
            <button type="button" className="button hollow warning">
              Warning
            </button>
          </Row>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Clear" span={2}>
        <FrameworkScope styles={[css]}>
          <Row>
            <button type="button" className="button clear">
              Primary
            </button>
            <button type="button" className="button clear secondary">
              Secondary
            </button>
            <button type="button" className="button clear success">
              Success
            </button>
            <button type="button" className="button clear alert">
              Alert
            </button>
            <button type="button" className="button clear warning">
              Warning
            </button>
          </Row>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sizes" span={2}>
        <FrameworkScope styles={[css]}>
          <Row>
            <button type="button" className="button tiny">
              Tiny
            </button>
            <button type="button" className="button small">
              Small
            </button>
            <button type="button" className="button">
              Default
            </button>
            <button type="button" className="button large">
              Large
            </button>
          </Row>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css]}>
          <Row>
            <button type="button" className="button disabled" disabled>
              Disabled
            </button>
            <button type="button" className="button hollow disabled" disabled>
              Disabled hollow
            </button>
          </Row>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Group">
        <FrameworkScope styles={[css]}>
          <div className="button-group" style={{ marginBottom: 0 }}>
            <button type="button" className="button">
              Save
            </button>
            <button type="button" className="button">
              Preview
            </button>
            <button type="button" className="button">
              Delete
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Expanded">
        <FrameworkScope styles={[css]}>
          <button type="button" className="button expanded" style={{ marginBottom: 0 }}>
            Expanded button
          </button>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
