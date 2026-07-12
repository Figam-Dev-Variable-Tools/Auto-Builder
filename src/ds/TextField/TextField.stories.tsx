import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { TextField } from './TextField'
import styles from './TextField.module.css'

const meta = {
  title: '3. 컴포넌트/Input/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    placeholder: 'name@example.com',
    error: false,
    success: false,
    disabled: false,
    readOnly: false,
    description: '업무용 이메일을 입력하세요.',
    showDescription: true,
    helperText: '',
    maxLength: 1000,
    showCounter: false,
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TextField label="Email" placeholder="name@example.com" />
      <TextField
        label="Email"
        placeholder="name@example.com"
        description="업무용 이메일을 입력하세요."
        showDescription
      />
      <TextField
        label="Email"
        placeholder="name@example.com"
        error
        description="올바른 이메일 형식이 아닙니다."
        showDescription
      />
      <TextField label="Email" placeholder="name@example.com" disabled />
    </div>
  ),
}

// 레퍼런스 시트의 Input 카드 재현 — default/focus/counter/error/disabled 스택
export const Showcase: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        maxWidth: 400,
        padding: 28,
        background: 'var(--ds-color-bg)',
        border: '1px solid var(--ds-color-border)',
        borderRadius: 'var(--ds-radius-lg)',
        boxShadow: '0 1px 3px color-mix(in srgb, var(--ds-color-text) 8%, transparent)',
      }}
    >
      <TextField label="이메일" placeholder="name@example.com" />
      <div className={styles.focusDemo}>
        <TextField label="이메일 (focus)" placeholder="name@example.com" />
      </div>
      <TextField label="소개" placeholder="내용을 입력해 주세요." maxLength={1000} showCounter />
      <TextField
        label="이메일"
        placeholder="name@example.com"
        error
        helperText="올바른 이메일 형식이 아닙니다."
      />
      <TextField
        label="이메일"
        placeholder="name@example.com"
        success
        helperText="사용 가능한 이메일입니다."
      />
      <TextField label="이메일" placeholder="name@example.com" disabled />
    </div>
  ),
}
