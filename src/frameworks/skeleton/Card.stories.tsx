import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  title: string
  text: string
  buttonLabel: string
  showFooter: boolean
}

const meta = {
  title: 'Frameworks/Skeleton/Card',
  args: {
    title: 'Card title',
    text: 'This is a sample card.',
    buttonLabel: 'Button',
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
    <FrameworkScope styles={[normalize, skeleton]}>
      <div
        style={{
          maxWidth: 320,
          border: '1px solid #E1E1E1',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          padding: '1.5rem',
          background: '#fff',
        }}
      >
        <h5 style={{ marginBottom: '.5rem' }}>{args.title}</h5>
        <p>{args.text}</p>
        <button type="button" className="button-primary">
          {args.buttonLabel}
        </button>
        {args.showFooter && (
          <div
            style={{
              borderTop: '1px solid #E1E1E1',
              marginTop: '1rem',
              paddingTop: '.75rem',
              color: '#888',
              fontSize: '1.2rem',
            }}
          >
            Updated just now
          </div>
        )}
      </div>
    </FrameworkScope>
  ),
}
