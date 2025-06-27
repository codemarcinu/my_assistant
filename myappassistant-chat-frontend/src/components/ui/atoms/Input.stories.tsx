import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled', 'standard'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    autoResize: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    variant: 'outlined',
    size: 'md',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email...',
    variant: 'outlined',
    size: 'md',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email...',
    error: 'Please enter a valid email address',
    variant: 'outlined',
    size: 'md',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password...',
    helperText: 'Password must be at least 8 characters long',
    variant: 'outlined',
    size: 'md',
  },
};

export const Filled: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username...',
    variant: 'filled',
    size: 'md',
  },
};

export const Standard: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    variant: 'standard',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small...',
    variant: 'outlined',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large...',
    variant: 'outlined',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    variant: 'outlined',
    size: 'md',
    disabled: true,
  },
};

export const AutoResize: Story = {
  args: {
    label: 'Auto Resize Textarea',
    placeholder: 'Type here and watch it grow...',
    variant: 'outlined',
    size: 'md',
    autoResize: true,
    maxRows: 5,
  },
}; 