import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  label: string
  variant: 'primary' | 'secondary' | 'positive' | 'negative' | 'basic'
  size: 'mini' | 'small' | 'medium' | 'large'
  disabled: boolean
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
type Story = StoryObj<typeof meta>

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
