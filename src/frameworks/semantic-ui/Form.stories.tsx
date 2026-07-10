import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      className="ui form"
      style={{ width: '20rem' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className={`field${invalid ? ' error' : ''}`}>
        <label htmlFor="suiEmail">{args.label}</label>
        <input
          type="email"
          id="suiEmail"
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <div className="ui pointing red basic label">
            Please enter a valid email address.
          </div>
        )}
      </div>
      <div className="field">
        <div className="ui toggle checkbox">
          <input
            type="checkbox"
            id="suiNotify"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />
          <label htmlFor="suiNotify">Notifications: {notify ? 'ON' : 'OFF'}</label>
        </div>
      </div>
      <div className="field">
        <div className="ui checkbox">
          <input
            type="checkbox"
            id="suiAgree"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="suiAgree">I agree to the terms</label>
        </div>
      </div>
      <button
        type="submit"
        className={`ui primary ${agreed ? '' : 'disabled '}button`}
        disabled={!agreed}
      >
        Submit
      </button>
      {submitted && <div className="ui positive message">Submitted: {submitted}</div>}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Form',
  args: { label: 'Email', placeholder: 'name@example.com', disabled: false },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css]} rootClassName="ui">
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}
