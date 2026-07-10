import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

const meta = {
  title: 'Frameworks/Skeleton/Form',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[normalize, skeleton]}>
      <form>
        <label htmlFor="skeletonEmail">Email</label>
        <input className="u-full-width" type="email" placeholder="Email" id="skeletonEmail" />
        <input className="button-primary" type="submit" value="Submit" />
      </form>
    </FrameworkScope>
  ),
}
