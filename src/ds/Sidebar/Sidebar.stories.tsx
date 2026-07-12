import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Sidebar, type SidebarProps, type SidebarSection } from './Sidebar'

const sections: SidebarSection[] = [
  {
    title: '시작하기',
    items: [
      { label: '홈', value: 'home' },
      { label: '설치', value: 'install' },
      { label: '업데이트', value: 'updates', badge: 'N' },
    ],
  },
  {
    title: '컴포넌트',
    items: [
      { label: '버튼', value: 'button' },
      { label: '입력 필드', value: 'input' },
      { label: '내비게이션', value: 'navigation', disabled: true },
    ],
  },
]

// 컨트롤드 컴포넌트용 데모
function SidebarDemo(props: SidebarProps) {
  const [value, setValue] = useState(props.value)
  return (
    <div style={{ height: 320, display: 'flex' }}>
      <Sidebar {...props} value={value} onChange={setValue} />
    </div>
  )
}

const meta = {
  title: '3. 컴포넌트/Structure/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  args: {
    sections,
    value: 'home',
    width: 240,
  },
  argTypes: {
    onChange: { control: false },
    width: { control: { type: 'number', min: 160, max: 400 } },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <SidebarDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, height: 320 }}>
      <Sidebar sections={sections} value="home" />
      <Sidebar sections={sections} value="updates" />
      <Sidebar
        width={200}
        value="button"
        sections={[
          {
            items: [
              { label: '버튼', value: 'button', badge: '3' },
              { label: '배지', value: 'badge' },
              { label: '차트', value: 'chart', disabled: true },
            ],
          },
        ]}
      />
    </div>
  ),
}
