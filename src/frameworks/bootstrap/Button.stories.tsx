import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size: 'sm' | 'md' | 'lg'
  outline: boolean
  disabled: boolean
}

const meta = {
  title: 'Frameworks/Bootstrap/Button',
  args: { label: 'Save changes', variant: 'primary', size: 'md', outline: false, disabled: false },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
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
    const variantClass = `btn${args.outline ? '-outline' : ''}-${args.variant}`
    const sizeClass = args.size === 'md' ? '' : ` btn-${args.size}`
    return (
      <FrameworkScope styles={[css]}>
        {/* 실제 제품의 다이얼로그 푸터 같은 액션 바 컴포지션 */}
        <div
          className="d-flex align-items-center justify-content-between border rounded p-3 bg-body-tertiary"
          style={{ width: '26rem' }}
        >
          <span className="text-body-secondary small">3 unsaved changes</span>
          <div className="d-flex gap-2">
            <button type="button" className={`btn btn-outline-secondary${sizeClass}`}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${variantClass}${sizeClass}`}
              disabled={args.disabled}
            >
              {args.label}
            </button>
          </div>
        </div>
      </FrameworkScope>
    )
  },
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
  'link',
] as const

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Solid" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap gap-2">
            {ALL_VARIANTS.map((variant) => (
              <button key={variant} type="button" className={`btn btn-${variant} text-capitalize`}>
                {variant}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Sizes">
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button type="button" className="btn btn-primary btn-sm">
              Small
            </button>
            <button type="button" className="btn btn-primary">
              Default
            </button>
            <button type="button" className="btn btn-primary btn-lg">
              Large
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Outline" span={2}>
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap gap-2">
            {ALL_VARIANTS.filter((v) => v !== 'link').map((variant) => (
              <button
                key={variant}
                type="button"
                className={`btn btn-outline-${variant} text-capitalize`}
              >
                {variant}
              </button>
            ))}
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css]}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button type="button" className="btn btn-primary" disabled>
              Disabled
            </button>
            <button type="button" className="btn btn-outline-secondary" disabled>
              Disabled outline
            </button>
            <button type="button" className="btn btn-primary" disabled>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Loading…
            </button>
            <button type="button" className="btn btn-success active">
              Active
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
