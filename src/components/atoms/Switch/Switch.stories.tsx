import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';
import { switchMeta } from './Switch.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { expect, userEvent, within } from '@storybook/test';

const meta: Meta<typeof Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: metaParameters(switchMeta),
  argTypes: argTypesFromMeta(switchMeta),
  args: { ...argsFromMeta(switchMeta), children: 'Enable notifications' },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Playground: Story = {};

/** Controlled ON/OFF — state drives `checked`; the track/thumb animate and the label reflects state. */
export const Interactive: Story = {
  render: (a) => {
    const [on, setOn] = useState(false);
    return (
      <Switch {...a} checked={on} onChange={(e) => setOn(e.target.checked)}>
        {on ? 'On' : 'Off'}
      </Switch>
    );
  },
};

export const Sizes: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Switch key={s} {...a} size={s} defaultChecked>
          Size {s}
        </Switch>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Switch {...a} showIcons defaultChecked>
        On (check glyph)
      </Switch>
      <Switch {...a} showIcons>
        Off (close glyph)
      </Switch>
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true, children: 'Accept the terms (required)' },
};

/** Interaction test — clicking the switch toggles its checked state (role="switch").
 *  A stateful wrapper makes it controlled-with-state; the meta's default `checked` alone would be a
 *  read-only controlled input that never toggles (so the play assertions would never pass). */
export const Toggles: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <Switch checked={on} onChange={(e) => setOn(e.currentTarget.checked)}>
        Enable notifications
      </Switch>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    await step('starts unchecked', async () => {
      await expect(sw).not.toBeChecked();
    });
    await step('click turns it on', async () => {
      await userEvent.click(sw);
      await expect(sw).toBeChecked();
    });
    await step('click again turns it off', async () => {
      await userEvent.click(sw);
      await expect(sw).not.toBeChecked();
    });
  },
};
