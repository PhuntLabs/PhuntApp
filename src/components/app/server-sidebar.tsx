'use client';

import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChannels } from '@/hooks/use-channels';
import type { Server, Channel } from '@/lib/types';
import { Hash, ChevronDown, Settings, Trash } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from './edit-server-dialog';

interface ServerSidebarProps {
  server: Server;
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onUpdateServer: (serverId: string, name: string, photoURL: string) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
}

export function ServerSidebar({ server, selectedChannel, onSelectChannel, onUpdateServer, onDeleteServer }: ServerSidebarProps) {
    const { authUser } = useAuth();
    const { channels, loading } = useChannels(server.id);
    const isOwner = authUser?.uid === server.ownerId;

    const renderHeader = () => (
         <CardHeader className="p-0 border-b">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-between p-4 w-full hover:bg-accent/50 transition-colors">
                        <CardTitle className="truncate text-lg">{server.name}</CardTitle>
                        <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56" align="start">
                    {isOwner && (
                        <>
                             <EditServerDialog server={server} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Server Settings</span>
                                </DropdownMenuItem>
                            </EditServerDialog>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Leave Server</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
    )

    return (
        <div className="h-full flex flex-col bg-card/40">
           {renderHeader()}
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <SidebarGroup className="py-2">
                    <SidebarGroupLabel className="px-2">Channels</SidebarGroupLabel>
                    <SidebarMenu>
                        {loading && (
                            <div className="space-y-2 px-2">
                                <div className="h-6 w-3/4 bg-muted/50 rounded animate-pulse" />
                                <div className="h-6 w-1/2 bg-muted/50 rounded animate-pulse" />
                            </div>
                        )}
                        {channels.map((channel) => (
                             <SidebarMenuItem key={channel.id} className="px-2">
                                <SidebarMenuButton 
                                    isActive={selectedChannel?.id === channel.id}
                                    onClick={() => onSelectChannel(channel)}
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
