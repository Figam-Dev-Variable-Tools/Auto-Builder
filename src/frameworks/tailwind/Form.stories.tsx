import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import css from './tailwind.generated.css?inline'

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
      className="w-80"
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className="mb-3">
        <label htmlFor="tailwindEmail" className="block mb-1 font-medium">
          {args.label}
        </label>
        <input
          type="email"
          id="tailwindEmail"
          className={
            invalid
              ? 'border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 border-red-500'
              : 'border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
          }
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <p className="text-red-600 text-sm mt-1">Please enter a valid email address.</p>
        )}
      </div>
      <div className="mb-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
          <span className="ml-2">Notifications: {notify ? 'ON' : 'OFF'}</span>
        </label>
      </div>
      <div className="mb-3">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="ml-2">I agree to the terms</span>
        </label>
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-colors disabled:opacity-50"
        disabled={args.disabled || !agreed}
      >
        Submit
      </button>
      {submitted && (
        <div className="mt-3 rounded border border-green-300 bg-green-50 text-green-800 px-4 py-2">
          Submitted: {submitted}
        </div>
      )}
    </form>
  )
}

const meta = {
  title: 'Frameworks/Tailwind/Form',
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
