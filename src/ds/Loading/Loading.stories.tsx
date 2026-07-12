import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Loading } from './Loading'

const meta = {
  title: '3. 컴포넌트/Feedback/Loading',
  component: Loading,
  tags: ['autodocs'],
  args: {
    variant: 'spinner',
    size: 'md',
    label: '불러오는 중',
    overlay: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['spinner', 'dots'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Loading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Loading variant="spinner" size="sm" />
        <Loading variant="spinner" size="md" />
        <Loading variant="spinner" size="lg" />
      </div>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Loading variant="dots" size="sm" />
        <Loading variant="dots" size="md" />
        <Loading variant="dots" size="lg" />
      </div>
      <Loading variant="spinner" size="md" label="불러오는 중" />
      <div
        style={{
          position: 'relative',
          width: 200,
          height: 120,
          border: '1px solid var(--ds-color-border)',
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          color: 'var(--ds-color-secondary)',
        }}
      >
        콘텐츠 영역
        <Loading overlay label="불러오는 중" />
      </div>
    </div>
  ),
}
