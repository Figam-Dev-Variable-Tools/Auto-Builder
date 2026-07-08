import { useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * Theme + font wrapper for stories — a real component so the effect obeys the rules of hooks.
 * Kept in its own file so `.storybook/preview.tsx` exports only its config object (satisfies
 * `react-refresh/only-export-components`).
 */
export function ThemeFrame({
  theme,
  font,
  children,
}: {
  theme: string;
  font: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // 'default' keeps the built-in body/display pairing (no attribute).
    if (font === 'default') document.documentElement.removeAttribute('data-font');
    else document.documentElement.setAttribute('data-font', font);
  }, [theme, font]);
  return (
    <div
      data-theme={theme}
      data-font={font === 'default' ? undefined : font}
      style={{
        background: 'var(--tds-color-bg-canvas)',
        color: 'var(--tds-color-fg-default)',
        padding: 'var(--tds-space-6)',
        minHeight: '100vh',
        fontFamily: 'var(--tds-font-family-body)',
      }}
    >
      {children}
    </div>
  );
}
