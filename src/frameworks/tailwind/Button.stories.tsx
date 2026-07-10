import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Color = 'blue' | 'gray' | 'green' | 'red' | 'yellow'
type Size = 'sm' | 'md' | 'lg'

type Args = {
  label: string
  color: Color
  size: Size
  disabled: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
const COLOR_CLASSES: Record<Color, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
  gray: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white',
  green: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white',
  red: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
  yellow: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-gray-900',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

const DISABLED_CLASSES = 'opacity-50 cursor-not-allowed'

const meta = {
  title: 'Frameworks/Tailwind/Button',
  args: { label: 'Button', color: 'blue', size: 'md', disabled: false },
  argTypes: {
    color: { control: 'select', options: ['blue', 'gray', 'green', 'red', 'yellow'] },
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
    const className = [
      'rounded font-medium transition-colors',
      COLOR_CLASSES[args.color],
      SIZE_CLASSES[args.size],
      args.disabled ? DISABLED_CLASSES : '',
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
