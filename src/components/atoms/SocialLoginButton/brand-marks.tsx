import type { ReactNode } from 'react';
import { icons } from '../Icon/icons';

/**
 * OAuth provider identifiers. Each maps 1:1 to a Figma variant value and to a
 * brand palette + logo mark below. Keep this list in sync with the `provider`
 * variant options in `SocialLoginButton.meta.ts`.
 */
export type SocialProvider = 'kakao' | 'naver' | 'apple' | 'google' | 'facebook' | 'email';

export const socialProviders: SocialProvider[] = [
  'kakao',
  'naver',
  'apple',
  'google',
  'facebook',
  'email',
];

/** Default Korean CTA label per provider. Overridable via the `label` prop. */
export const providerLabels: Record<SocialProvider, string> = {
  kakao: '카카오톡으로 계속하기',
  naver: '네이버로 계속하기',
  apple: 'Apple로 계속하기',
  google: 'Google로 계속하기',
  facebook: 'Facebook으로 계속하기',
  email: '이메일로 계속하기',
};

/**
 * Brand logo marks. Each wraps the SHARED glyph geometry from the Icon set (`icons['logo-*']`) in a
 * self-contained <svg>, so the React SocialLoginButton and the Figma plugin — which both read that
 * single source (`src/components/atoms/Icon/icons.tsx`) — can never drift. Monochrome marks use
 * `currentColor` (the button sets the on-brand color); Google carries its own official four colors;
 * `email` is not a brand logo and reuses the stroke-style `mail` glyph.
 */
export const brandMarks: Record<SocialProvider, ReactNode> = {
  // Kakao is the speech-bubble symbol only — the button surface supplies the yellow.
  kakao: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icons['logo-kakao']}</svg>,
  naver: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icons['logo-naver']}</svg>,
  apple: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icons['logo-apple']}</svg>,
  google: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icons['logo-google']}</svg>,
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{icons['logo-facebook']}</svg>
  ),
  email: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons['mail']}
    </svg>
  ),
};
