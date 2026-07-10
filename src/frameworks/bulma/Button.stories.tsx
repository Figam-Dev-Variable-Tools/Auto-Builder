import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'
  size: 'small' | 'normal' | 'medium' | 'large'
  outlined: boolean
  disabled: boolean
}

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
type Story = StoryObj<typeof meta>

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
