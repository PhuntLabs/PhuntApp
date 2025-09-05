import type { Permission } from './types';

export const allPermissionDetails: { id: Permission; name: string; description: string }[] = [
    {
        id: 'administrator',
        name: 'Administrator',
        description: 'Grants all permissions and bypasses channel-specific permissions. This is a dangerous permission to grant.',
    },
    {
        id: 'manageServer',
        name: 'Manage Server',
        description: 'Allows members to change the server name, icon, and other server settings.',
    },
    {
        id: 'manageRoles',
        name: 'Manage Roles',
        description: 'Allows members to create, edit, and delete roles.',
    },
    {
        id: 'manageChannels',
        name: 'Manage Channels',
        description: 'Allows members to create, edit, and delete channels.',
    },
    {
        id: 'kickMembers',
        name: 'Kick Members',
        description: 'Allows members to remove other members from the server.',
    },
    {
        id: 'banMembers',
        name: 'Ban Members',
        description: 'Allows members to permanently ban other members from the server.',
    },
    {
        id: 'viewChannels',
        name: 'View Channels',
        description: 'Allows members to view and read channels by default.',
    },
    {
        id: 'sendMessages',
        name: 'Send Messages',
        description: 'Allows members to send messages in text channels.',
    },
    {
        id: 'mentionEveryone',
        name: 'Mention @everyone',
        description: 'Allows members to use @everyone or @here mentions, notifying all server members.',
    },
];
