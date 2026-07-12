import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Drawer, type DrawerProps } from './Drawer'
import { Button } from '../Button/Button'

// 오버레이 열기/닫기 데모
function DrawerDemo(props: DrawerProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" size="md" label="열기" onClick={() => setOpen(true)} />
      <Drawer {...props} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const meta = {
  title: '3. 컴포넌트/Overlay/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  args: {
    open: false,
    title: '설정',
    side: 'right',
    width: 320,
    inline: false,
    children: (
      <p style={{ margin: 0 }}>
        서랍 패널 내용입니다. 알림, 테마, 언어 등 세부 설정을 이곳에 배치할 수 있습니다.
      </p>
    ),
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right'] },
    onClose: { control: false },
    children: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <DrawerDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Drawer open inline title="설정" side="right" width={280}>
        <p style={{ margin: 0 }}>오른쪽에서 열리는 기본 서랍입니다.</p>
      </Drawer>
      <Drawer open inline title="메뉴" side="left" width={240}>
        <p style={{ margin: 0 }}>왼쪽에서 열리는 내비게이션 서랍입니다.</p>
      </Drawer>
      <Drawer open inline width={240}>
        <p style={{ margin: 0 }}>제목 없는 서랍입니다.</p>
      </Drawer>
    </div>
  ),
}
