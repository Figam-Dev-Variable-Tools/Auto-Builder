import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Badge } from '../Badge/Badge'
import { List, type ListItem, type ListProps } from './List'

function Avatar({ name }: { name: string }) {
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--ds-color-bgSubtle)',
        color: 'var(--ds-color-secondary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {name.charAt(0)}
    </span>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

const members: ListItem[] = [
  {
    id: 'm1',
    title: '김서연',
    description: '프로덕트 디자이너 · 디자인팀',
    leading: <Avatar name="김서연" />,
    trailing: <Badge variant="success" label="재직" size="sm" />,
  },
  {
    id: 'm2',
    title: '이준호',
    description: '프론트엔드 개발자 · 플랫폼팀',
    leading: <Avatar name="이준호" />,
    trailing: <ChevronRight />,
  },
  {
    id: 'm3',
    title: '박지민',
    description: '백엔드 개발자 · 서버팀',
    leading: <Avatar name="박지민" />,
    trailing: <Badge variant="secondary" label="휴직" size="sm" />,
  },
  {
    id: 'm4',
    title: '최수아',
    description: '프로덕트 매니저 · 전략팀',
    leading: <Avatar name="최수아" />,
    disabled: true,
  },
]

// 선택 상태 데모
function ListDemo(props: ListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(props.selectedId ?? null)
  return <List {...props} selectedId={selectedId} onSelect={setSelectedId} />
}

const meta = {
  title: '3. 컴포넌트/Layout/List',
  component: List,
  tags: ['autodocs'],
  args: {
    items: members,
    divider: true,
    selectable: true,
    selectedId: 'm1',
  },
  argTypes: {
    items: { control: false },
    selectedId: { control: false },
    onItemClick: { control: false },
    onSelect: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ width: 360 }}>
      <ListDemo {...args} />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 360 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          선택됨 + 비활성 항목
        </p>
        <List items={members} selectable selectedId="m2" />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          구분선 없음
        </p>
        <List items={members.slice(0, 3)} divider={false} />
      </div>
    </div>
  ),
}
