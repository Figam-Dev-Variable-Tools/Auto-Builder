import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Callout } from './Callout'

const meta = {
  title: '3. 컴포넌트/Feedback/Callout',
  component: Callout,
  tags: ['autodocs'],
  args: {
    tone: 'info',
    title: 'Heads up',
    children: 'This is an informational callout with a short supporting message.',
  },
  argTypes: {
    children: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Callout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Callout tone="info" title="Information">
        Use this to share neutral, helpful context with the reader.
      </Callout>
      <Callout tone="success" title="Success">
        Your changes were saved and published successfully.
      </Callout>
      <Callout tone="warning" title="Warning">
        This action may have side effects. Review before continuing.
      </Callout>
      <Callout tone="error" title="Error">
        Something went wrong. Please try again in a moment.
      </Callout>
    </div>
  ),
}
