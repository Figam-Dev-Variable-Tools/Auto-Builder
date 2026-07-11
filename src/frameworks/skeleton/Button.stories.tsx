import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
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
  args: { label: 'Publish site', primary: true, disabled: false },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[normalize, skeleton]}>
      {/* Skeleton 감성의 여백 많은 확인 패널 컴포지션 */}
      <div
        style={{
          maxWidth: 420,
          border: '1px solid #E1E1E1',
          borderRadius: 4,
          padding: '2rem 2.5rem',
          background: '#fff',
        }}
      >
        <h5 style={{ marginBottom: '.5rem' }}>Ready to publish?</h5>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>
          Your changes will go live immediately. You can roll back at any time.
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            className={args.primary ? 'button-primary' : 'button'}
            disabled={args.disabled}
            style={{ marginBottom: 0 }}
          >
            {args.label}
          </button>
          <a
            href="#"
            className="button"
            style={{ marginBottom: 0 }}
            onClick={(e) => e.preventDefault()}
          >
            Cancel
          </a>
        </div>
      </div>
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Types">
        <FrameworkScope styles={[normalize, skeleton]}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="button-primary">
              Primary
            </button>
            <button type="button" className="button">
              Default
            </button>
            <input type="submit" className="button" value="Input submit" />
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Anchors">
        <FrameworkScope styles={[normalize, skeleton]}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#" className="button button-primary" onClick={(e) => e.preventDefault()}>
              Anchor primary
            </a>
            <a href="#" className="button" onClick={(e) => e.preventDefault()}>
              Anchor default
            </a>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Disabled">
        <FrameworkScope styles={[normalize, skeleton]}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="button-primary" disabled style={{ opacity: 0.5 }}>
              Primary
            </button>
            <button type="button" className="button" disabled style={{ opacity: 0.5 }}>
              Default
            </button>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Full width">
        <FrameworkScope styles={[normalize, skeleton]}>
          <button type="button" className="button-primary u-full-width" style={{ marginBottom: 0 }}>
            Create account
          </button>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
