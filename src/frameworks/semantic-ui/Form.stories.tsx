import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import css from 'semantic-ui-css/semantic.min.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

const PLANS = ['Free', 'Pro', 'Team'] as const

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [country, setCountry] = useState('kr')
  const [plan, setPlan] = useState<(typeof PLANS)[number]>('Free')
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      className="ui form"
      style={{ width: '20rem' }}
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <div className={`field${invalid ? ' error' : ''}`}>
        <label htmlFor="suiEmail">{args.label}</label>
        <input
          type="email"
          id="suiEmail"
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <div className="ui pointing red basic label">
            Please enter a valid email address.
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="suiCountry">Country</label>
        <select
          id="suiCountry"
          value={country}
          disabled={args.disabled}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="kr">South Korea</option>
          <option value="us">United States</option>
          <option value="jp">Japan</option>
        </select>
      </div>
      <div className="grouped fields">
        <label>Plan</label>
        {PLANS.map((p) => (
          <div className="field" key={p}>
            {/* jQuery 미로드 — checked 클래스는 React 상태로 토글 */}
            <div className={`ui radio checkbox${plan === p ? ' checked' : ''}`}>
              <input
                type="radio"
                id={`suiPlan${p}`}
                name="plan"
                checked={plan === p}
                disabled={args.disabled}
                onChange={() => setPlan(p)}
              />
              <label htmlFor={`suiPlan${p}`}>{p}</label>
            </div>
          </div>
        ))}
      </div>
      <div className="field">
        <div className={`ui toggle checkbox${notify ? ' checked' : ''}`}>
          <input
            type="checkbox"
            id="suiNotify"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />
          <label htmlFor="suiNotify">Notifications: {notify ? 'ON' : 'OFF'}</label>
        </div>
      </div>
      <div className="field">
        <div className={`ui checkbox${agreed ? ' checked' : ''}`}>
          <input
            type="checkbox"
            id="suiAgree"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="suiAgree">I agree to the terms</label>
        </div>
      </div>
      <button
        type="submit"
        className={`ui primary ${agreed ? '' : 'disabled '}button`}
        disabled={!agreed}
      >
        Submit
      </button>
      {submitted && <div className="ui positive message">Submitted: {submitted}</div>}
    </form>
  )
}

// 카드마다 독립 Shadow DOM 스코프 — 시트 크롬(캔버스/카드)은 밖, Semantic 마크업만 안쪽에 둔다.
function Scope({ children }: { children: ReactNode }) {
  return (
    <FrameworkScope styles={[css, formSkinCss]} rootClassName="ui">
      {children}
    </FrameworkScope>
  )
}

// 인터랙션 상태는 스코프 내부의 데모 컴포넌트가 소유 — 상태 변경이 Shadow DOM을 재구성하지 않는다.
function ChecksDemo() {
  const [plain, setPlain] = useState(true)
  const [toggle, setToggle] = useState(true)
  const [slider, setSlider] = useState(false)

  return (
    <div className="ui form">
      <div className="grouped fields">
        <label>Checkbox</label>
        <div className="field">
          <div className={`ui checkbox${plain ? ' checked' : ''}`}>
            <input
              type="checkbox"
              id="suiGalleryCheck"
              checked={plain}
              onChange={(e) => setPlain(e.target.checked)}
            />
            <label htmlFor="suiGalleryCheck">Accept terms</label>
          </div>
        </div>
      </div>
      <div className="grouped fields">
        <label>Toggle</label>
        <div className="field">
          <div className={`ui toggle checkbox${toggle ? ' checked' : ''}`}>
            <input
              type="checkbox"
              id="suiGalleryToggle"
              checked={toggle}
              onChange={(e) => setToggle(e.target.checked)}
            />
            <label htmlFor="suiGalleryToggle">Email notifications</label>
          </div>
        </div>
      </div>
      <div className="grouped fields">
        <label>Slider</label>
        <div className="field">
          <div className={`ui slider checkbox${slider ? ' checked' : ''}`}>
            <input
              type="checkbox"
              id="suiGallerySlider"
              checked={slider}
              onChange={(e) => setSlider(e.target.checked)}
            />
            <label htmlFor="suiGallerySlider">Compact mode</label>
          </div>
        </div>
      </div>
    </div>
  )
}

