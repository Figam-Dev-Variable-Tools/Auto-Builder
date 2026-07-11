import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import css from 'bootstrap/dist/css/bootstrap.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

const PLANS = ['Free', 'Pro', 'Enterprise'] as const

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [role, setRole] = useState('')
  const [plan, setPlan] = useState<(typeof PLANS)[number]>('Free')
  const [message, setMessage] = useState('')
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      style={{ width: '22rem' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(`${email} · ${role || 'no role'} · ${plan}`)
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
      <div className="mb-3">
        <label htmlFor="bootstrapRole" className="form-label">
          Role
        </label>
        <select
          className="form-select"
          id="bootstrapRole"
          value={role}
          disabled={args.disabled}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Choose a role…</option>
          <option value="Designer">Designer</option>
          <option value="Developer">Developer</option>
          <option value="Product manager">Product manager</option>
        </select>
      </div>
      <fieldset className="mb-3">
        <legend className="form-label fs-6">Plan</legend>
        {PLANS.map((p) => (
          <div className="form-check form-check-inline" key={p}>
            <input
              className="form-check-input"
              type="radio"
              name="bootstrapPlan"
              id={`bootstrapPlan${p}`}
              checked={plan === p}
              disabled={args.disabled}
              onChange={() => setPlan(p)}
            />
            <label className="form-check-label" htmlFor={`bootstrapPlan${p}`}>
              {p}
            </label>
          </div>
        ))}
      </fieldset>
      <div className="mb-3">
        <label htmlFor="bootstrapMessage" className="form-label">
          Message <span className="text-body-secondary">(optional)</span>
        </label>
        <textarea
          className="form-control"
          id="bootstrapMessage"
          rows={3}
          placeholder="Tell us a bit about your project"
          value={message}
          disabled={args.disabled}
          onChange={(e) => setMessage(e.target.value)}
        />
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css, formSkinCss]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Input States">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-3">
            <label htmlFor="galleryInputNormal" className="form-label">
              Normal
            </label>
            <input
              type="text"
              className="form-control"
              id="galleryInputNormal"
              placeholder="text"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="galleryInputFocused" className="form-label">
              Focused (simulated)
            </label>
            <input
              type="text"
              className="form-control is-focused"
              id="galleryInputFocused"
              placeholder="text"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="galleryInputDisabled" className="form-label">
              Disabled
            </label>
            <input
              type="text"
              className="form-control"
              id="galleryInputDisabled"
              placeholder="text"
              disabled
            />
          </div>
          <div className="mb-0">
            <label htmlFor="galleryInputReadonly" className="form-label">
              Readonly
            </label>
            <input
              type="text"
              className="form-control"
              id="galleryInputReadonly"
              defaultValue="Read-only text"
              readOnly
            />
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-3">
            <label htmlFor="galleryInputValid" className="form-label">
              정상
            </label>
            <input
              type="text"
              className="form-control is-valid"
              id="galleryInputValid"
              defaultValue="valid@example.com"
            />
            <div className="valid-feedback">사용 가능한 이메일입니다</div>
          </div>
          <div className="mb-0">
            <label htmlFor="galleryInputInvalid" className="form-label">
              에러
            </label>
            <input
              type="text"
              className="form-control is-invalid"
              id="galleryInputInvalid"
              defaultValue="not-an-email"
            />
            <div className="invalid-feedback">필수 입력 항목입니다</div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Checks & Radios">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-3">
            <div className="form-text mt-0 mb-1">Checkbox</div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="galleryCheck1" />
              <label className="form-check-label" htmlFor="galleryCheck1">
                Default checkbox
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="galleryCheck2"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="galleryCheck2">
                Checked checkbox
              </label>
            </div>
          </div>
          <div className="mb-3">
            <div className="form-text mt-0 mb-1">Switch</div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="gallerySwitch1"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="gallerySwitch1">
                Switch on
              </label>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="gallerySwitch2"
                disabled
              />
              <label className="form-check-label" htmlFor="gallerySwitch2">
                Switch disabled
              </label>
            </div>
          </div>
          <div className="mb-0">
            <div className="form-text mt-0 mb-1">Radio button</div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="galleryRadios"
                id="galleryRadio1"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="galleryRadio1">
                Radio one
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="galleryRadios"
                id="galleryRadio2"
              />
              <label className="form-check-label" htmlFor="galleryRadio2">
                Radio two
              </label>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Select">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-3">
            <label htmlFor="gallerySelectDefault" className="form-label">
              Default
            </label>
            <select className="form-select" id="gallerySelectDefault" defaultValue="1">
              <option value="1">Option one</option>
              <option value="2">Option two</option>
              <option value="3">Option three</option>
            </select>
          </div>
          <div className="mb-0">
            <label htmlFor="gallerySelectSmall" className="form-label">
              Small
            </label>
            <select className="form-select form-select-sm" id="gallerySelectSmall" defaultValue="1">
              <option value="1">Option one</option>
              <option value="2">Option two</option>
            </select>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Input Group">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-3">
            <label htmlFor="galleryGroupUsername" className="form-label">
              Username
            </label>
            <div className="input-group">
              <span className="input-group-text">@</span>
              <input
                type="text"
                className="form-control"
                id="galleryGroupUsername"
                placeholder="username"
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="galleryGroupAmount" className="form-label">
              Amount
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="text"
                className="form-control"
                id="galleryGroupAmount"
                placeholder="0"
              />
              <span className="input-group-text">.00</span>
            </div>
          </div>
          <div className="mb-0">
            <label htmlFor="galleryGroupSearch" className="form-label">
              Search
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="galleryGroupSearch"
                placeholder="Search…"
              />
              <button className="btn btn-outline-secondary" type="button">
                Go
              </button>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Floating Label">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="form-floating">
            <input
              type="email"
              className="form-control"
              id="galleryFloating"
              placeholder="name@example.com"
            />
            <label htmlFor="galleryFloating">Email address</label>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Range">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="mb-0">
            <label htmlFor="galleryRange" className="form-label">
              Volume
            </label>
            <input type="range" className="form-range" id="galleryRange" defaultValue={60} />
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
