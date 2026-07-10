import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

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
      <label>
        {args.label}
        <input
          type="email"
          className={invalid ? 'is-invalid-input' : undefined}
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </label>
      {invalid && (
        <span className="form-error is-visible">Please enter a valid email address.</span>
      )}
      <div className="switch">
        <input
          className="switch-input"
          id="fnSwitch"
          type="checkbox"
          checked={notify}
          disabled={args.disabled}
          onChange={(e) => setNotify(e.target.checked)}
        />
        <label className="switch-paddle" htmlFor="fnSwitch">
          <span className="show-for-sr">Notifications</span>
        </label>
      </div>
      <p>Notifications: {notify ? 'ON' : 'OFF'}</p>
      <label htmlFor="fnAgree">
        <input
          id="fnAgree"
          type="checkbox"
          checked={agreed}
          disabled={args.disabled}
          onChange={(e) => setAgreed(e.target.checked)}
        />{' '}
        I agree to the terms
      </label>
      <button type="submit" className="button" disabled={args.disabled || !agreed}>
        Submit
      </button>
      {submitted && <div className="callout success">Submitted: {submitted}</div>}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Foundation/Form',
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
