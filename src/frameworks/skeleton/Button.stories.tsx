import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  label: string
  primary: boolean
  disabled: boolean
}

const meta = {
  title: 'Frameworks/Skeleton/Button',
  args: { label: 'Button', primary: true, disabled: false },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[normalize, skeleton]}>
      <button
        type="button"
        className={args.primary ? 'button-primary' : 'button'}
        disabled={args.disabled}
      >
        {args.label}
      </button>
    </FrameworkScope>
  ),
}
