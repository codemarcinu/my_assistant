import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'Atoms/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    shadow: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a default card with some content.',
    padding: 'md',
    shadow: 'md',
  },
};

export const SmallPadding: Story = {
  args: {
    children: 'Card with small padding.',
    padding: 'sm',
    shadow: 'md',
  },
};

export const LargePadding: Story = {
  args: {
    children: 'Card with large padding.',
    padding: 'lg',
    shadow: 'md',
  },
};

export const SmallShadow: Story = {
  args: {
    children: 'Card with small shadow.',
    padding: 'md',
    shadow: 'sm',
  },
};

export const LargeShadow: Story = {
  args: {
    children: 'Card with large shadow.',
    padding: 'md',
    shadow: 'lg',
  },
};

export const WithContent: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This is a card with structured content including a title and description.
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            Action 1
          </button>
          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
            Action 2
          </button>
        </div>
      </div>
    ),
    padding: 'md',
    shadow: 'md',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card padding="sm" shadow="sm">
        Small padding, small shadow
      </Card>
      <Card padding="md" shadow="md">
        Medium padding, medium shadow
      </Card>
      <Card padding="lg" shadow="lg">
        Large padding, large shadow
      </Card>
    </div>
  ),
}; 