import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { Popover, type PopoverProps } from './Popover'

// 컨트롤드 컴포넌트용 데모 — 트리거 클릭으로 열고, 외부 클릭/Escape로 닫힘
function PopoverDemo(props: PopoverProps) {
  const [open, setOpen] = useState(props.open)
  return <Popover {...props} open={open} onOpenChange={setOpen} />
}

const meta = {
  title: '3. 컴포넌트/Overlay/Popover',
  component: Popover,
  tags: ['autodocs'],
  args: {
    open: false,
    trigger: <Button variant="primary" size="md" label="팝오버 열기" />,
    title: '프로필을 완성해 주세요',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <span>남은 항목을 입력하면 맞춤 추천을 받을 수 있어요.</span>
        <Button variant="primary" size="sm" label="이어서 작성" />
      </div>
    ),
    placement: 'bottom-start',
    showArrow: true,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['bottom-start', 'bottom-end'] },
    trigger: { control: false },
    children: { control: false },
    onOpenChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ minHeight: 240 }}>
      <PopoverDemo {...args} />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ minHeight: 260 }}>
      <Popover
        open
        trigger={<Button variant="secondary" size="md" label="열린 상태" />}
        title="알림 설정"
        showArrow
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}
        >
          <span>이벤트·혜택 알림을 받아보시겠어요?</span>
          <Button variant="primary" size="sm" label="알림 켜기" />
        </div>
      </Popover>
    </div>
  ),
}
