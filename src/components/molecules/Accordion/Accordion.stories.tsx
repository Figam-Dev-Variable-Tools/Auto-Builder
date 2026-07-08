import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './Accordion';
import { accordionMeta } from './Accordion.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { expect, userEvent, within } from '@storybook/test';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: metaParameters(accordionMeta),
  argTypes: argTypesFromMeta(accordionMeta),
  args: { type: 'A', variant: 'separated', size: 'md', mode: 'single' },
  decorators: [(Story) => <div style={{ maxWidth: 520 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Accordion>;

const items = [
  { v: 'shipping', q: 'How long does shipping take?', a: 'Orders ship within 2 business days.' },
  { v: 'returns', q: 'What is the return policy?', a: 'Returns are accepted within 30 days.' },
  { v: 'support', q: 'How do I contact support?', a: 'Email support@example.com anytime.' },
];

const renderItems = (args: React.ComponentProps<typeof Accordion>) => (
  <Accordion {...args} defaultValue={['shipping']}>
    {items.map((it) => (
      <Accordion.Item key={it.v} value={it.v}>
        <Accordion.Trigger>{it.q}</Accordion.Trigger>
        <Accordion.Content>
          <Text tone="muted">{it.a}</Text>
        </Accordion.Content>
      </Accordion.Item>
    ))}
  </Accordion>
);

export const Default: Story = { render: renderItems };

/** Interaction test — clicking a collapsed trigger expands it (aria-expanded flips to true). */
export const Expands: Story = {
  render: renderItems,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const returns = canvas.getByRole('button', { name: /return policy/i });
    await step('returns starts collapsed', async () => {
      await expect(returns).toHaveAttribute('aria-expanded', 'false');
    });
    await step('click expands it', async () => {
      await userEvent.click(returns);
      await expect(returns).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

/** Type B — each item is a separated card (border + radius + gap between rows). */
export const TypeB: Story = { render: (a) => renderItems({ ...a, type: 'B' }) };

export const Contained: Story = { render: (a) => renderItems({ ...a, variant: 'contained' }) };
export const Multiple: Story = { render: (a) => renderItems({ ...a, mode: 'multiple' }) };

/** Each trigger carries a leading icon. */
export const WithIcons: Story = {
  render: (a) => {
    const iconItems = [
      {
        v: 'general',
        q: 'General',
        icon: 'settings' as const,
        a: 'General preferences and defaults.',
      },
      {
        v: 'notifications',
        q: 'Notifications',
        icon: 'bell' as const,
        a: 'Choose how you get notified.',
      },
      { v: 'account', q: 'Account', icon: 'user' as const, a: 'Manage your account details.' },
    ];
    return (
      <Accordion {...a} defaultValue={['general']}>
        {iconItems.map((it) => (
          <Accordion.Item key={it.v} value={it.v}>
            <Accordion.Trigger icon={<Icon name={it.icon} size="sm" />}>{it.q}</Accordion.Trigger>
            <Accordion.Content>
              <Text tone="muted">{it.a}</Text>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  },
};
