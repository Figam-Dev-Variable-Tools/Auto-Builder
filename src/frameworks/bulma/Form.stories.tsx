import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bulma/css/bulma.min.css?inline'

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
      style={{ width: '20rem' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className="field">
        <label htmlFor="bulmaEmail" className="label">
          {args.label}
        </label>
        <div className="control">
          <input
            type="email"
            className={`input${invalid ? ' is-danger' : ''}`}
            id="bulmaEmail"
            placeholder={args.placeholder}
            value={email}
            disabled={args.disabled}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
        {invalid && <p className="help is-danger">Please enter a valid email address.</p>}
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />{' '}
          Notifications: {notify ? 'ON' : 'OFF'}
        </label>
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />{' '}
          I agree to the terms
        </label>
      </div>
      <button type="submit" className="button is-primary" disabled={args.disabled || !agreed}>
        Submit
      </button>
      {submitted && (
        <div className="notification is-success" style={{ marginTop: '1rem' }}>
          Submitted: {submitted}
        </div>
      )}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Bulma/Form',
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
    <FrameworkScope styles={[css]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}
