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
            // Figma 카테고리 순서로 하위 드롭다운 그룹(각 그룹 내부는 컴포넌트 순서)
            'Input',
            ['TextField', 'Textarea', 'PasswordField', 'SearchField', 'EmailField', 'NumberField', 'CurrencyField', 'OtpField', 'Select', 'MultiSelect', 'Autocomplete', 'Slider', 'Upload', 'FileUpload', 'ImageUpload'],
            'Selection',
            ['Toggle', 'Checkbox', 'Radio', 'Chip'],
            'Action',
            ['Button', 'Badge'],
            'Feedback',
            ['Alert', 'Toast', 'Snackbar', 'Tooltip', 'Loading'],
            'Navigation',
            ['Tab', 'Breadcrumb', 'Pagination', 'Dropdown'],
            'Layout',
            ['Card', 'List', 'Accordion'],
            'Overlay',
            ['Modal', 'Dialog', 'Popover', 'Drawer', 'BottomSheet', 'ActionSheet'],
            'Data',
            ['Avatar', 'Statistics', 'Table', 'Timeline', 'Tree', 'Carousel'],
            'Structure',
            ['Navbar', 'Header', 'Footer', 'Sidebar'],
            'Date & Time',
            ['Calendar', 'DatePicker', 'DateRangePicker', 'TimePicker'],
          ],
          '4. 차트',
          '5. 소셜 로그인',
          '6. KR 컴포넌트',
          '7. 상태 & 검증',
          '8. Playground',
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
