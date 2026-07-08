import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import { iconMeta } from './Icon.meta';
import { iconNames } from './icon-names';
import { argTypesFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: metaParameters(iconMeta),
  argTypes: {
    ...argTypesFromMeta(iconMeta),
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
  args: { name: 'star', size: 'md', strokeWidth: 2, filled: false },
};
export default meta;

type Story = StoryObj<typeof Icon>;

export const Playground: Story = {};

export const Filled: Story = {
  args: { name: 'heart', filled: true, color: 'var(--tds-color-danger-solid)' },
};

export const BrandLogos: Story = {
  render: () => {
    const logos = iconNames.filter((n) => n.startsWith('logo-'));
    return (
      <div>
        <p
          style={{
            marginBottom: 'var(--tds-space-4)',
            color: 'var(--tds-color-fg-muted)',
            fontSize: 'var(--tds-font-size-sm)',
          }}
        >
          {logos.length} brand logos, classified as <code>logo-*</code> — filled marks. Mono marks
          (Naver / Apple / Kakao / Facebook) inherit <code>color</code>; Google keeps its official
          colors. Kakao is the speech-bubble symbol (the SocialLoginButton supplies the yellow surface).
        </p>
        <div style={{ display: 'flex', gap: 'var(--tds-space-5)', flexWrap: 'wrap' }}>
          {logos.map((name) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--tds-space-2)',
                padding: 'var(--tds-space-4)',
                border: '1px solid var(--tds-color-border-subtle)',
                borderRadius: 'var(--tds-radius-lg)',
                fontSize: 'var(--tds-font-size-xs)',
                color: 'var(--tds-color-fg-muted)',
              }}
            >
              <Icon name={name} size="xl" />
              {name}
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const Gallery: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: 'var(--tds-space-4)', color: 'var(--tds-color-fg-muted)', fontSize: 'var(--tds-font-size-sm)' }}>
        {iconNames.length} icons — every glyph is a 24×24 stroke vector that inherits <code>color</code> and can be filled.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: 'var(--tds-space-3)',
        }}
      >
        {iconNames.map((name) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--tds-space-2)',
              padding: 'var(--tds-space-3)',
              border: '1px solid var(--tds-color-border-subtle)',
              borderRadius: 'var(--tds-radius-lg)',
              fontSize: 'var(--tds-font-size-xs)',
              color: 'var(--tds-color-fg-muted)',
              textAlign: 'center',
            }}
          >
            <Icon name={name} size="lg" />
            {name}
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-4)' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Icon key={s} name="settings" size={s} />
      ))}
    </div>
  ),
};

export const Spin: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-4)' }}>
      <Icon name="loader" size="lg" spin />
      <Icon name="refresh" size="lg" spin />
    </div>
  ),
};
