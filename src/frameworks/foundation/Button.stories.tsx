import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
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
type Story = StoryObj<typeof meta>

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
