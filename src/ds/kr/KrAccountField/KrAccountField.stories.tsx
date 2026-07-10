import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../Button/Button'
import { KrField } from '../KrField'
import { KrBankSelect } from '../KrBankSelect/KrBankSelect'
import { KrAccountField } from './KrAccountField'

// 계좌 등록 폼 데모 — 은행 + 계좌번호 + 예금주, '계좌 확인' 목업 버튼으로 성공 상태 전환
function AccountRegisterDemo() {
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [holder, setHolder] = useState('')
  const [verified, setVerified] = useState(false)

  const canVerify = bank !== '' && account.length >= 10 && holder.trim() !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
      <KrBankSelect
        value={bank}
        onChange={(v) => {
          setBank(v)
          setVerified(false)
        }}
      />
      <KrAccountField
        value={account}
        onChange={(v) => {
          setAccount(v)
          setVerified(false)
        }}
        success={verified}
      />
      <KrField
        label="예금주"
        value={holder}
        onChange={(v) => {
          setHolder(v)
          setVerified(false)
        }}
        placeholder="예금주명 입력"
        success={verified}
        helperText={verified ? '예금주명이 확인되었습니다' : undefined}
      />
      {/* DS Button은 onClick을 노출하지 않아(매니페스트 공개 props 고정) 래퍼에서 클릭 처리 */}
      <span onClick={canVerify && !verified ? () => setVerified(true) : undefined}>
        <Button
          variant="primary"
          size="md"
          label={verified ? '확인 완료' : '계좌 확인'}
          disabled={!canVerify}
        />
      </span>
    </div>
  )
}

const meta = {
  title: '6. KR 컴포넌트/계좌번호',
  component: KrAccountField,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    label: '계좌번호',
    disabled: false,
    error: false,
    success: false,
    helperText: '숫자만 입력하세요',
  },
  argTypes: {
    onChange: { control: false },
  },
} satisfies Meta<typeof KrAccountField>

export default meta
type Story = StoryObj<typeof meta>

// 계좌 등록 폼 — 은행 선택 + 계좌번호 + 예금주 조합
export const Default: Story = {
  render: () => <AccountRegisterDemo />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <KrAccountField value="11012345678901" onChange={() => {}} />
      <KrAccountField
        value="110123"
        onChange={() => {}}
        error
        helperText="계좌번호를 다시 확인해 주세요"
      />
      <KrAccountField
        value="11012345678901"
        onChange={() => {}}
        success
        helperText="계좌 확인이 완료되었습니다"
      />
      <KrAccountField value="11012345678901" onChange={() => {}} disabled />
    </div>
  ),
}
