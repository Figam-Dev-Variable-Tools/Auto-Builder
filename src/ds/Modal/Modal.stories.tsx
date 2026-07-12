import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { Modal, type ModalProps } from './Modal'

// 컨트롤드 오버레이용 데모 — 실제 fixed 오버레이가 열리고 닫힌다
function ModalDemo(props: ModalProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <Button variant="primary" size="md" label="열기" onClick={() => setOpen(true)} />
      <Modal
        {...props}
        open={open}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" size="md" label="취소" onClick={close} />
            <Button variant="primary" size="md" label="확인" onClick={close} />
          </>
        }
      />
    </>
  )
}

const meta = {
  title: '3. 컴포넌트/Overlay/Modal',
  component: Modal,
  tags: ['autodocs'],
  args: {
    open: false,
    title: '약관 동의',
    children: '서비스 이용을 위해 필수 약관에 동의해 주세요. 동의하지 않으면 일부 기능이 제한될 수 있어요.',
    size: 'md',
    showClose: true,
    inline: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    onClose: { control: false },
    children: { control: false },
    footer: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <ModalDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Modal inline open size="sm" title="작은 모달 (sm)">
        본문이 짧은 기본 모달이에요.
      </Modal>
      <Modal
        inline
        open
        size="md"
        title="푸터 포함 (md)"
        footer={
          <>
            <Button variant="secondary" size="md" label="취소" />
            <Button variant="primary" size="md" label="확인" />
          </>
        }
      >
        푸터에 액션 버튼이 우측 정렬로 배치돼요.
      </Modal>
      <Modal inline open size="lg" title="닫기 버튼 없음 (lg)" showClose={false}>
        showClose를 끄면 우상단 × 버튼이 사라져요. 푸터 액션으로만 닫을 수 있어요.
      </Modal>
      <Modal inline open size="sm" showClose={false}>
        제목 없이 본문만 있는 모달이에요.
      </Modal>
    </div>
  ),
}
