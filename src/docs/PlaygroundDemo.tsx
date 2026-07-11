import { useState } from 'react'
import { ThemeScope } from '../shared/ThemeScope'
import { Button } from '../ds/Button/Button'
import { EmailField } from '../ds/EmailField/EmailField'
import { PasswordField } from '../ds/PasswordField/PasswordField'
import { Select } from '../ds/Select/Select'
import { MultiSelect } from '../ds/MultiSelect/MultiSelect'
import { DatePicker } from '../ds/DatePicker/DatePicker'
import { Toggle } from '../ds/Toggle/Toggle'
import { Checkbox } from '../ds/Checkbox/Checkbox'
import { Dialog } from '../ds/Dialog/Dialog'
import { Snackbar } from '../ds/Snackbar/Snackbar'

const ROLE_OPTIONS = [
  { value: 'design', label: '디자인' },
  { value: 'dev', label: '개발' },
  { value: 'plan', label: '기획' },
  { value: 'qa', label: 'QA' },
]

const SKILL_OPTIONS = [
  { value: 'figma', label: 'Figma' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'react', label: 'React' },
  { value: 'tokens', label: 'Design Tokens' },
]

/** '8. Playground' — DS 컴포넌트 통합 폼 데모 (입력 → 검증 → 확인 → 완료 알림) */
export function PlaygroundDemo() {
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [joinDate, setJoinDate] = useState<Date | null>(null)
  const [notify, setNotify] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)

  const passwordShort = password !== '' && password.length < 8
  const canSubmit = emailValid && password.length >= 8 && role != null && agreed

  return (
    <ThemeScope preset="toss">
      <div
        style={{
          fontFamily: 'var(--ds-font-family)',
          background: 'var(--ds-color-bg)',
          border: '1px solid var(--ds-color-border)',
          borderRadius: 'var(--ds-radius-lg)',
          padding: 'var(--ds-spacing-6)',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ds-spacing-5)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--ds-font-size-lg)',
              color: 'var(--ds-color-text)',
            }}
          >
            팀 온보딩 신청
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--ds-font-size-sm)',
              color: 'var(--ds-color-secondary)',
            }}
          >
            DS 컴포넌트 12종을 조합한 라이브 데모입니다.
          </p>
        </div>

        <EmailField value={email} onChange={setEmail} onValidChange={setEmailValid} required />
        <PasswordField
          value={password}
          onChange={setPassword}
          required
          error={passwordShort}
          helperText={passwordShort ? '8자 이상 입력하세요.' : '8자 이상, 영문·숫자·특수문자 조합'}
        />
        <Select label="직군" value={role} onChange={setRole} options={ROLE_OPTIONS} />
        <MultiSelect
          label="사용 기술"
          values={skills}
          onChange={setSkills}
          options={SKILL_OPTIONS}
          maxSelected={3}
          helperText="최대 3개까지 선택할 수 있습니다."
        />
        <DatePicker label="합류 예정일" value={joinDate} onChange={setJoinDate} />
        <Toggle checked={notify} onChange={setNotify} label={`온보딩 알림 받기 — ${notify ? 'ON' : 'OFF'}`} />
        <Checkbox checked={agreed} onChange={setAgreed} label="개인정보 수집·이용에 동의합니다." />

        <Button
          variant="primary"
          size="lg"
          label="신청하기"
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
        />

        <Dialog
          open={confirmOpen}
          variant="confirm"
          title="신청할까요?"
          description={`${email} 계정으로 온보딩을 신청합니다.`}
          confirmLabel="신청"
          cancelLabel="취소"
          onConfirm={() => {
            setConfirmOpen(false)
            setDoneOpen(true)
          }}
          onCancel={() => setConfirmOpen(false)}
        />
        <Snackbar
          open={doneOpen}
          variant="success"
          message="온보딩 신청이 완료되었습니다."
          onClose={() => setDoneOpen(false)}
        />
      </div>
    </ThemeScope>
  )
}
