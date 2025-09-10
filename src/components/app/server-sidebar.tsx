
'use client';

import {
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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

import type { Server, Channel, ChannelType, UserProfile } from '@/lib/types';
import { Hash, ChevronDown, Settings, Trash, Plus, MoreVertical, Pencil, Megaphone, ScrollText, MessageSquare, UserPlus, BadgeCheck, Users, Gem, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from './edit-server-dialog';
import { AddChannelDialog } from './add-channel-dialog';
import { EditChannelDialog } from './edit-channel-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InviteDialog } from './invite-dialog';
import { useChannelMessages } from '@/hooks/use-channel-messages';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const channelIcons: Record<ChannelType, React.ElementType> = {
    text: Hash,
    announcement: Megaphone,
    rules: ScrollText,
    forum: MessageSquare,
};

// Simple logic to categorize channels based on name.
// A more robust system would involve categories stored in Firestore.
const getChannelCategories = (channels: Channel[]) => {
    const categories: Record<string, Channel[]> = {
        'Lobby': [],
        'Misc': [],
    };
    
    channels.forEach(channel => {
        if (['general', 'support', 'rules'].includes(channel.name)) {
            categories['Lobby'].push(channel);
        } else {
            categories['Misc'].push(channel);
        }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
        if (categories[key].length === 0) {
            delete categories[key];
        }
    });

    return categories;
}

interface ServerSidebarProps {
  server: Server;
  channels: Channel[];
  selectedChannel: Channel | null;
  members: Partial<UserProfile>[];
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: (name: string, type: ChannelType) => Promise<void>;
  onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
}

export function ServerSidebar({ server, channels, selectedChannel, members, onSelectChannel, onCreateChannel, onUpdateChannel, onDeleteChannel, onUpdateServer, onDeleteServer }: ServerSidebarProps) {
  const { user, authUser } = useAuth();
  const isOwner = user?.uid === server.ownerId;
  const isHeina = user?.displayName === 'heina';
  const channelCategories = getChannelCategories(channels);


  const handleToggleVerify = () => {
    onUpdateServer(server.id, { isVerified: !server.isVerified });
  }

  return (
    <div className="h-full flex flex-col bg-card/40">
        <div className="border-b shadow-sm relative">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <button className="p-4 w-full text-left hover:bg-accent/50 transition-colors flex items-center justify-between">
                        <div className="flex-1 overflow-hidden">
                             <CardTitle className="truncate text-lg">{server.name}</CardTitle>
                        </div>
                        <ChevronDown className="size-5 shrink-0 text-muted-foreground ml-2" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="start">
                    <div className="flex flex-col">
                        <div className="h-20 bg-accent relative mb-12">
                             {server.bannerURL && (
                                <Image src={server.bannerURL} alt={`${server.name} banner`} fill style={{objectFit: 'cover'}}/>
                            )}
                             <Avatar className="absolute top-16 left-4 size-20 border-4 border-popover rounded-xl">
                                <AvatarImage src={server.photoURL || undefined} alt={server.name}/>
                                <AvatarFallback className="text-3xl rounded-xl">{server.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="p-4 pt-0">
                            <h3 className="font-bold text-lg">{server.name}</h3>
                            <p className="text-sm text-muted-foreground">{server.description || "No description."}</p>
                             <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-green-500"/> {members.length} Online</span>
                                <span className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-gray-500"/> {server.members.length} Members</span>
                            </div>
                        </div>

                         <div className="grid grid-cols-3 gap-2 px-4 mb-2">
                            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50">
                                <Gem className="size-5 text-purple-400"/>
                                <span className="text-xs font-semibold">0 Boosts</span>
                            </div>
                             <InviteDialog serverId={server.id}>
                                 <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary">
                                    <UserPlus className="size-5"/>
                                    <span className="text-xs font-semibold">Invite</span>
                                </div>
                            </InviteDialog>
                            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50">
                                <Bell className="size-5"/>
                                <span className="text-xs font-semibold">Notifications</span>
                            </div>
                        </div>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem>
                            <CheckCircle className="mr-2"/> Mark As Read
                         </DropdownMenuItem>

                         <DropdownMenuSeparator />
                        {isHeina && (
                             <DropdownMenuItem onSelect={handleToggleVerify}>
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                <span>{server.isVerified ? 'Unverify Server' : 'Verify Server'}</span>
                            </DropdownMenuItem>
                        )}
                        {isOwner && (
                            <>
                                <AddChannelDialog onCreateChannel={onCreateChannel}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Create Channel</span>
                                    </DropdownMenuItem>
                                </AddChannelDialog>
                                <EditServerDialog server={server} members={members} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer}>
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
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <SidebarGroup>
            {Object.entries(channelCategories).map(([categoryName, channelsInCategory]) => (
                <Collapsible key={categoryName} defaultOpen className="py-1">
                    <CollapsibleTrigger className="flex items-center gap-1 w-full text-xs font-semibold text-muted-foreground uppercase py-1">
                        <ChevronDown className="size-3 transition-transform [&[data-state=closed]]:-rotate-90"/>
                        {categoryName}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="pl-1">
                            {channelsInCategory.map((channel) => {
                                const { messages } = useChannelMessages(channel.serverId, channel.id);
                                const hasUnreadMention = messages.some(msg => msg.mentions?.includes(authUser?.uid || ''));
                                const Icon = channelIcons[channel.type] || Hash;
                                return (
                                    <SidebarMenuItem key={channel.id} className="group/item">
                                        {hasUnreadMention && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full" />}
                                        <SidebarMenuButton
                                            isActive={selectedChannel?.id === channel.id}
                                            onClick={() => onSelectChannel(channel)}
                                            className={cn("h-7", hasUnreadMention && "text-white font-bold")}
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span>{channel.name}</span>
                                        </SidebarMenuButton>

                                        {isOwner && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <EditChannelDialog channel={channel} server={server} onUpdateChannel={onUpdateChannel}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Edit Channel</span>
                                                        </DropdownMenuItem>
                                                    </EditChannelDialog>
                                                    <DropdownMenuSeparator/>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onSelect={(e) => e.preventDefault()}
                                                                disabled={channel.name === 'general'}
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
                                                                <AlertDialogAction onClick={() => onDeleteChannel(channel.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </SidebarGroup>
    </div>
  );
}
