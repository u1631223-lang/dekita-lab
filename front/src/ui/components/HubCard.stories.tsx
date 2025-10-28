import type { Meta, StoryObj } from '@storybook/react';
import { HubCard } from './HubCard';

const meta: Meta<typeof HubCard> = {
  title: 'Hub/HubCard',
  component: HubCard,
  args: {
    label: '🎵 リズムタップ'
  }
};

export default meta;

type Story = StoryObj<typeof HubCard>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
