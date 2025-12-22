import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { RoleSelector } from './RoleSelector'

const meta: Meta<typeof RoleSelector> = {
  title: 'Components/RoleSelector',
  component: RoleSelector,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof RoleSelector>

export const Default: Story = {
  args: {
    roles: ['engineer', 'designer', 'pm'],
    selectedRole: 'engineer',
    onRoleChange: fn(),
  },
}

export const EmptySelection: Story = {
  args: {
    roles: ['intern', 'qa'],
    selectedRole: '',
    onRoleChange: fn(),
  },
}

