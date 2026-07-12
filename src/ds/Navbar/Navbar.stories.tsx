import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Navbar, type NavbarProps } from './Navbar'
import { Button } from '../Button/Button'

// 컨트롤드 컴포넌트용 데모
function NavbarDemo(props: NavbarProps) {
  const [value, setValue] = useState(props.value)
  return <Navbar {...props} value={value} onChange={setValue} />
}

const meta = {
  title: '3. 컴포넌트/Structure/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  args: {
    brand: 'TDS',
    items: [
      { label: '홈', value: 'home' },
      { label: '컴포넌트', value: 'components' },
      { label: '토큰', value: 'tokens' },
      { label: '문서', value: 'docs' },
    ],
    value: 'home',
    sticky: false,
    actions: <Button variant="primary" size="sm" label="로그인" />,
  },
  argTypes: {
    onChange: { control: false },
    actions: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <NavbarDemo {...args} />,
}

export const States: Story = {
  render: () => {
    const items = [
      { label: '홈', value: 'home' },
      { label: '컴포넌트', value: 'components' },
      { label: '토큰', value: 'tokens' },
      { label: '문서', value: 'docs' },
    ]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Navbar
          brand="TDS"
          items={items}
          value="home"
          actions={<Button variant="primary" size="sm" label="로그인" />}
        />
        <Navbar brand="TDS" items={items} value="components" />
        <Navbar
          brand="디자인 시스템"
          items={items}
          value="docs"
          actions={<Button variant="secondary" size="sm" label="문의" />}
        />
      </div>
    )
  },
}
