import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    rounded: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Badge',
    variant: 'default',
    size: 'md',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Badge',
    variant: 'primary',
    size: 'md',
  },
};

export const Success: Story = {
  args: {
    children: 'Success Badge',
    variant: 'success',
    size: 'md',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning Badge',
    variant: 'warning',
    size: 'md',
  },
};

export const Error: Story = {
  args: {
    children: 'Error Badge',
    variant: 'error',
    size: 'md',
  },
};

export const Info: Story = {
  args: {
    children: 'Info Badge',
    variant: 'info',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Badge',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Badge',
    variant: 'primary',
    size: 'lg',
  },
};

export const Rounded: Story = {
  args: {
    children: 'Rounded Badge',
    variant: 'primary',
    size: 'md',
    rounded: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}; 