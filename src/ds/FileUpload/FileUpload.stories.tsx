import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { FileUpload, type FileUploadProps } from './FileUpload'

// 컨트롤드 컴포넌트용 데모
function FileUploadDemo(props: FileUploadProps) {
  const [files, setFiles] = useState<File[]>(props.files)
  return <FileUpload {...props} files={files} onChange={setFiles} />
}

// States용 샘플 파일 (크기만 의미 있게 합성)
const sampleFiles = [
  new File([new Blob(['x'.repeat(215040)])], '용역_계약서_최종.pdf', { type: 'application/pdf' }),
  new File([new Blob(['x'.repeat(18432)])], '견적서.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }),
]

const meta = {
  title: '3. 컴포넌트/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  args: {
    label: '첨부 파일',
    files: [],
    multiple: true,
    maxFiles: 5,
    disabled: false,
    helperText: '최대 5개까지 업로드할 수 있어요',
  },
  argTypes: {
    onChange: { control: false },
    files: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <FileUploadDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <FileUpload label="비어 있음" files={[]} helperText="최대 5개까지 업로드할 수 있어요" />
      <FileUpload label="파일 있음" files={sampleFiles} helperText="최대 5개까지 업로드할 수 있어요" />
      <FileUpload label="비활성" files={sampleFiles} disabled />
    </div>
  ),
}
