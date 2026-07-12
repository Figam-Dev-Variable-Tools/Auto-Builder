import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Button } from '../Button/Button'
import { Tooltip } from './Tooltip'

const meta = {
  title: '3. 컴포넌트/Feedback/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: '자세한 설명이 여기에 표시됩니다.',
    placement: 'top',
    delay: 150,
    alwaysVisible: false,
    children: '트리거',
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    children: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args}>
        <Button variant="primary" size="md" label="마우스를 올려보세요" />
      </Tooltip>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 80, padding: 64, flexWrap: 'wrap' }}>
      <Tooltip content="위쪽 툴팁" placement="top" alwaysVisible>
        <Button variant="secondary" size="md" label="Top" />
      </Tooltip>
      <Tooltip content="아래쪽 툴팁" placement="bottom" alwaysVisible>
        <Button variant="secondary" size="md" label="Bottom" />
      </Tooltip>
      <Tooltip content="왼쪽 툴팁" placement="left" alwaysVisible>
        <Button variant="secondary" size="md" label="Left" />
      </Tooltip>
      <Tooltip content="오른쪽 툴팁" placement="right" alwaysVisible>
        <Button variant="secondary" size="md" label="Right" />
      </Tooltip>
    </div>
  ),
}
