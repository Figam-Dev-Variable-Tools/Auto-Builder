import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

const meta = {
  title: 'Frameworks/Materialize/Form',
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
        <div className="input-field">
          <input id="materializeEmail" type="text" />
          <label htmlFor="materializeEmail">Email</label>
        </div>
        <button type="submit" className="btn waves-effect waves-light">
          Submit
        </button>
      </form>
    </FrameworkScope>
  ),
}
