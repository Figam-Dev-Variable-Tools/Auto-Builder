import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { SocialLoginButton } from './SocialLoginButton'

const meta = {
  title: '5. 소셜 로그인/SocialLoginButton',
  component: SocialLoginButton,
  tags: ['autodocs'],
  args: {
    provider: 'kakao',
    size: 'md',
    showLogo: true,
  },
  argTypes: {
    provider: { control: 'select', options: ['kakao', 'google', 'facebook', 'naver', 'apple', 'microsoft', 'x'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    label: { control: 'text' },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof SocialLoginButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllProviders: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      <SocialLoginButton provider="kakao" size="md" />
      <SocialLoginButton provider="naver" size="md" />
      <SocialLoginButton provider="google" size="md" />
      <SocialLoginButton provider="facebook" size="md" />
      <SocialLoginButton provider="apple" size="md" />
      <SocialLoginButton provider="microsoft" size="md" />
      <SocialLoginButton provider="x" size="md" />
    </div>
  ),
}
