import type { Decorator, Preview } from '@storybook/react';
import '../src/styles/global.css';
import { ThemeFrame } from './decorators';

/** Applies the selected theme + font to the story root + document element (for portals). */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'light';
  const font = (context.globals.font as string) ?? 'default';
  return (
    <ThemeFrame theme={theme} font={font}>
      <Story />
    </ThemeFrame>
  );
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
      expanded: true,
    },
    options: {
      storySort: {
        order: ['Foundations', 'Atoms', 'Molecules', 'Organisms'],
      },
    },
    a11y: { test: 'todo' },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
        wide: { name: 'Wide', styles: { width: '1440px', height: '900px' } },
      },
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Design System theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    font: {
      description: 'Typography font family (bulk-applied to all text)',
      defaultValue: 'default',
      toolbar: {
        title: 'Font',
        icon: 'paragraph',
        items: [
          { value: 'default', title: 'Default (Pretendard + Paperlogy)' },
          { value: 'pretendard', title: 'Pretendard' },
          { value: 'paperlogy', title: 'Paperlogy' },
          { value: 'notoSansKr', title: 'Noto Sans KR' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
