
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
import Image from 'next/image';

const channelIcons: Record<ChannelType, React.ElementType> = {
    text: Hash,
    announcement: Megaphone,
    rules: ScrollText,
    forum: MessageSquare,
};

interface ServerSidebarProps {
  server: Server;
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: (name: string) => Promise<void>;
  onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
}

export function ServerSidebar({ server, channels, selectedChannel, onSelectChannel, onCreateChannel, onUpdateChannel, onDeleteChannel, onUpdateServer, onDeleteServer }: ServerSidebarProps) {
  const { user, authUser } = useAuth();
  const isOwner = user?.uid === server.ownerId;
  const isHeina = user?.displayName === 'heina';

  const handleToggleVerify = () => {
    onUpdateServer(server.id, { isVerified: !server.isVerified });
  }

  return (
    <div className="h-full flex flex-col bg-card/40">
        <div className="border-b shadow-sm relative">
            {server.bannerURL && (
                <div className="h-24 w-full relative">
                    <Image src={server.bannerURL} alt={`${server.name} banner`} fill style={{objectFit: 'cover'}}/>
                </div>
            )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "p-4 w-full text-left hover:bg-accent/50 transition-colors",
                         server.bannerURL && "absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 text-white"
                        )}>
                        <div className="flex items-center gap-2">
                             {server.isVerified && <BadgeCheck className="size-5 text-blue-400 shrink-0" />}
                            <CardTitle className={cn("truncate text-lg", server.bannerURL && "text-shadow-md")}>{server.name}</CardTitle>
                            <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground", server.bannerURL && "text-white/80")} />
                        </div>
                        <CardDescription className={cn("flex items-center gap-1 text-xs ml-1", server.bannerURL && "text-white/70")}>
                            {server.description ? (
                                <span className="truncate">{server.description}</span>
                            ) : (
                                <>
                                    <Users className="size-3"/> {server.members?.length || 0} Members
                                </>
                            )}
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
                            <AddChannelDialog onCreateChannel={onCreateChannel}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Create Channel</span>
                                </DropdownMenuItem>
                            </AddChannelDialog>
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
        </div>
      <SidebarGroup>
        <SidebarGroupLabel>Channels</SidebarGroupLabel>
        <SidebarMenu>
          {channels.map((channel) => {
             const { messages } = useChannelMessages(channel.serverId, channel.id);
             const hasUnreadMention = messages.some(msg => msg.mentions?.includes(authUser?.uid || ''));

             const Icon = channelIcons[channel.type] || Hash;
             return (
              <SidebarMenuItem key={channel.id} className="group/item">
                {hasUnreadMention && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full" />}
                <SidebarMenuButton
                    isActive={selectedChannel?.id === channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={cn(hasUnreadMention && "text-white font-bold")}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </SidebarMenuButton>

                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 absolute right-1 top-1.5 opacity-0 group-hover/item:opacity-100">
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
      </SidebarGroup>
    </div>
  );
}
