import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Tab } from './Tab'
import type { TabProps } from './Tab'

const items = [
  { value: 'all', label: '전체' },
  { value: 'growth', label: '도약' },
  { value: 'guide', label: '타입안내' },
]

function TabDemo({ items: demoItems = items, variant, size }: Partial<TabProps>) {
  const [value, setValue] = useState(demoItems[0].value)
  return <Tab items={demoItems} value={value} onChange={setValue} variant={variant} size={size} />
}

const meta = {
  title: '3. 컴포넌트/Navigation/Tab',
  component: Tab,
  tags: ['autodocs'],
  args: {
    items,
    value: 'all',
    variant: 'segmented',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['segmented', 'underline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    items: { control: false },
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Tab>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <TabDemo variant={args.variant} size={args.size} />,
}

export const Underline: Story = {
  render: () => <TabDemo variant="underline" />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <TabDemo items={[...items, { value: 'locked', label: '비활성', disabled: true }]} />
      <TabDemo size="sm" />
      <TabDemo
        variant="underline"
        items={[...items, { value: 'locked', label: '비활성', disabled: true }]}
      />
      <TabDemo variant="underline" size="sm" />
    </div>
  ),
}
