import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { BottomSheet, type BottomSheetProps } from './BottomSheet'

// 컨트롤드 오버레이용 데모 — 실제 fixed 오버레이가 열리고 닫힌다
function BottomSheetDemo(props: BottomSheetProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" size="md" label="열기" onClick={() => setOpen(true)} />
      <BottomSheet {...props} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const meta = {
  title: '3. 컴포넌트/Overlay/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  args: {
    open: false,
    title: '배송지 선택',
    children: '자주 쓰는 배송지를 선택하거나 새 배송지를 추가할 수 있어요.',
    showHandle: true,
    inline: false,
  },
  argTypes: {
    onClose: { control: false },
    children: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof BottomSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <BottomSheetDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
      <BottomSheet inline open title="배송지 선택" showHandle>
        자주 쓰는 배송지를 선택하거나 새 배송지를 추가할 수 있어요.
      </BottomSheet>
      <BottomSheet inline open title="그립바 없음" showHandle={false}>
        showHandle을 끄면 상단 그립바가 사라져요.
      </BottomSheet>
      <BottomSheet inline open showHandle>
        제목 없이 본문만 있는 시트예요. 긴 내용은 시트 안에서 스크롤돼요.
      </BottomSheet>
    </div>
  ),
}
