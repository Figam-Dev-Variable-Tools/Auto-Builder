import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider } from './Toast';
import { useToast } from './toast-context';
import { toastMeta } from './Toast.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';

const meta: Meta<typeof Toast> = {
  title: 'Organisms/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: metaParameters(toastMeta),
  argTypes: argTypesFromMeta(toastMeta),
  args: { title: 'Changes saved', description: 'Your profile was updated.', tone: 'success' },
  decorators: [(Story) => <div style={{ maxWidth: 380 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Static: Story = {
  render: (args) => <Toast {...args} duration={0} />,
};

export const TypeB: Story = {
  args: {
    type: 'B',
    title: 'Upload complete',
    description: 'report-q3.pdf finished uploading and is ready to share.',
    tone: 'success',
    action: (
      <Button size="sm" variant="ghost">
        View
      </Button>
    ),
  },
  render: (args) => <Toast {...args} duration={0} />,
};

const TriggerDemo = () => {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)' }}>
      <Button onClick={() => toast({ title: 'Saved', tone: 'success', description: 'All good.' })}>
        Success
      </Button>
      <Button
        tone="danger"
        onClick={() => toast({ title: 'Failed', tone: 'danger', description: 'Try again.' })}
      >
        Error
      </Button>
    </div>
  );
};

export const WithProvider: Story = {
  render: () => (
    <ToastProvider placement="bottom-right">
      <TriggerDemo />
    </ToastProvider>
  ),
};

export const TopCenter: Story = {
  render: () => (
    <ToastProvider placement="top-center">
      <TriggerDemo />
    </ToastProvider>
  ),
};
