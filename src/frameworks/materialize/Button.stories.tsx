import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
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
type Story = StoryObj<typeof meta>

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
