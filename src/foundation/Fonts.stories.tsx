import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../shared/figma'

type FontDef = {
  name: string
  stack: string
  role: string
  source: string
  weights: Array<[number, string]>
}

const SAMPLE_KO = '다람쥐 헌 쳇바퀴에 타고파'
const SAMPLE_EN = 'The quick brown fox 0123'

const FONTS: FontDef[] = [
  {
    name: 'Pretendard',
    stack: "'Pretendard', -apple-system, sans-serif",
    role: '본문·UI 기본. toss 프리셋 기본 폰트로, 9단계 굵기로 촘촘한 위계를 만든다.',
    source: 'npm: pretendard (번들 — 별도 CDN 불필요)',
    weights: [
      [100, 'Thin'],
      [200, 'ExtraLight'],
      [300, 'Light'],
      [400, 'Regular'],
      [500, 'Medium'],
      [600, 'SemiBold'],
      [700, 'Bold'],
      [800, 'ExtraBold'],
      [900, 'Black'],
    ],
  },
  {
    name: 'NanumSquare (나눔스퀘어)',
    stack: "'NanumSquare', sans-serif",
    role: '제목·강조. 각지고 힘있는 고딕으로 헤드라인·배너에 적합. 4단계 굵기.',
    source: 'CDN: jsdelivr gh moonspam/NanumSquare (원 rawgit URL은 서비스 종료 → 대체)',
    weights: [
      [300, 'Light'],
      [400, 'Regular'],
      [700, 'Bold'],
      [800, 'ExtraBold'],
    ],
  },
  {
    name: 'Tway 날다체 (TwayNalda)',
    stack: "'TwayNalda', sans-serif",
    role: '디스플레이·브랜드. 개성 있는 단일 굵기로 큰 사이즈 포인트에만 절제해서 사용.',
    source: 'CDN: jsdelivr gh projectnoonnu/noonfonts_tway',
    weights: [[400, 'Regular']],
  },
]

function FontCard({ font }: { font: FontDef }) {
  return (
    <section
      style={{
        border: '1px solid var(--ds-color-border)',
        borderRadius: 'var(--ds-radius-lg)',
        background: 'var(--ds-color-bg)',
        padding: 'var(--ds-spacing-5)',
        maxWidth: 720,
      }}
    >
      <header style={{ marginBottom: 'var(--ds-spacing-4)' }}>
        <div
          style={{
            fontFamily: font.stack,
            fontSize: 40,
            fontWeight: 700,
            color: 'var(--ds-color-text)',
            lineHeight: 1.25,
            marginBottom: 6,
          }}
        >
          {SAMPLE_KO}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 'var(--ds-font-size-lg)',
              fontWeight: 700,
              color: 'var(--ds-color-text)',
            }}
          >
            {font.name}
          </span>
          <span
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 'var(--ds-font-size-xs)',
              color: 'var(--ds-color-secondary)',
              background: 'var(--ds-color-bgSubtle)',
              borderRadius: 'var(--ds-radius-sm)',
              padding: '2px 8px',
            }}
          >
            {font.source}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: 'var(--ds-font-size-sm)',
            color: 'var(--ds-color-secondary)',
            margin: '6px 0 0',
          }}
        >
          {font.role}
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {font.weights.map(([weight, label]) => (
          <div
            key={weight}
            style={{
              display: 'grid',
              gridTemplateColumns: '112px 1fr',
              alignItems: 'baseline',
              gap: 12,
              borderTop: '1px solid var(--ds-color-border)',
              paddingTop: 10,
            }}
          >
            <span
              style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: 'var(--ds-font-size-xs)',
                color: 'var(--ds-color-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {weight} · {label}
            </span>
            <span
              style={{
                fontFamily: font.stack,
                fontWeight: weight,
                fontSize: 20,
                color: 'var(--ds-color-text)',
                lineHeight: 1.4,
              }}
            >
              {SAMPLE_KO} {SAMPLE_EN}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FontGallery() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-5)' }}>
      <p
        style={{
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 'var(--ds-font-size-md)',
          color: 'var(--ds-color-secondary)',
          maxWidth: 640,
          margin: 0,
        }}
      >
        플랫폼에서 사용하는 폰트 3종과 굵기·용도 안내입니다. 웹(Storybook)은 아래처럼 렌더되며,
        Figma에서 동일 폰트로 Text Style을 생성하려면 해당 폰트가 Figma에 설치되어 있어야 합니다
        (미설치 시 DS Generator가 Inter로 폴백).
      </p>
      {FONTS.map((font) => (
        <FontCard key={font.name} font={font} />
      ))}
    </div>
  )
}

const meta = {
  title: '2. 타이포그래피/폰트별 안내',
  component: FontGallery,
  tags: ['autodocs'],
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof FontGallery>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
