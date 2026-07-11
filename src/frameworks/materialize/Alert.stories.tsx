import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
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

// 참조 시트와 같은 파랑 우선 정렬
const TONE_ORDER: Args['tone'][] = ['blue', 'green', 'amber', 'red']

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

const CHIP_TAGS = ['Design', 'Frontend', 'A11y', 'Docs']

// chip 닫기는 JS 미로드 환경이라 React 상태로 처리
function ChipRowDemo() {
  const [chips, setChips] = useState(CHIP_TAGS)

  return (
    <div>
      {chips.map((chip) => (
        <div key={chip} className="chip">
          {chip}
          <span
            className="close"
            role="button"
            aria-label={`Remove ${chip}`}
            onClick={() => setChips((prev) => prev.filter((c) => c !== chip))}
          >
            ×
          </span>
        </div>
      ))}
      {chips.length === 0 && (
        <button type="button" className="btn-small btn-flat" onClick={() => setChips(CHIP_TAGS)}>
          Reset chips
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Tones">
        <FrameworkScope styles={[css]}>
          <div>
            {TONE_ORDER.map((tone) => (
              <div
                key={tone}
                className={TONE_CLASS[tone]}
                role="alert"
                style={{ margin: '0 0 8px' }}
              >
                <strong style={{ textTransform: 'capitalize' }}>{tone}.</strong> This is a {tone}{' '}
                card-panel alert.
              </div>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <FrameworkScope styles={[css]}>
          <AlertDemo message="Click × to dismiss this alert." tone="blue" dismissible />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Chips">
        <FrameworkScope styles={[css]}>
          <ChipRowDemo />
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
