import React from 'react'
import type { Decorator, Preview } from '@storybook/react'
import { ThemeScope } from '../src/shared/ThemeScope'
import type { StylePreset } from '../src/tokens/generated/types'
import 'pretendard/dist/web/static/pretendard.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'
import '../src/foundation/webfonts.css'

const withTheme: Decorator = (Story, context) => {
  if (context.parameters.noDsTheme) return <Story />
  return (
    <ThemeScope preset={context.globals.theme as StylePreset}>
      <Story />
    </ThemeScope>
  )
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '스타일 프리셋 (디자인 토큰)',
      toolbar: {
        title: 'Preset',
        items: ['bootstrap', 'tailwind', 'toss'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'toss' },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      // G1 — 사이드바 정보 구조 고정 (docs-content.json sections 순서와 일치해야 함, V1 §17-4)
      storySort: {
        order: [
          '0. 시작하기',
          '1. 컬러',
          '2. 타이포그래피',
          '3. 컴포넌트',
          [
            'Button',
            'TextField',
            'PasswordField',
            'SearchField',
            'EmailField',
            'NumberField',
            'CurrencyField',
            'OtpField',
            'Textarea',
            'Select',
            'MultiSelect',
            'Autocomplete',
            'Calendar',
            'DatePicker',
            'DateRangePicker',
            'TimePicker',
            'Slider',
            'Upload',
            'FileUpload',
            'ImageUpload',
            'Toggle',
            'Checkbox',
            'Radio',
            'Chip',
            'Tab',
            'Breadcrumb',
            'Pagination',
            'Navbar',
            'Header',
            'Footer',
            'Sidebar',
            'Drawer',
            'Dropdown',
            'Modal',
            'Dialog',
            'BottomSheet',
            'ActionSheet',
            'Tooltip',
            'Popover',
            'Toast',
            'Snackbar',
            'Loading',
            'Card',
            'Table',
            'List',
            'Accordion',
            'Tree',
            'Timeline',
            'Carousel',
            'Statistics',
            'Avatar',
            'Alert',
            'Badge',
          ],
          '4. 차트',
          '5. 소셜 로그인',
          '6. KR 컴포넌트',
          '7. 상태 & 검증',
          '8. Playground',
          '9. Figma 연동',
          '10. 접근성',
          'Templates',
          'Admin',
          'Animations',
          'Frameworks',
          ['Compare'],
          'Icons',
          'Styling',
        ],
      },
    },
  },
}

export default preview
