import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

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
      <div className="mb-3">
        <label htmlFor="bootstrapEmail" className="form-label">
          {args.label}
        </label>
        <input
          type="email"
          className={`form-control${invalid ? ' is-invalid' : ''}`}
          id="bootstrapEmail"
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        <div className="invalid-feedback">Please enter a valid email address.</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="bootstrapNotify"
          checked={notify}
          disabled={args.disabled}
          onChange={(e) => setNotify(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="bootstrapNotify">
          Notifications: {notify ? 'ON' : 'OFF'}
        </label>
      </div>
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="bootstrapAgree"
          checked={agreed}
          disabled={args.disabled}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="bootstrapAgree">
          I agree to the terms
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={args.disabled || !agreed}>
        Submit
      </button>
      {submitted && (
        <div className="alert alert-success mt-3 mb-0" role="alert">
          Submitted: {submitted}
        </div>
      )}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Bootstrap/Form',
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
