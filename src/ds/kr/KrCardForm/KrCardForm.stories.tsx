import type { Meta, StoryObj } from '@storybook/react'
import { KrCardForm } from './KrCardForm'

const meta = {
  title: '6. KR 컴포넌트/카드 등록 폼',
  component: KrCardForm,
  tags: ['autodocs'],
  args: {
    disabled: false,
  },
  argTypes: {
    onSubmit: { control: false },
  },
} satisfies Meta<typeof KrCardForm>

export default meta
type Story = StoryObj<typeof meta>

// 유효한 값이 모두 채워지면 등록 버튼이 활성화된다 (테스트 카드: 4242-4242-4242-4242)
export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}
