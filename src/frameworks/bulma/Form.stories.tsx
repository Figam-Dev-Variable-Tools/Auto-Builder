import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import css from 'bulma/css/bulma.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

const CONTACT_METHODS = ['Email', 'Phone', 'SMS'] as const

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [plan, setPlan] = useState('Pro')
  const [contact, setContact] = useState<string>('Email')
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      style={{ width: '20rem' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(`${email} · ${plan} · ${contact}`)
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
        <label htmlFor="bulmaPlan" className="label">
          Plan
        </label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              id="bulmaPlan"
              value={plan}
              disabled={args.disabled}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>
      <div className="field">
        <label className="label">Contact preference</label>
        <div className="control">
          {CONTACT_METHODS.map((method) => (
            <label key={method} className="radio">
              <input
                type="radio"
                name="bulmaContact"
                checked={contact === method}
                disabled={args.disabled}
                onChange={() => setContact(method)}
              />{' '}
              {method}
            </label>
          ))}
        </div>
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css, formSkinCss]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

// 폼 컨트롤 전체 변형 모음 (정적 표시용) — 참조 시트 룩(캔버스 + 카드) 구성
export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Input states">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <div className="field">
              <label className="label">Normal</label>
              <div className="control">
                <input className="input" type="text" placeholder="text" />
              </div>
              <p className="help">Helper text</p>
            </div>
            <div className="field">
              <label className="label">Hovered</label>
              <div className="control">
                <input className="input is-hovered" type="text" placeholder="text" />
              </div>
              <p className="help">Uses the is-hovered modifier</p>
            </div>
            <div className="field">
              <label className="label">Focused</label>
              <div className="control">
                <input className="input is-focused" type="text" placeholder="text" />
              </div>
              <p className="help">Uses the is-focused modifier</p>
            </div>
            <div className="field">
              <label className="label">Disabled</label>
              <div className="control">
                <input className="input" type="text" placeholder="text" disabled />
              </div>
              <p className="help">This field is disabled</p>
            </div>
            <div className="field">
              <label className="label">Readonly</label>
              <div className="control">
                <input className="input" type="text" value="Read only" readOnly />
              </div>
              <p className="help">This field is read only</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <div className="field">
              <label className="label">정상</label>
              <div className="control">
                <input
                  className="input is-success"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue="hong@example.com"
                />
              </div>
              <p className="help is-success">사용 가능한 이메일입니다</p>
            </div>
            <div className="field">
              <label className="label">에러</label>
              <div className="control">
                <input
                  className="input is-danger"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue="hello@"
                />
              </div>
              <p className="help is-danger">필수 입력 항목입니다</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Select">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="field">
            <label className="label">Plan</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select defaultValue="Pro">
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <p className="help">Choose the plan that fits your team</p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Checkbox & radio">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <div className="field">
              <label className="label is-small">Checkbox</label>
              <div className="control">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
              </div>
            </div>
            <div className="field">
              <label className="label is-small">Radio</label>
              <div className="control">
                <label className="radio">
                  <input type="radio" name="galleryRadio" defaultChecked /> Yes
                </label>
                <label className="radio">
                  <input type="radio" name="galleryRadio" /> No
                </label>
                <label className="radio">
                  <input type="radio" name="galleryRadio" disabled /> Maybe (disabled)
                </label>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Textarea">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="field">
            <label className="label">Message</label>
            <div className="control">
              <textarea className="textarea" rows={3} placeholder="Tell us more…" />
            </div>
            <p className="help">Optional — a couple of sentences is plenty</p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Addons">
        <FrameworkScope styles={[css, formSkinCss]}>
          {/* field.has-addons는 flex 컨테이너라 라벨은 애드온 그룹 위에 따로 둔다 */}
          <div>
            <label className="label">Repository</label>
            <div className="field has-addons">
              <div className="control is-expanded">
                <input className="input" type="text" placeholder="Find a repository" />
              </div>
              <div className="control">
                <button type="button" className="button is-link">
                  Search
                </button>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Horizontal field" span={2}>
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Name</label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control">
                  <input className="input" type="text" placeholder="First" />
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <input className="input" type="text" placeholder="Last" />
                </div>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
