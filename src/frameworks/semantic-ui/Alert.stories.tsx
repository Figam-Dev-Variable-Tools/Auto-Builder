import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  message: string
  tone: 'warning' | 'negative' | 'positive' | 'info'
  dismissible: boolean
}

// 아이콘 폰트 대신 텍스트 × 로 닫기 버튼을 표현 (KI-1)
const closeStyle: CSSProperties = {
  float: 'right',
  cursor: 'pointer',
  fontWeight: 700,
}

function AlertDemo(args: Args) {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="ui mini basic button" onClick={() => setVisible(true)}>
        Show alert
      </button>
    )
  }
  return (
    <div className={`ui ${args.tone} message`}>
      {args.dismissible && (
        <span
          style={closeStyle}
          role="button"
          aria-label="Dismiss alert"
          onClick={() => setVisible(false)}
        >
          ×
        </span>
      )}
      <div className="header">Heads up!</div>
      <p>{args.message}</p>
    </div>
  )
}

function DismissibleMessageDemo() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <button type="button" className="ui mini basic button" onClick={() => setVisible(true)}>
        Show message again
      </button>
    )
  }
  return (
    <div className="ui info message">
      <span
        style={closeStyle}
        role="button"
        aria-label="Dismiss message"
        onClick={() => setVisible(false)}
      >
        ×
      </span>
      <div className="header">Dismissible</div>
      <p>Click the × on the right to dismiss this message.</p>
    </div>
  )
}

// 카드마다 독립 Shadow DOM 스코프 — 시트 크롬(캔버스/카드)은 밖, Semantic 마크업만 안쪽에 둔다.
function Scope({ children }: { children: ReactNode }) {
  return (
    <FrameworkScope styles={[css]} rootClassName="ui">
      {children}
    </FrameworkScope>
  )
}

function AlertGallery() {
  return (
    <SheetCanvas>
      <SheetCard title="Messages">
        <Scope>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div className="ui info message">
              <div className="header">Info</div>
              <p>A new software update is available.</p>
            </div>
            <div className="ui positive message">
              <div className="header">Positive</div>
              <p>Your profile has been saved successfully.</p>
            </div>
            <div className="ui negative message">
              <div className="header">Negative</div>
              <p>We could not process your payment.</p>
            </div>
            <div className="ui warning message">
              <div className="header">Warning</div>
              <p>Your subscription expires in 3 days.</p>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Colored">
        <Scope>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {(['blue', 'green', 'yellow', 'orange', 'red', 'purple'] as const).map((color) => (
              <div key={color} className={`ui ${color} message`}>
                {color[0].toUpperCase() + color.slice(1)} message
              </div>
            ))}
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Dismissible">
        <Scope>
          <DismissibleMessageDemo />
        </Scope>
      </SheetCard>
      <SheetCard title="Attached">
        <Scope>
          <div>
            <div className="ui top attached info message">
              <div className="header">Attached message</div>
              <p>This message sits on top of the segment below.</p>
            </div>
            <div className="ui attached segment">
              <p>Segment content between two attached messages.</p>
            </div>
            <div className="ui bottom attached warning message">
              Bottom attached warning message.
            </div>
          </div>
        </Scope>
      </SheetCard>
    </SheetCanvas>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Alert',
  args: { message: 'This is a warning message.', tone: 'warning', dismissible: true },
  argTypes: {
    tone: {
      control: 'select',
      options: ['warning', 'negative', 'positive', 'info'],
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
    <FrameworkScope styles={[css]} rootClassName="ui">
      <AlertDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => <AlertGallery />,
}
