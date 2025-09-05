
'use client';

import React, { useMemo } from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
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
import { Hash, ChevronDown, Settings, Trash, Plus, MoreVertical, Pencil, Megaphone, ScrollText, MessageSquare, UserPlus, BadgeCheck, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from './edit-server-dialog';
import { AddChannelDialog } from './add-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InviteDialog } from './invite-dialog';
import { useChannelMessages } from '@/hooks/use-channel-messages';

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

const ChannelMenuItem = ({
    channel,
    isOwner,
    selectedChannel,
    onSelectChannel,
    onUpdateChannel,
    onDeleteChannel,
}: {
    channel: Channel;
    isOwner: boolean;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onUpdateChannel: (channelId: string, data: { name?: string; type?: ChannelType; }) => Promise<void>;
    onDeleteChannel: (channelId: string) => Promise<void>;
}) => {
    const { authUser } = useAuth();
    // This hook will fetch messages for THIS specific channel
    const { messages } = useChannelMessages(channel.serverId, channel.id);

    const hasUnreadMention = useMemo(() => {
        if (!authUser) return false;
        // Don't show notification if we're already in the channel
        if (selectedChannel?.id === channel.id) return false;
        // Check if any message in this channel mentions the current user
        return messages.some(msg => msg.mentions?.includes(authUser.uid));
    }, [messages, authUser, selectedChannel, channel.id]);

    const Icon = channelIcons[channel.type] || Hash;

    return (
        <SidebarMenuItem className="px-2 group/channel">
            <div className="flex items-center w-full relative">
                <SidebarMenuButton
                    isActive={selectedChannel?.id === channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={cn(
                        "w-full justify-start h-8 px-2",
                        hasUnreadMention && "text-white font-bold"
                    )}
                >
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="truncate">{channel.name}</span>
                </SidebarMenuButton>

                {hasUnreadMention && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full" />}

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
    );
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
    const { user: currentUser } = useAuth();
    const isOwner = currentUser?.uid === server.ownerId;
    const isHeina = currentUser?.displayName === 'heina';

    const handleToggleVerify = () => {
        onUpdateServer(server.id, { isVerified: !server.isVerified });
    }

    const sortedChannels = useMemo(() => {
        return server.channels?.sort((a, b) => (a.position || 0) - (b.position || 0)) || [];
    }, [server.channels]);

    const renderHeader = () => (
        <div className="p-0 border-b flex items-center justify-between pr-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-start gap-0 p-4 w-full hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                             {server.isVerified && <BadgeCheck className="size-5 text-blue-500 shrink-0" />}
                            <CardTitle className="truncate text-lg">{server.name}</CardTitle>
                            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                        </div>
                        <CardDescription className="flex items-center gap-1 text-xs ml-1">
                            <Users className="size-3"/> {server.members?.length || 0} Members
                        </CardDescription>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                    <InviteDialog serverId={server.id}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-indigo-400 focus:bg-indigo-500/20 focus:text-indigo-300">
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Invite People</span>
                        </DropdownMenuItem>
                    </InviteDialog>
                    {isHeina && (
                         <DropdownMenuItem onSelect={handleToggleVerify}>
                            <BadgeCheck className="mr-2 h-4 w-4" />
                            <span>{server.isVerified ? 'Unverify Server' : 'Verify Server'}</span>
                        </DropdownMenuItem>
                    )}
                    {isOwner && (
                        <>
                            <DropdownMenuSeparator />
                            <EditServerDialog server={server} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Server Settings</span>
                                </DropdownMenuItem>
                            </EditServerDialog>
                        </>
                    )}
                     <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Leave Server</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <SidebarTrigger />
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
                                    <Plus className="size-4" />
                                </button>
                            </AddChannelDialog>
                        )}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {sortedChannels.map((channel) => (
                            <ChannelMenuItem
                                key={channel.id}
                                channel={channel}
                                isOwner={isOwner}
                                selectedChannel={selectedChannel}
                                onSelectChannel={onSelectChannel}
                                onUpdateChannel={onUpdateChannel}
                                onDeleteChannel={onDeleteChannel}
                            />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </div>
        </div>
    );
}
