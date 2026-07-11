import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  label: string
  color: 'teal' | 'red' | 'green' | 'amber' | 'blue'
  size: 'small' | 'default' | 'large'
  disabled: boolean
}

const SIZE_CLASS: Record<Args['size'], string> = {
  small: ' btn-small',
  default: '',
  large: ' btn-large',
}

// 갤러리 공통 스타일
const rowStyle = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' } as const

const meta = {
  title: 'Frameworks/Materialize/Button',
  args: { label: 'Button', color: 'teal', size: 'default', disabled: false },
  argTypes: {
    color: { control: 'select', options: ['teal', 'red', 'green', 'amber', 'blue'] },
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
    const colorClass =
      args.color === 'teal' ? '' : args.color === 'amber' ? ' amber darken-2' : ` ${args.color}`
    const className = `btn waves-effect waves-light${SIZE_CLASS[args.size]}${colorClass}${
      args.disabled ? ' disabled' : ''
    }`
    return (
      <FrameworkScope styles={[css]}>
        <button type="button" className={className} disabled={args.disabled}>
          {args.label}
        </button>
      </FrameworkScope>
    )
  },
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Colors">
        <FrameworkScope styles={[css]}>
          <div style={rowStyle}>
            <button type="button" className="btn">
              Default
            </button>
            <button type="button" className="btn blue">
              Blue
            </button>
            <button type="button" className="btn green">
              Green
            </button>
            <button type="button" className="btn amber darken-2">
              Amber
            </button>
            <button type="button" className="btn red">
              Red
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Styles">
        <FrameworkScope styles={[css]}>
          <div style={rowStyle}>
            <button type="button" className="btn">
              Raised
            </button>
            <button type="button" className="btn-flat">
              Flat
            </button>
            <button type="button" className="btn disabled" disabled>
              Disabled
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="FAB">
        <FrameworkScope styles={[css]}>
          <div style={rowStyle}>
            {/* 아이콘 폰트 미로드 → 일반 텍스트 +로 대체 */}
            <button type="button" className="btn-floating" aria-label="Add">
              <i style={{ fontStyle: 'normal' }}>+</i>
            </button>
            <button type="button" className="btn-floating btn-large blue" aria-label="Add (large)">
              <i style={{ fontStyle: 'normal' }}>+</i>
            </button>
            <button type="button" className="btn-floating pulse red" aria-label="Add (pulse)">
              <i style={{ fontStyle: 'normal' }}>+</i>
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sizes">
        <FrameworkScope styles={[css]}>
          <div style={rowStyle}>
            <button type="button" className="btn btn-small">
              Small
            </button>
            <button type="button" className="btn">
              Default
            </button>
            <button type="button" className="btn btn-large">
              Large
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
