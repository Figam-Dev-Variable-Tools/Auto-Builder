import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

const meta = {
  title: 'Frameworks/Bootstrap/Form',
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
        <div className="mb-3">
          <label htmlFor="bootstrapEmail" className="form-label">
            Email
          </label>
          <input type="email" className="form-control" id="bootstrapEmail" />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    </FrameworkScope>
  ),
}
