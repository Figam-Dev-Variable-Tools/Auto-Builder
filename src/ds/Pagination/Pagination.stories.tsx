import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Pagination } from './Pagination'

function PaginationDemo({
  totalPages,
  initialPage = 1,
  siblingCount,
}: {
  totalPages: number
  initialPage?: number
  siblingCount?: number
}) {
  const [page, setPage] = useState(initialPage)
  return (
    <Pagination page={page} totalPages={totalPages} onChange={setPage} siblingCount={siblingCount} />
  )
}

const meta = {
  title: '3. 컴포넌트/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: {
    page: 1,
    totalPages: 10,
    siblingCount: 1,
  },
  argTypes: {
    page: { control: false },
    onChange: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <PaginationDemo totalPages={args.totalPages} siblingCount={args.siblingCount} />,
}

export const ManyPages: Story = {
  render: () => <PaginationDemo totalPages={24} initialPage={12} />,
}

export const FewPages: Story = {
  render: () => <PaginationDemo totalPages={3} />,
}
