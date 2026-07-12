import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { Upload, type UploadProps } from './Upload'

// 컨트롤드 컴포넌트용 데모
function UploadDemo(props: UploadProps) {
  const [files, setFiles] = useState<File[]>(props.files)
  return <Upload {...props} files={files} onChange={setFiles} />
}

const meta = {
  title: '3. 컴포넌트/Input/Upload',
  component: Upload,
  tags: ['autodocs'],
  args: {
    label: '첨부 파일',
    files: [],
    multiple: true,
    disabled: false,
    helperText: 'PDF, DOCX 파일 · 최대 10MB',
  },
  argTypes: {
    onChange: { control: false },
    files: { control: false },
    children: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof Upload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <UploadDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Upload files={[]} />
      <Upload label="첨부 파일" files={[]} helperText="PDF, DOCX 파일 · 최대 10MB" />
      <Upload label="비활성" files={[]} helperText="지금은 업로드할 수 없어요" disabled />
      <Upload label="커스텀 안내 영역" files={[]}>
        <span style={{ fontSize: 13 }}>여기에 명세서를 끌어다 놓아 주세요</span>
      </Upload>
    </div>
  ),
}
