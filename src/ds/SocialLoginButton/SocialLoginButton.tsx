import './brand.css'
import styles from './SocialLoginButton.module.css'
import kakaoLogo from './logos/kakao.svg?raw'
import googleLogo from './logos/google.svg?raw'
import facebookLogo from './logos/facebook.svg?raw'
import naverLogo from './logos/naver.svg?raw'
import appleLogo from './logos/apple.svg?raw'
import microsoftLogo from './logos/microsoft.svg?raw'
import xLogo from './logos/x.svg?raw'

export type SocialLoginButtonProps = {
  provider: 'kakao' | 'google' | 'facebook' | 'naver' | 'apple' | 'microsoft' | 'x'
  size: 'md' | 'lg'
  label?: string
  showLogo?: boolean
  // 함수 타입은 §3 매핑 파서가 무시하므로 매니페스트 왕복 동일성에 영향 없음.
  onClick?: () => void
}

// 부록 E 기본 문구 (변경 금지)
const DEFAULT_LABELS: Record<SocialLoginButtonProps['provider'], string> = {
  kakao: '카카오 로그인',
  google: 'Google로 로그인',
  facebook: 'Facebook으로 로그인',
  naver: '네이버 로그인',
  apple: 'Apple로 로그인',
  microsoft: 'Microsoft 계정으로 로그인',
  x: 'X로 계속하기',
}

// 각 사 공식 geometry SVG — Google 4색 G(공식 브랜딩 가이드라인 path), Facebook 공식 f 글리프,
// 네이버 공식 N, 카카오 공식 심볼(말풍선). 브랜드 컬러는 brand.css(부록 E)와 함께 각 사 규정 준수.
const LOGOS: Record<SocialLoginButtonProps['provider'], string> = {
  kakao: kakaoLogo,
  google: googleLogo,
  facebook: facebookLogo,
  naver: naverLogo,
  apple: appleLogo,
  microsoft: microsoftLogo,
  x: xLogo,
}

export function SocialLoginButton({
  provider,
  size,
  label,
  showLogo = true,
  onClick,
}: SocialLoginButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, styles[provider], styles[size]].join(' ')}
      onClick={onClick}
    >
      {showLogo && (
        <span
          className={styles.logo}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: LOGOS[provider] }}
        />
      )}
      <span>{label ?? DEFAULT_LABELS[provider]}</span>
    </button>
  )
}
