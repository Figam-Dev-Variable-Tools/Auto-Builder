import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FrameworkScope } from '../../shared/FrameworkScope'
import { SheetCanvas, SheetCard } from '../../shared/ShowcaseSheet'
import { FIGMA_FILE } from '../../shared/figma'
import { formSkinCss } from '../../shared/formSkin'
import css from './tailwind.generated.css?inline'

type Args = {
  label: string
  placeholder: string
  disabled: boolean
}

// Tailwind JIT scans this file: every class must be a full literal string.
// 보더/배경/라운드/패딩/포커스 링은 formSkinCss(소프트 모던 스킨)가 !important로 담당하므로
// 인풋 유틸에는 레이아웃(w-full)과 상태 훅(.skin-error)만 남긴다.
const INPUT_NORMAL = 'w-full'
const INPUT_ERROR = 'w-full skin-error'

const LABEL_CLASSES = 'mb-1 block text-sm font-medium text-gray-700'

const CHANNEL_OPTIONS: [string, string][] = [
  ['email', 'Email'],
  ['sms', 'Text message'],
  ['none', "Don't contact me"],
]

function FormDemo(args: Args) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [plan, setPlan] = useState('starter')
  const [channel, setChannel] = useState('email')
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      className="w-96 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(email)
      }}
    >
      <h3 className="text-base font-semibold text-gray-900">Create your account</h3>
      <p className="mt-1 text-sm text-gray-500">Start your 14-day free trial. No card required.</p>
      <div className="mt-5 mb-4">
        <label htmlFor="tailwindEmail" className={LABEL_CLASSES}>
          {args.label}
        </label>
        <input
          type="email"
          id="tailwindEmail"
          className={invalid ? INPUT_ERROR : INPUT_NORMAL}
          placeholder={args.placeholder}
          value={email}
          disabled={args.disabled}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid || undefined}
        />
        {invalid && <p className="skin-help skin-help--error">Please enter a valid email address.</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="tailwindPlan" className={LABEL_CLASSES}>
          Plan
        </label>
        <select
          id="tailwindPlan"
          className="w-full"
          value={plan}
          disabled={args.disabled}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option value="starter">Starter — free</option>
          <option value="pro">Pro — $29/mo</option>
          <option value="team">Team — $99/mo</option>
        </select>
      </div>
      <fieldset className="mb-4">
        <legend className={LABEL_CLASSES}>Contact preference</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {CHANNEL_OPTIONS.map(([value, label]) => (
            <label key={value} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="tailwindChannel"
                className="h-4 w-4 accent-blue-600"
                value={value}
                checked={channel === value}
                disabled={args.disabled}
                onChange={() => setChannel(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mb-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={notify}
            disabled={args.disabled}
            onChange={(e) => setNotify(e.target.checked)}
          />
          <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5"></div>
          <span className="ml-2 text-sm text-gray-700">Notifications: {notify ? 'ON' : 'OFF'}</span>
        </label>
      </div>
      <div className="mb-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-blue-600"
            checked={agreed}
            disabled={args.disabled}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I agree to the terms of service
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={args.disabled || !agreed}
      >
        Create account
      </button>
      {submitted && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-800">
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
type Story = StoryObj<Args>

export const Default: Story = {
  render: (args) => (
    <FrameworkScope styles={[css, formSkinCss]}>
      <FormDemo {...args} />
    </FrameworkScope>
  ),
}

// 참조 디자인 시트 갤러리 — 액센트는 #3D6BFF 계열, 클래스는 전부 완전한 리터럴 문자열
// 인풋 비주얼(#F7F8FA 필드, 10px 라운드, 포커스 링, 상태 보더)은 formSkinCss가 담당 — 유틸은 레이아웃만
const G_LABEL = 'mb-1.5 block text-[13px] font-semibold text-gray-700'
const G_INPUT = 'w-full'

// 참조 시안의 글자수 카운터 입력 — 상태는 컴포넌트 내부에 유지
function CounterField() {
  const [value, setValue] = useState('')
  return (
    <div>
      <label htmlFor="twGalleryCounter" className={G_LABEL}>
        Counter
      </label>
      <input
        id="twGalleryCounter"
        type="text"
        maxLength={1000}
        className={G_INPUT}
        placeholder="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="mt-1.5 text-right text-[12px] text-gray-400">{value.length}/1000자</p>
    </div>
  )
}

export const Gallery: Story = {
  render: () => (
    <SheetCanvas>
      <SheetCard title="Text field">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGalleryDefault" className={G_LABEL}>
                Default
              </label>
              <input id="twGalleryDefault" type="text" className={G_INPUT} placeholder="text" />
            </div>
            <CounterField />
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Validation">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGallerySuccess" className={G_LABEL}>
                정상
              </label>
              <input
                id="twGallerySuccess"
                type="email"
                className="w-full skin-success"
                placeholder="name@example.com"
                defaultValue="hong@example.com"
              />
              <p className="skin-help skin-help--success">사용 가능한 이메일입니다</p>
            </div>
            <div>
              <label htmlFor="twGalleryError" className={G_LABEL}>
                에러
              </label>
              <input
                id="twGalleryError"
                type="email"
                className="w-full skin-error"
                placeholder="name@example.com"
                defaultValue="hello@"
                aria-invalid="true"
              />
              <p className="skin-help skin-help--error">필수 입력 항목입니다</p>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Focus ring">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGalleryFocusShown" className={G_LABEL}>
                Focused (shown)
              </label>
              {/* 스킨의 .input.is-focused 훅으로 포커스 상태를 고정 표시 */}
              <input
                id="twGalleryFocusShown"
                type="text"
                className="input is-focused w-full"
                placeholder="text"
              />
            </div>
            <div>
              <label htmlFor="twGalleryFocusLive" className={G_LABEL}>
                Try it
              </label>
              <input id="twGalleryFocusLive" type="text" className={G_INPUT} placeholder="text" />
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="States">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGalleryDisabled" className={G_LABEL}>
                Disabled
              </label>
              <input
                id="twGalleryDisabled"
                type="text"
                className="w-full"
                defaultValue="Cannot edit this"
                disabled
              />
            </div>
            <div>
              <label htmlFor="twGalleryReadonly" className={G_LABEL}>
                Read-only
              </label>
              <input
                id="twGalleryReadonly"
                type="text"
                className="w-full"
                defaultValue="ACME-2024-8841"
                readOnly
              />
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Selection">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGallerySelect" className={G_LABEL}>
                Select
              </label>
              <select id="twGallerySelect" className="w-full">
                <option>Design</option>
                <option>Engineering</option>
                <option>Marketing</option>
              </select>
            </div>
            <div>
              <p className={G_LABEL}>Checkbox</p>
              <div className="flex items-center gap-5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="h-4 w-4 rounded accent-[#3D6BFF]" defaultChecked />
                  Subscribe
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="h-4 w-4 rounded accent-[#3D6BFF]" />
                  Newsletter
                </label>
              </div>
            </div>
            <div>
              <p className={G_LABEL}>Radio button</p>
              <div className="flex items-center gap-5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input type="radio" name="twGalleryRadio" className="h-4 w-4 accent-[#3D6BFF]" defaultChecked />
                  Monthly
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input type="radio" name="twGalleryRadio" className="h-4 w-4 accent-[#3D6BFF]" />
                  Yearly
                </label>
              </div>
            </div>
            <div>
              <p className={G_LABEL}>Toggle</p>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#3D6BFF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#3D6BFF] peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5"></div>
                <span className="ml-2 text-sm text-gray-700">Enable previews</span>
              </label>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Textarea">
        <FrameworkScope styles={[css, formSkinCss]}>
          <div>
            <label htmlFor="twGalleryTextarea" className={G_LABEL}>
              Textarea
            </label>
            <textarea id="twGalleryTextarea" className="w-full" rows={3} placeholder="text" />
            <p className="mt-1.5 text-right text-[12px] text-gray-400">0/1000자</p>
          </div>
        </FrameworkScope>
      </SheetCard>
      <SheetCard title="Input group" span={2}>
        <FrameworkScope styles={[css, formSkinCss]}>
          <div className="space-y-4">
            <div>
              <label htmlFor="twGalleryPrefix" className={G_LABEL}>
                Prefix
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                  https://
                </span>
                <input
                  id="twGalleryPrefix"
                  type="text"
                  className="w-full rounded-r-lg border border-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#3D6BFF] focus:outline-none focus:ring-2 focus:ring-[#3D6BFF]/30"
                  placeholder="yoursite.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="twGalleryWithButton" className={G_LABEL}>
                With button
              </label>
              <div className="flex">
                <input
                  id="twGalleryWithButton"
                  type="email"
                  className="w-full rounded-l-lg border border-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#3D6BFF] focus:outline-none focus:ring-2 focus:ring-[#3D6BFF]/30"
                  placeholder="name@example.com"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-r-lg bg-[#3D6BFF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2F5BF0] active:bg-[#2450DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF]"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </FrameworkScope>
      </SheetCard>
    </SheetCanvas>
  ),
}
