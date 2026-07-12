import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Tree, type TreeNode, type TreeProps } from './Tree'

// 디자인 시스템 폴더 구조 샘플 (3레벨)
const designSystemNodes: TreeNode[] = [
  {
    id: 'root',
    label: '디자인 시스템',
    children: [
      {
        id: 'components',
        label: '컴포넌트',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'table', label: 'Table.tsx' },
          {
            id: 'form',
            label: '폼',
            children: [
              { id: 'textfield', label: 'TextField.tsx' },
              { id: 'select', label: 'Select.tsx' },
            ],
          },
        ],
      },
      {
        id: 'tokens',
        label: '토큰',
        children: [
          { id: 'toss', label: 'toss.json' },
          { id: 'bootstrap', label: 'bootstrap.json' },
        ],
      },
      {
        id: 'docs',
        label: '문서',
        children: [
          { id: 'getting-started', label: '시작하기.md' },
          { id: 'contributing', label: '기여 가이드.md', disabled: true },
        ],
      },
    ],
  },
]

// 선택 상태 데모
function TreeDemo(props: TreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(props.selectedId ?? null)
  return <Tree {...props} selectedId={selectedId} onSelect={setSelectedId} />
}

const meta = {
  title: '3. 컴포넌트/Data/Tree',
  component: Tree,
  tags: ['autodocs'],
  args: {
    nodes: designSystemNodes,
    selectedId: 'button',
    defaultExpandedIds: ['root', 'components'],
  },
  argTypes: {
    nodes: { control: false },
    selectedId: { control: false },
    defaultExpandedIds: { control: false },
    onSelect: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Tree>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <TreeDemo {...args} />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 40 }}>
      <div style={{ width: 260 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          기본(모두 접힘)
        </p>
        <Tree nodes={designSystemNodes} />
      </div>
      <div style={{ width: 260 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>
          모두 펼침 + 선택 + 비활성
        </p>
        <Tree
          nodes={designSystemNodes}
          defaultExpandedIds={['root', 'components', 'form', 'tokens', 'docs']}
          selectedId="select"
        />
      </div>
    </div>
  ),
}
