import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: '3. 컴포넌트/Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: {
    items: [
      { label: '홈', href: '#' },
      { label: '컴포넌트', href: '#' },
      { label: '내비게이션', href: '#' },
      { label: 'Breadcrumb' },
    ],
    separator: '/',
  },
  argTypes: {
    maxItems: { control: { type: 'number', min: 3 } },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Breadcrumb
        items={[
          { label: '홈', href: '#' },
          { label: '컴포넌트', href: '#' },
          { label: 'Breadcrumb' },
        ]}
      />
      <Breadcrumb
        separator=">"
        items={[
          { label: '홈', href: '#' },
          { label: '문서', href: '#' },
          { label: '가이드' },
        ]}
      />
      <Breadcrumb
        maxItems={4}
        items={[
          { label: '홈', href: '#' },
          { label: '컴포넌트', href: '#' },
          { label: '내비게이션', href: '#' },
          { label: '경로 표시', href: '#' },
          { label: '축약', href: '#' },
          { label: 'Breadcrumb' },
        ]}
      />
      <Breadcrumb items={[{ label: '홈' }]} />
    </div>
  ),
}
