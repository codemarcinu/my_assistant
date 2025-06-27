import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'default',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    variant: 'default',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    variant: 'default',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    variant: 'default',
  },
};

export const Primary: Story = {
  args: {
    size: 'md',
    variant: 'primary',
  },
};

export const Success: Story = {
  args: {
    size: 'md',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    size: 'md',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    size: 'md',
    variant: 'error',
  },
};

export const WithLabel: Story = {
  args: {
    size: 'md',
    variant: 'primary',
    label: 'Loading data...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" variant="primary" />
      <Spinner size="md" variant="primary" />
      <Spinner size="lg" variant="primary" />
      <Spinner size="xl" variant="primary" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="md" variant="default" />
      <Spinner size="md" variant="primary" />
      <Spinner size="md" variant="success" />
      <Spinner size="md" variant="warning" />
      <Spinner size="md" variant="error" />
    </div>
  ),
}; 