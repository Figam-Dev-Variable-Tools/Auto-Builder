import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { ImageUpload, type ImageUploadProps } from './ImageUpload'

// 컨트롤드 컴포넌트용 데모
function ImageUploadDemo(props: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>(props.files)
  return <ImageUpload {...props} files={files} onChange={setFiles} />
}

// States용 합성 이미지 파일 — 썸네일은 빈 사각형으로 렌더됨
const sampleImages = [
  new File([new Blob(['x'])], 'product-01.png', { type: 'image/png' }),
  new File([new Blob(['x'])], 'product-02.png', { type: 'image/png' }),
  new File([new Blob(['x'])], 'product-03.png', { type: 'image/png' }),
]

const meta = {
  title: '3. 컴포넌트/Input/ImageUpload',
  component: ImageUpload,
  tags: ['autodocs'],
  args: {
    label: '상품 이미지',
    files: [],
    maxFiles: 6,
    disabled: false,
    helperText: 'JPG, PNG · 최대 6장',
  },
  argTypes: {
    onChange: { control: false },
    files: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof ImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <ImageUploadDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ImageUpload label="비어 있음" files={[]} helperText="JPG, PNG · 최대 6장" />
      <ImageUpload label="이미지 있음 (+ 타일 노출)" files={sampleImages.slice(0, 2)} />
      <ImageUpload label="최대 장수 도달 (+ 타일 숨김)" files={sampleImages} maxFiles={3} />
      <ImageUpload label="비활성" files={sampleImages.slice(0, 2)} disabled />
    </div>
  ),
}
