
'use client';

import { useCallback } from 'react';
import type { Server, Permission } from '@/lib/types';
import { useAuth } from './use-auth';

export function usePermissions(server: Server | null, channelId: string | null) {
    const { authUser } = useAuth();

    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!authUser || !server) return false;

        // Server owner has all permissions
        if (server.ownerId === authUser.uid) return true;

        const memberDetails = server.memberDetails?.[authUser.uid];
        if (!memberDetails) return false;

        const memberRoleIds = new Set(memberDetails.roles);
        const memberRoles = server.roles?.filter(role => memberRoleIds.has(role.id)) || [];

        // Check for administrator permission first
        if (memberRoles.some(role => role.permissions.administrator)) {
            return true;
        }

        const channel = server.channels?.find(c => c.id === channelId);
        const channelOverwrites = channel?.permissionOverwrites || {};

        let hasPerm = false;

        // Check base server role permissions
        for (const role of memberRoles) {
            if (role.permissions[permission]) {
                hasPerm = true;
                break;
            }
        }
        // Deny from channel overwrites takes precedence
        for (const role of memberRoles) {
            if (channelOverwrites[role.id]?.[permission] === false) {
                 return false;
            }
        }
        
        // Grant from channel overwrites
        for (const role of memberRoles) {
             if (channelOverwrites[role.id]?.[permission] === true) {
                return true;
            }
        }

        return hasPerm;

    }, [authUser, server, channelId]);

    return { hasPermission };
}
