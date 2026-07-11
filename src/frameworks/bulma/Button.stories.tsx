import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'
  size: 'small' | 'normal' | 'medium' | 'large'
  outlined: boolean
  disabled: boolean
}

const COLORS = ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const meta = {
  title: 'Frameworks/Bulma/Button',
  args: { label: 'Button', variant: 'primary', size: 'normal', outlined: false, disabled: false },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
    },
    size: { control: 'inline-radio', options: ['small', 'normal', 'medium', 'large'] },
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
    const sizeClass = args.size === 'normal' ? '' : ` is-${args.size}`
    const outlinedClass = args.outlined ? ' is-outlined' : ''
    return (
      <FrameworkScope styles={[css]}>
        <button
          type="button"
          className={`button is-${args.variant}${sizeClass}${outlinedClass}`}
          disabled={args.disabled}
        >
          {args.label}
        </button>
      </FrameworkScope>
    )
  },
}

// Bulma 버튼 전체 변형 모음 — 참조 시트 룩(캔버스 + 카드) 구성
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Colors">
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            {COLORS.map((color) => (
              <button key={color} type="button" className={`button is-${color}`}>
                {cap(color)}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Light">
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            {COLORS.map((color) => (
              <button key={color} type="button" className={`button is-${color} is-light`}>
                {cap(color)}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Outlined">
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            {COLORS.map((color) => (
              <button key={color} type="button" className={`button is-${color} is-outlined`}>
                {cap(color)}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Rounded">
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            {COLORS.map((color) => (
              <button key={color} type="button" className={`button is-${color} is-rounded`}>
                {cap(color)}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sizes" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            <button type="button" className="button is-primary is-small">
              Small
            </button>
            <button type="button" className="button is-primary">
              Normal
            </button>
            <button type="button" className="button is-primary is-medium">
              Medium
            </button>
            <button type="button" className="button is-primary is-large">
              Large
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css]}>
          <div className="buttons">
            <button type="button" className="button is-primary is-loading">
              Loading
            </button>
            <button type="button" className="button is-primary" disabled>
              Disabled
            </button>
            <button type="button" className="button" disabled>
              Disabled (default)
            </button>
            <button type="button" className="button is-static">
              Static
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
