import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import css from 'materialize-css/dist/css/materialize.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

const PLANS = ['starter', 'pro', 'team']

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [country, setCountry] = useState('')
  const [plan, setPlan] = useState('starter')
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      style={{ width: '320px' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(`${email} (${plan})`)
      }}
    >
      {/* 스킨이 라벨을 상단 고정(static)으로 바꾸므로 라벨을 인풋 앞에 배치. active는 시맨틱 유지용 */}
      <div className="input-field">
        <label htmlFor="mzEmail" className={email ? 'active' : ''}>
          {args.label}
        </label>
        <input
          id="mzEmail"
          type="email"
          className={invalid ? 'skin-error' : ''}
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <span className="skin-help skin-help--error">Please enter a valid email address.</span>
        )}
      </div>
      {/* select 초기화 JS가 없으므로 browser-default 사용 */}
      <div style={{ margin: '0 0 16px' }}>
        <label htmlFor="mzCountry">Country</label>
        <select
          id="mzCountry"
          className="browser-default"
          value={country}
          disabled={args.disabled}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="" disabled>
            Choose a country
          </option>
          <option value="kr">South Korea</option>
          <option value="us">United States</option>
          <option value="jp">Japan</option>
        </select>
      </div>
      <p style={{ margin: '0 0 4px' }}>Plan</p>
      <p style={{ display: 'flex', gap: '16px', margin: '0 0 12px' }}>
        {PLANS.map((value) => (
          <label key={value}>
            <input
              name="mzPlan"
              type="radio"
              className="with-gap"
              checked={plan === value}
              disabled={args.disabled}
              onChange={() => setPlan(value)}
            />
            <span style={{ textTransform: 'capitalize' }}>{value}</span>
          </label>
        ))}
      </p>
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css, formSkinCss]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

// 참조 시트 규약: 그룹 캡션(셀렉트/체크박스/라디오/스위치 등 floating label 불가 컨트롤 분류용)
const CAPTION_STYLE: CSSProperties = {
  display: 'block',
  margin: '0 0 4px',
  fontSize: '0.8rem',
  color: '#9e9e9e',
}

// 블록 간 수직 리듬: 모든 블록 동일 마진, 마지막 블록만 0
const BLOCK_STYLE: CSSProperties = { margin: '0 0 20px' }
const LAST_BLOCK_STYLE: CSSProperties = { margin: 0 }

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Text fields">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            {/* 스킨이 라벨을 상단 고정(static)으로 바꾸므로 라벨을 인풋 앞에 배치. active는 시맨틱 유지용 */}
            <div className="input-field" style={BLOCK_STYLE}>
              <label htmlFor="mzgText" className="active">
                Text
              </label>
              <input id="mzgText" type="text" defaultValue="Jane Doe" />
            </div>
            <div className="input-field" style={BLOCK_STYLE}>
              <label htmlFor="mzgDisabled" className="active">
                Disabled
              </label>
              <input id="mzgDisabled" type="text" defaultValue="Read only" disabled />
            </div>
            <div className="input-field" style={LAST_BLOCK_STYLE}>
              <label htmlFor="mzgTextarea" className="active">
                Textarea
              </label>
              <textarea
                id="mzgTextarea"
                className="materialize-textarea"
                placeholder="A short bio"
              />
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <div className="input-field" style={BLOCK_STYLE}>
              <label htmlFor="mzgValid" className="active">
                정상
              </label>
              <input
                id="mzgValid"
                type="email"
                className="skin-success"
                defaultValue="hong@example.com"
              />
              <span className="skin-help skin-help--success">사용 가능한 이메일입니다</span>
            </div>
            <div className="input-field" style={LAST_BLOCK_STYLE}>
              <label htmlFor="mzgError" className="active">
                에러
              </label>
              <input
                id="mzgError"
                type="email"
                className="skin-error"
                defaultValue="invalid-email"
              />
              <span className="skin-help skin-help--error">필수 입력 항목입니다</span>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Select">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            {/* browser-default 셀렉트는 JS 없이 floating label 불가 → 캡션 라인 사용 */}
            <label htmlFor="mzgSelect" style={CAPTION_STYLE}>
              Select
            </label>
            <select id="mzgSelect" className="browser-default" defaultValue="dev">
              <option value="dev">Developer</option>
              <option value="des">Designer</option>
              <option value="pm">Product manager</option>
            </select>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Selection controls">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <p style={CAPTION_STYLE}>Checkbox</p>
            <p style={{ margin: '0 0 8px' }}>
              <label>
                <input type="checkbox" className="filled-in" defaultChecked />
                <span>Filled-in checkbox</span>
              </label>
            </p>
            <p style={BLOCK_STYLE}>
              <label>
                <input type="checkbox" />
                <span>Default checkbox</span>
              </label>
            </p>
            <p style={CAPTION_STYLE}>Radio</p>
            <p style={{ display: 'flex', gap: '16px', ...BLOCK_STYLE }}>
              <label>
                <input name="mzgRadio" type="radio" className="with-gap" defaultChecked />
                <span>One</span>
              </label>
              <label>
                <input name="mzgRadio" type="radio" className="with-gap" />
                <span>Two</span>
              </label>
            </p>
            <p style={CAPTION_STYLE}>Switch</p>
            <div className="switch" style={LAST_BLOCK_STYLE}>
              <label>
                Off
                <input type="checkbox" defaultChecked />
                <span className="lever"></span>
                On
              </label>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Range & file">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <p style={CAPTION_STYLE}>Range</p>
            <p className="range-field" style={BLOCK_STYLE}>
              <input type="range" min="0" max="100" defaultValue="60" />
            </p>
            {/* file-field도 JS 없이 floating label 불가 → 캡션 라인 사용 */}
            <p style={CAPTION_STYLE}>File</p>
            <div className="file-field input-field" style={LAST_BLOCK_STYLE}>
              <div className="btn">
                <span>File</span>
                <input type="file" />
              </div>
              <div className="file-path-wrapper">
                <input className="file-path" type="text" placeholder="Upload a file" />
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
