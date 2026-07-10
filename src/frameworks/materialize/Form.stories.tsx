import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

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
      style={{ width: '320px' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className="input-field">
        <input
          id="mzEmail"
          type="email"
          className={invalid ? 'invalid' : ''}
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        <label htmlFor="mzEmail" className={email ? 'active' : ''}>
          {args.label}
        </label>
        {invalid && (
          <span className="helper-text red-text">Please enter a valid email address.</span>
        )}
      </div>
      <div className="switch" style={{ marginBottom: '8px' }}>
        <label>
          Off
          <input
            type="checkbox"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />
          <span className="lever"></span>
          On
        </label>
      </div>
      <p style={{ marginTop: 0 }}>Notifications: {notify ? 'ON' : 'OFF'}</p>
      <p>
        <label>
          <input
            type="checkbox"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>I agree to the terms</span>
        </label>
      </p>
      <button
        type="submit"
        className="btn waves-effect waves-light"
        disabled={args.disabled || !agreed}
      >
        Submit
      </button>
      {submitted && (
        <div className="card-panel green lighten-4 green-text text-darken-3">
          Submitted: {submitted}
        </div>
      )}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Materialize/Form',
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
