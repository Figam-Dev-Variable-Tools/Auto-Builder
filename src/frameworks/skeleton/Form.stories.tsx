import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

// Skeleton 공식 문서의 폼 예제를 본뜬 문의 폼 컴포지션
function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      style={{ maxWidth: 480 }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className="row">
        <div className="six columns">
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
            <p style={{ color: '#D9534F', fontSize: '1.2rem', marginTop: '-1rem' }}>
              Please enter a valid email address.
            </p>
          )}
        </div>
        <div className="six columns">
          <label htmlFor="skReason">Reason for contacting</label>
          <select className="u-full-width" id="skReason" disabled={args.disabled}>
            <option>Questions</option>
            <option>Admiration</option>
            <option>Can I get your number?</option>
          </select>
        </div>
      </div>
      <label htmlFor="skMessage">Message</label>
      <textarea
        className="u-full-width"
        id="skMessage"
        placeholder="Hi there…"
        disabled={args.disabled}
      />
      <label>
        <input
          type="checkbox"
          checked={agreed}
          disabled={args.disabled}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span className="label-body">Send a copy to yourself</span>
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
  args: { label: 'Your email', placeholder: 'name@example.com', disabled: false },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
    noDsTheme: true,
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Inputs" span={2}>
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <div className="row">
            <div className="six columns">
              <label htmlFor="skGalleryText">Text</label>
              <input
                className="u-full-width"
                type="text"
                id="skGalleryText"
                placeholder="Jane Doe"
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="six columns">
              <label htmlFor="skGalleryEmail">Email</label>
              <input
                className="u-full-width"
                type="email"
                id="skGalleryEmail"
                placeholder="name@example.com"
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Select">
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <label htmlFor="skGallerySelect">Select</label>
          <select
            className="u-full-width"
            id="skGallerySelect"
            defaultValue="Korea"
            style={{ marginBottom: 0 }}
          >
            <option>Korea</option>
            <option>Japan</option>
            <option>United States</option>
          </select>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Textarea">
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <label htmlFor="skGalleryTextarea">Textarea</label>
          <textarea
            className="u-full-width"
            id="skGalleryTextarea"
            placeholder="Hi there…"
            style={{ marginBottom: 0 }}
          />
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation" span={2}>
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <div className="row">
            <div className="six columns">
              <label htmlFor="skGallerySuccess">정상</label>
              <input
                className="u-full-width skin-success"
                type="email"
                id="skGallerySuccess"
                defaultValue="jane@example.com"
                style={{ marginBottom: 0 }}
              />
              <span className="skin-help skin-help--success">사용 가능한 이메일입니다</span>
            </div>
            <div className="six columns">
              <label htmlFor="skGalleryError">에러</label>
              <input
                className="u-full-width skin-error"
                type="email"
                id="skGalleryError"
                defaultValue="invalid-email"
                style={{ marginBottom: 0 }}
              />
              <span className="skin-help skin-help--error">필수 입력 항목입니다</span>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Choices">
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <label>Checkbox</label>
          <label>
            <input type="checkbox" defaultChecked />
            <span className="label-body">Subscribe to the newsletter</span>
          </label>
          <label>Radio</label>
          <label>
            <input type="radio" name="skGalleryPlan" defaultChecked />
            <span className="label-body">Free plan</span>
          </label>
          <label style={{ marginBottom: 0 }}>
            <input type="radio" name="skGalleryPlan" />
            <span className="label-body">Pro plan</span>
          </label>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Disabled">
        <FrameworkScope styles={[normalize, skeleton, formSkinCss]}>
          <label htmlFor="skGalleryDisabled">Disabled</label>
          <input
            className="u-full-width"
            type="email"
            id="skGalleryDisabled"
            placeholder="name@example.com"
            disabled
          />
          <input
            className="button-primary"
            type="submit"
            value="Submit"
            disabled
            style={{ marginBottom: 0 }}
          />
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