function InlineFieldsDemo() {
  const [size, setSize] = useState('Medium')

  return (
    <div className="ui form">
      <div className="inline fields">
        <label>Size</label>
        {['Small', 'Medium', 'Large'].map((s) => (
          <div className="field" key={s}>
            <div className={`ui radio checkbox${size === s ? ' checked' : ''}`}>
              <input
                type="radio"
                id={`suiGallerySize${s}`}
                name="gallerySize"
                checked={size === s}
                onChange={() => setSize(s)}
              />
              <label htmlFor={`suiGallerySize${s}`}>{s}</label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormGallery() {
  return (
    <SheetCanvas>
      <SheetCard title="Inputs">
        <Scope>
          <div className="ui form">
            <div className="field">
              <label htmlFor="suiGalleryNormal">Normal</label>
              <input type="text" id="suiGalleryNormal" placeholder="Jane Cooper" />
            </div>
            <div className="disabled field">
              <label htmlFor="suiGalleryDisabled">Disabled</label>
              <input type="text" id="suiGalleryDisabled" placeholder="Jane Cooper" disabled />
            </div>
            {/* 소프트 모던 스킨 검증 상태 — success 보더 + skin-help 텍스트 */}
            <div className="success field">
              <label htmlFor="suiGallerySuccess">정상</label>
              <input type="email" id="suiGallerySuccess" defaultValue="jane@example.com" />
              <span className="skin-help skin-help--success">사용 가능한 이메일입니다</span>
            </div>
            <div className="error field">
              <label htmlFor="suiGalleryError">에러</label>
              <input type="text" id="suiGalleryError" defaultValue="invalid value" />
              <div className="ui pointing red basic label">필수 입력 항목입니다</div>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Select">
        <Scope>
          <div className="ui form">
            <div className="field">
              <label htmlFor="suiGallerySelect">Select</label>
              <select id="suiGallerySelect" defaultValue="kr">
                <option value="kr">South Korea</option>
                <option value="us">United States</option>
                <option value="jp">Japan</option>
              </select>
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Checks">
        <Scope>
          <ChecksDemo />
        </Scope>
      </SheetCard>
      <SheetCard title="Textarea">
        <Scope>
          <div className="ui form">
            <div className="field">
              <label htmlFor="suiGalleryTextarea">Textarea</label>
              <textarea
                id="suiGalleryTextarea"
                rows={3}
                placeholder="Tell us more about your project..."
              />
            </div>
          </div>
        </Scope>
      </SheetCard>
      <SheetCard title="Inline">
        <Scope>
          <InlineFieldsDemo />
        </Scope>
      </SheetCard>
      <SheetCard title="Messages">
        <Scope>
          {/* success+error 상태 클래스를 한 폼에 얹어 두 메시지를 함께 표시 — 간격은 .ui.message 기본 리듬에 맡긴다 */}
          <div className="ui success error form">
            <div className="ui success message">
              <div className="header">Form completed</div>
              <p>You are now signed up for the newsletter.</p>
            </div>
            <div className="ui error message">
              <div className="header">Action forbidden</div>
              <p>You can only sign up for an account once.</p>
            </div>
          </div>
        </Scope>
      </SheetCard>
    </SheetCanvas>
  )
}

const meta = {
  title: 'Frameworks/Semantic UI/Form',
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
    <FrameworkScope styles={[css, formSkinCss]} rootClassName="ui">
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

export const Gallery: Story = {
  render: () => <FormGallery />,
}
