
'use client';

import React, { useMemo } from 'react';
import { CardTitle } from '@/components/ui/card';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Server, Channel, ChannelType } from '@/lib/types';
import { Hash, ChevronDown, Settings, Trash, Plus, MoreVertical, Pencil, Megaphone, ScrollText, MessageSquare, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from './edit-server-dialog';
import { AddChannelDialog } from './add-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InviteDialog } from './invite-dialog';

interface ServerSidebarProps {
  server: Server;
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
  onCreateChannel: (name: string) => Promise<void>;
  onUpdateChannel: (channelId: string, data: { name?: string, type?: ChannelType }) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
}

const channelIcons: Record<ChannelType, React.ElementType> = {
    text: Hash,
    announcement: Megaphone,
    rules: ScrollText,
    forum: MessageSquare,
};


export function ServerSidebar({ 
    server, 
    selectedChannel, 
    onSelectChannel, 
    onUpdateServer, 
    onDeleteServer,
    onCreateChannel,
    onUpdateChannel,
    onDeleteChannel
}: ServerSidebarProps) {
    const { authUser } = useAuth();
    const isOwner = authUser?.uid === server.ownerId;

    const sortedChannels = useMemo(() => {
        return server.channels?.sort((a, b) => (a.position || 0) - (b.position || 0)) || [];
    }, [server.channels]);
    
    const renderHeader = () => (
         <div className="p-0 border-b">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-between p-4 w-full hover:bg-accent/50 transition-colors">
                        <CardTitle className="truncate text-lg">{server.name}</CardTitle>
                        <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56" align="start">
                    <InviteDialog serverId={server.id}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-indigo-400 focus:bg-indigo-500/20 focus:text-indigo-300">
                             <UserPlus className="mr-2 h-4 w-4" />
                            <span>Invite People</span>
                        </DropdownMenuItem>
                    </InviteDialog>
                    {isOwner && (
                        <>
                            <DropdownMenuSeparator />
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
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-card/40">
           {renderHeader()}
            <div className="p-0 flex-1 overflow-y-auto">
                <SidebarGroup className="py-2">
                    <SidebarGroupLabel className="px-2 flex items-center justify-between">
                      Text Channels
                      {isOwner && (
                         <AddChannelDialog onCreateChannel={onCreateChannel}>
                            <button className="text-muted-foreground hover:text-foreground">
                                <Plus className="size-4"/>
                            </button>
                         </AddChannelDialog>
                      )}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {sortedChannels.map((channel) => {
                            const Icon = channelIcons[channel.type] || Hash;
                            return (
                                <SidebarMenuItem key={channel.id} className="px-2 group/channel">
                                    <div className="flex items-center w-full">
                                        <SidebarMenuButton 
                                            isActive={selectedChannel?.id === channel.id}
                                            onClick={() => onSelectChannel(channel)}
                                            className={cn("w-full justify-start h-8 px-2")}
                                        >
                                            <Icon className="size-4 text-muted-foreground"/>
                                            <span className="truncate">{channel.name}</span>
                                        </SidebarMenuButton>

                                        {isOwner && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/channel:opacity-100">
                                                        <MoreVertical className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent side="right">
                                                    <EditChannelDialog channel={channel} onUpdateChannel={onUpdateChannel}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Edit Channel</span>
                                                        </DropdownMenuItem>
                                                    </EditChannelDialog>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem 
                                                                className="text-destructive focus:text-destructive" 
                                                                onSelect={(e) => e.preventDefault()}
                                                                disabled={channel.name === '!general'}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                <span>Delete Channel</span>
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete #{channel.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to permanently delete this channel? This cannot be undone.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDeleteChannel(channel.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </div>
        </div>
    );
}
