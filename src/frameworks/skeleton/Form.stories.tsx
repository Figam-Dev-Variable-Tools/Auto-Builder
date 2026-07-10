import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

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
      style={{ maxWidth: 320 }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <label htmlFor="skEmail">{args.label}</label>
      <input
        className="u-full-width"
        type="email"
        id="skEmail"
        placeholder={args.placeholder}
        value={email}
        disabled={args.disabled}
        style={invalid ? { borderColor: '#D9534F' } : undefined}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
      />
      {invalid && (
        <p style={{ color: '#D9534F', fontSize: '1.2rem', marginTop: '-.75rem' }}>
          Please enter a valid email address.
        </p>
      )}
      <label>
        <input
          type="checkbox"
          checked={notify}
          disabled={args.disabled}
          onChange={(e) => setNotify(e.target.checked)}
        />
        <span className="label-body">Notifications: {notify ? 'ON' : 'OFF'}</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={agreed}
          disabled={args.disabled}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span className="label-body">I agree to the terms</span>
      </label>
      <input
        className="button-primary"
        type="submit"
        value="Submit"
        disabled={args.disabled || !agreed}
      />
      {submitted && (
        <p
          style={{
            padding: '.75rem 1rem',
            border: '1px solid #5CB85C',
            borderRadius: 4,
            background: '#F1F9F1',
            color: '#3D8B3D',
          }}
        >
          Submitted: {submitted}
        </p>
      )}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Skeleton/Form',
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
    <FrameworkScope styles={[normalize, skeleton]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}
