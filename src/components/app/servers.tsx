'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import type { Server } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddServerDialog } from './add-server-dialog';

interface ServersProps {
    servers: Server[];
    loading: boolean;
    onCreateServer: (name: string) => Promise<void>;
}

export function Servers({ servers, loading, onCreateServer }: ServersProps) {
    if (loading) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between">
                    Servers
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuSkeleton showIcon={true} />
                    <SidebarMenuSkeleton showIcon={true} />
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Servers
              <AddServerDialog onCreateServer={onCreateServer}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </AddServerDialog>
            </SidebarGroupLabel>
            <SidebarMenu>
              {servers.map((server) => (
                <SidebarMenuItem key={server.id}>
                    <SidebarMenuButton tooltip={server.name}>
                        <Avatar className="size-8 rounded-md relative">
                          <AvatarImage src={server.photoURL || undefined} />
                          <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground">
                            {server.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
    )
}
