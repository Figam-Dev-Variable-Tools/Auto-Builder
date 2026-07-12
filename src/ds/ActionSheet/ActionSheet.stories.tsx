import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { ActionSheet, type ActionSheetProps } from './ActionSheet'

// 컨트롤드 오버레이용 데모 — 실제 fixed 오버레이가 열리고 닫힌다
function ActionSheetDemo(props: ActionSheetProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" size="md" label="열기" onClick={() => setOpen(true)} />
      <ActionSheet {...props} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const meta = {
  title: '3. 컴포넌트/Overlay/ActionSheet',
  component: ActionSheet,
  tags: ['autodocs'],
  args: {
    open: false,
    title: '게시물 관리',
    actions: [
      { label: '링크 복사' },
      { label: '수정하기' },
      { label: '삭제하기', danger: true },
    ],
    cancelLabel: '취소',
    inline: false,
  },
  argTypes: {
    onClose: { control: false },
    actions: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof ActionSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <ActionSheetDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ActionSheet
        inline
        open
        title="게시물 관리"
        actions={[
          { label: '링크 복사' },
          { label: '수정하기' },
          { label: '삭제하기', danger: true },
        ]}
      />
      <ActionSheet
        inline
        open
        actions={[
          { label: '사진 촬영' },
          { label: '앨범에서 선택' },
          { label: '기본 이미지로 변경', disabled: true },
        ]}
        cancelLabel="닫기"
      />
    </div>
  ),
}
