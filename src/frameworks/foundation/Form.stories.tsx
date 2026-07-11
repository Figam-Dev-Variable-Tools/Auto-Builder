import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { FIGMA_FILE } from '../../shared/figma'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { formSkinCss } from '../../shared/formSkin'
import css from 'foundation-sites/dist/css/foundation.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

const PLANS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [country, setCountry] = useState('kr')
  const [plan, setPlan] = useState('basic')
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
      <label>
        Country
        <select value={country} disabled={args.disabled} onChange={(e) => setCountry(e.target.value)}>
          <option value="kr">Korea</option>
          <option value="us">United States</option>
          <option value="jp">Japan</option>
        </select>
      </label>
      <fieldset className="fieldset">
        <legend>Plan</legend>
        {PLANS.map((p) => (
          <label
            key={p.value}
            htmlFor={`fnPlan-${p.value}`}
            style={{ display: 'inline-block', marginRight: '1rem' }}
          >
            <input
              id={`fnPlan-${p.value}`}
              type="radio"
              name="fnPlan"
              value={p.value}
              checked={plan === p.value}
              disabled={args.disabled}
              onChange={() => setPlan(p.value)}
            />{' '}
            {p.label}
          </label>
        ))}
      </fieldset>
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
      <SheetCard title="Text input">
        <FrameworkScope styles={[css, formSkinCss]}>
          <label>
            Text input
            <input type="text" placeholder="Jane Doe" style={{ marginBottom: 0 }} />
          </label>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <label>
              Disabled
              <input type="text" placeholder="Jane Doe" disabled />
            </label>
            <label>
              Readonly
              <input
                type="text"
                defaultValue="Readonly value"
                readOnly
                style={{ marginBottom: 0 }}
              />
            </label>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <label>
              정상
              <input
                type="email"
                className="skin-success"
                defaultValue="jane@example.com"
                style={{ marginBottom: 0 }}
              />
            </label>
            <span className="skin-help skin-help--success">사용 가능한 이메일입니다</span>
            <label className="is-invalid-label" style={{ marginTop: '12px' }}>
              에러
              <input
                type="email"
                className="is-invalid-input"
                placeholder="name@example.com"
                defaultValue="not-an-email"
              />
            </label>
            <span className="form-error is-visible" style={{ marginBottom: 0 }}>
              필수 입력 항목입니다
            </span>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Select">
        <FrameworkScope styles={[css, formSkinCss]}>
          <label>
            Select
            <select defaultValue="kr" style={{ marginBottom: 0 }}>
              <option value="kr">Korea</option>
              <option value="us">United States</option>
              <option value="jp">Japan</option>
            </select>
          </label>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Checkbox & radio">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <fieldset style={{ marginBottom: '1rem' }}>
              <legend>Newsletter</legend>
              <label htmlFor="fnGalCheck">
                <input id="fnGalCheck" type="checkbox" defaultChecked /> Subscribe to newsletter
              </label>
            </fieldset>
            <fieldset style={{ marginBottom: 0 }}>
              <legend>Billing</legend>
              <label htmlFor="fnGalRadioA" style={{ display: 'inline-block', marginRight: '1rem' }}>
                <input id="fnGalRadioA" type="radio" name="fnGalRadio" defaultChecked /> Monthly
              </label>
              <label htmlFor="fnGalRadioB" style={{ display: 'inline-block' }}>
                <input id="fnGalRadioB" type="radio" name="fnGalRadio" /> Yearly
              </label>
            </fieldset>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Textarea">
        <FrameworkScope styles={[css, formSkinCss]}>
          <label>
            Textarea
            <textarea rows={3} placeholder="Write something..." style={{ marginBottom: 0 }} />
          </label>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Input group">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <label htmlFor="fnGalAmount">Input group</label>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-group-label">$</span>
              <input id="fnGalAmount" className="input-group-field" type="number" defaultValue={100} />
              <div className="input-group-button">
                <button type="button" className="button">
                  Send
                </button>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Switch">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="switch" style={{ marginBottom: 0 }}>
            <input className="switch-input" id="fnGalSwitch" type="checkbox" defaultChecked />
            <label className="switch-paddle" htmlFor="fnGalSwitch">
              <span className="show-for-sr">Notifications</span>
            </label>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Slider">
        <FrameworkScope styles={[css, formSkinCss]}>
          {/* JS 미로딩 — 위치는 인라인 스타일로 고정 */}
          <div className="slider" style={{ marginBottom: 0 }}>
            <span
              className="slider-handle"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={40}
              tabIndex={0}
              style={{ left: '40%' }}
            />
            <span className="slider-fill" style={{ width: '40%' }} />
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Fieldset">
        <FrameworkScope styles={[css, formSkinCss]}>
          <fieldset className="fieldset" style={{ margin: 0 }}>
            <legend>Shipping</legend>
            <label htmlFor="fnGalShipA" style={{ display: 'inline-block', marginRight: '1rem' }}>
              <input id="fnGalShipA" type="radio" name="fnGalShip" defaultChecked /> Standard
            </label>
            <label htmlFor="fnGalShipB" style={{ display: 'inline-block' }}>
              <input id="fnGalShipB" type="radio" name="fnGalShip" /> Express
            </label>
          </fieldset>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
