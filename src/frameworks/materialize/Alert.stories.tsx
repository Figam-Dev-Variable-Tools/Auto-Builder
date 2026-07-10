import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

const meta = {
  title: 'Frameworks/Materialize/Alert',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <div className="card-panel amber lighten-4">This is a warning message.</div>
    </FrameworkScope>
  ),
}
