import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
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
  args: { label: 'Button', variant: 'primary', size: 'md', outline: false, disabled: false },
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
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const variantClass = `btn${args.outline ? '-outline' : ''}-${args.variant}`
    const sizeClass = args.size === 'md' ? '' : ` btn-${args.size}`
    return (
      <FrameworkScope styles={[css]}>
        <button
          type="button"
          className={`btn ${variantClass}${sizeClass}`}
          disabled={args.disabled}
        >
          {args.label}
        </button>
      </FrameworkScope>
    )
  },
}
