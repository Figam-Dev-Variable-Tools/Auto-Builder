import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

const meta = {
  title: 'Frameworks/Bulma/Form',
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <FrameworkScope styles={[css]}>
      <form>
        <div className="field">
          <label className="label">Email</label>
          <div className="control">
            <input className="input" type="text" placeholder="Email" />
          </div>
        </div>
        <button type="submit" className="button is-primary">
          Submit
        </button>
      </form>
    </FrameworkScope>
  ),
}
