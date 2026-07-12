import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Badge } from '../Badge/Badge'
import { Table, type TableColumn, type TableProps } from './Table'

type Person = {
  id: string
  name: string
  role: string
  status: '재직' | '휴직' | '퇴사'
  joinedAt: string
}

const people: Person[] = [
  { id: 'p1', name: '김서연', role: '프로덕트 디자이너', status: '재직', joinedAt: '2021-03-15' },
  { id: 'p2', name: '이준호', role: '프론트엔드 개발자', status: '재직', joinedAt: '2019-11-02' },
  { id: 'p3', name: '박지민', role: '백엔드 개발자', status: '휴직', joinedAt: '2020-07-20' },
  { id: 'p4', name: '최수아', role: '프로덕트 매니저', status: '재직', joinedAt: '2022-01-10' },
  { id: 'p5', name: '정도윤', role: 'QA 엔지니어', status: '퇴사', joinedAt: '2018-05-28' },
]

const statusVariant = { 재직: 'success', 휴직: 'secondary', 퇴사: 'error' } as const

const columns: TableColumn<Person>[] = [
  { key: 'name', header: '이름', sortable: true },
  { key: 'role', header: '직군' },
  {
    key: 'status',
    header: '상태',
    align: 'center',
    width: 96,
    render: (row) => <Badge variant={statusVariant[row.status]} label={row.status} size="sm" />,
  },
  { key: 'joinedAt', header: '가입일', sortable: true, align: 'right' },
]

// 제네릭 고정 — Storybook 타입 추론용
const PersonTable = Table<Person>

// 행 클릭 데모 — 마지막으로 클릭한 행을 아래에 표시
function TableDemo(props: TableProps<Person>) {
  const [clicked, setClicked] = useState<Person | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PersonTable {...props} onRowClick={setClicked} />
      <span style={{ fontSize: 13, color: 'var(--ds-color-secondary)' }}>
        {clicked ? `선택한 행: ${clicked.name}` : '행을 클릭해 보세요.'}
      </span>
    </div>
  )
}

const meta = {
  title: '3. 컴포넌트/Data/Table',
  component: PersonTable,
  tags: ['autodocs'],
  args: {
    columns,
    rows: people,
    rowKey: (row) => row.id,
    striped: false,
    bordered: false,
    compact: false,
    emptyText: '데이터가 없습니다.',
  },
  argTypes: {
    columns: { control: false },
    rows: { control: false },
    rowKey: { control: false },
    onRowClick: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<TableProps<Person>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <TableDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>striped</p>
        <Table<Person> columns={columns} rows={people.slice(0, 3)} rowKey={(row) => row.id} striped />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>bordered</p>
        <Table<Person> columns={columns} rows={people.slice(0, 3)} rowKey={(row) => row.id} bordered />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>compact</p>
        <Table<Person> columns={columns} rows={people.slice(0, 3)} rowKey={(row) => row.id} compact />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--ds-color-secondary)' }}>empty</p>
        <Table<Person> columns={columns} rows={[]} rowKey={(row) => row.id} />
      </div>
    </div>
  ),
}
