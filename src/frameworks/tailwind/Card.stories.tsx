import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showImage: boolean
  showFooter: boolean
}

const meta = {
  title: 'Frameworks/Tailwind/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
    showImage: true,
    showFooter: true,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]}>
      <div className="max-w-sm rounded-lg border border-gray-200 shadow-md overflow-hidden bg-white">
        {args.showImage && (
          <svg
            className="block w-full"
            height="140"
            role="img"
            aria-label="Placeholder image"
          >
            <rect width="100%" height="100%" fill="#9ca3af" />
            <text x="50%" y="50%" fill="#e5e7eb" dy=".3em" textAnchor="middle">
              Image
            </text>
          </svg>
        )}
        <div className="p-4">
          <h5 className="text-lg font-bold mb-1">{args.title}</h5>
          <p className="text-gray-600 mb-3">{args.text}</p>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            {args.buttonLabel}
          </button>
        </div>
        {args.showFooter && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
            Updated just now
          </div>
        )}
      </div>
    </FrameworkScope>
  ),
}
