import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'secondary' | 'positive' | 'negative' | 'basic'
  size: 'mini' | 'small' | 'medium' | 'large'
  disabled: boolean
}

const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  alignItems: 'center',
}

// 카드마다 독립 Shadow DOM 스코프 — 시트 크롬(캔버스/카드)은 밖, Semantic 마크업만 안쪽에 둔다.
function Scope({ children }: { children: ReactNode }) {
  return (
    <FrameworkScope styles={[css]} rootClassName="ui">
      {children}
    </FrameworkScope>
  )
}

// jQuery 없이 CSS만으로 동작하는 정적 마크업 갤러리
function ButtonGallery() {
  return (
    <SheetCanvas>
      <SheetCard title="Emphasis">
        <Scope>
          <div style={row}>
            <button type="button" className="ui primary button">
              Primary
            </button>
            <button type="button" className="ui secondary button">
              Secondary
            </button>
            <button type="button" className="ui positive button">
              Positive
            </button>
            <button type="button" className="ui negative button">
              Negative
            </button>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Basic">
        <Scope>
          <div style={row}>
            <button type="button" className="ui primary basic button">
              Primary
            </button>
            <button type="button" className="ui basic button">
              Standard
            </button>
            <button type="button" className="ui positive basic button">
              Positive
            </button>
            <button type="button" className="ui negative basic button">
              Negative
            </button>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Colored">
        <Scope>
          <div style={row}>
            {(['blue', 'green', 'orange', 'red', 'violet'] as const).map((color) => (
              <button key={color} type="button" className={`ui ${color} button`}>
                {color[0].toUpperCase() + color.slice(1)}
              </button>
            ))}
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Sizes">
        <Scope>
          <div style={row}>
            <button type="button" className="ui mini button">
              Mini
            </button>
            <button type="button" className="ui tiny button">
              Tiny
            </button>
            <button type="button" className="ui small button">
              Small
            </button>
            <button type="button" className="ui button">
              Medium
            </button>
            <button type="button" className="ui large button">
              Large
            </button>
            <button type="button" className="ui big button">
              Big
            </button>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="States">
        <Scope>
          <div style={row}>
            <button type="button" className="ui loading primary button">
              Loading
            </button>
            <button type="button" className="ui disabled button" disabled>
              Disabled
            </button>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Fluid">
        <Scope>
          <button type="button" className="ui fluid primary button">
            Fluid button
          </button>
        </Scope>
      </SheetCard>
      <SheetCard title="Group">
        <Scope>
          <div style={row}>
            <div className="ui buttons">
              <button type="button" className="ui button">
                One
              </button>
              <button type="button" className="ui button">
                Two
              </button>
              <button type="button" className="ui button">
                Three
              </button>
            </div>
            <div className="ui buttons">
              <button type="button" className="ui button">
                Cancel
              </button>
              <div className="or" />
              <button type="button" className="ui positive button">
                Save
              </button>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Animated">
        <Scope>
          <button type="button" className="ui animated primary button" tabIndex={0}>
            <div className="visible content">Next</div>
            <div className="hidden content">&rarr;</div>
          </button>
        </Scope>
      </SheetCard>
    </SheetCanvas>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Button',
  args: { label: 'Button', variant: 'primary', size: 'medium', disabled: false },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'positive', 'negative', 'basic'],
    },
    size: { control: 'inline-radio', options: ['mini', 'small', 'medium', 'large'] },
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
      'ui',
      args.variant,
      args.size === 'medium' ? '' : args.size,
      args.disabled ? 'disabled' : '',
      'button',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <FrameworkScope styles={[css]} rootClassName="ui">
        <button type="button" className={className} disabled={args.disabled}>
          {args.label}
        </button>
      </FrameworkScope>
    )
  },
}

export const Gallery: Story = {
  render: () => <ButtonGallery />,
}
