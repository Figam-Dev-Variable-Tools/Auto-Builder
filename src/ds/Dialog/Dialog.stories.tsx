import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { Dialog, type DialogProps } from './Dialog'

// 컨트롤드 오버레이용 데모 — 실제 fixed 오버레이가 열리고 닫힌다
function DialogDemo(props: DialogProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" size="md" label="열기" onClick={() => setOpen(true)} />
      <Dialog
        {...props}
        open={open}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

const meta = {
  title: '3. 컴포넌트/Overlay/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  args: {
    open: false,
    variant: 'confirm',
    title: '댓글을 삭제할까요?',
    description: '삭제한 댓글은 되돌릴 수 없어요.',
    confirmLabel: '확인',
    cancelLabel: '취소',
    danger: false,
    placeholder: '내용을 입력해 주세요',
    inline: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['alert', 'confirm', 'prompt'] },
    onConfirm: { control: false },
    onCancel: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DialogDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Dialog
        inline
        open
        variant="alert"
        title="저장이 완료됐어요"
        description="변경 사항이 안전하게 저장됐어요."
      />
      <Dialog
        inline
        open
        variant="confirm"
        title="변경 사항을 저장할까요?"
        description="저장하지 않으면 수정한 내용이 사라져요."
        confirmLabel="저장"
      />
      <Dialog
        inline
        open
        variant="confirm"
        danger
        title="계정을 탈퇴할까요?"
        description="탈퇴하면 모든 데이터가 삭제되고 되돌릴 수 없어요."
        confirmLabel="탈퇴하기"
      />
      <Dialog
        inline
        open
        variant="prompt"
        title="닉네임 변경"
        description="새로운 닉네임을 입력해 주세요."
        placeholder="닉네임"
        confirmLabel="변경"
      />
    </div>
  ),
}
