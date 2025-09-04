'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useChannels } from '@/hooks/use-channels';
import type { Server, Channel } from '@/lib/types';
import { Hash } from 'lucide-react';
import { useState } from 'react';

interface ServerSidebarProps {
  server: Server;
}

export function ServerSidebar({ server }: ServerSidebarProps) {
    const { channels, loading } = useChannels(server.id);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

    return (
        <div className="h-full flex flex-col bg-card/40">
            <CardHeader className="p-4 border-b">
                <CardTitle className="truncate">{server.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <SidebarGroup>
                    <SidebarGroupLabel>Channels</SidebarGroupLabel>
                    <SidebarMenu>
                        {loading && (
                            <>
                                <div className="h-6 w-3/4 bg-muted/50 rounded animate-pulse" />
                                <div className="h-6 w-1/2 bg-muted/50 rounded animate-pulse" />
                            </>
                        )}
                        {channels.map((channel) => (
                             <SidebarMenuItem key={channel.id}>
                                <SidebarMenuButton 
                                    isActive={selectedChannel?.id === channel.id}
                                    onClick={() => setSelectedChannel(channel)}
                                    className="w-full justify-start h-8 px-2"
                                >
                                    <Hash className="size-4 text-muted-foreground"/>
                                    <span className="truncate">{channel.name.substring(1)}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </CardContent>
            {/* Potentially a footer for voice controls etc */}
        </div>
    );
}