import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Footer } from './Footer'

const meta = {
  title: '3. 컴포넌트/Structure/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    copyright: '© 2026 TDS. All rights reserved.',
    description: '디자인 시스템 문서와 컴포넌트를 제공합니다.',
    links: [
      { label: '이용약관', href: '#' },
      { label: '개인정보처리방침', href: '#' },
      { label: '문의하기', href: '#' },
    ],
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720 }}>
      <Footer
        copyright="© 2026 TDS. All rights reserved."
        description="디자인 시스템 문서와 컴포넌트를 제공합니다."
        links={[
          { label: '이용약관', href: '#' },
          { label: '개인정보처리방침', href: '#' },
          { label: '문의하기', href: '#' },
        ]}
      />
      <Footer
        copyright="© 2026 TDS."
        links={[
          { label: '홈', href: '#' },
          { label: '문서', href: '#' },
        ]}
      />
      <Footer copyright="© 2026 TDS. 링크 없는 푸터." />
    </div>
  ),
}
