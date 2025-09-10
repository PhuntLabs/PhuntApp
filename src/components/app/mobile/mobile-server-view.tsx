
'use client';

import { useState } from 'react';
import type { Server, Channel, UserProfile, ChannelType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Settings, Trash, UserPlus, Pencil, MoreVertical, Search, ListFilter, Hash, Mic, Volume2, Gem, Bell, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileServerSettings } from './mobile-server-settings';
import { MobileChannelSettings } from './mobile-channel-settings';
import { AddChannelDialog } from '../add-channel-dialog';
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
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteDialog } from '../invite-dialog';
import { useAuth } from '@/hooks/use-auth';
import { EditServerDialog } from '../edit-server-dialog';


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

interface MobileServerViewProps {
  server: Server;
  channels: Channel[];
  selectedChannel: Channel | null;
  members: Partial<UserProfile>[];
  onSelectChannel: (channel: Channel) => void;
  onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
  onDeleteServer: (serverId: string) => Promise<void>;
  onCreateChannel: (name: string, type: ChannelType) => Promise<void>;
  onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  onClose?: () => void;
}

export function MobileServerView({ 
    server, 
    channels,
    selectedChannel,
    members,
    onSelectChannel,
    onUpdateServer,
    onDeleteServer,
    onCreateChannel,
    onUpdateChannel,
    onDeleteChannel,
    onClose
}: MobileServerViewProps) {

  const channelCategories = getChannelCategories(channels);
  const { user } = useAuth();
  const isOwner = user?.uid === server.ownerId;


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex-shrink-0">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <div className="p-4 flex items-center justify-between cursor-pointer">
                    <h1 className="text-xl font-bold truncate">{server.name}</h1>
                    <ChevronDown className="size-5 shrink-0" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-1.5rem)] rounded-2xl" align="center">
                <div className="flex flex-col">
                    <div className="h-24 bg-accent relative mb-12 rounded-t-2xl">
                            {server.bannerURL && (
                            <Image src={server.bannerURL} alt={`${server.name} banner`} fill style={{objectFit: 'cover'}} className="rounded-t-2xl"/>
                        )}
                            <Avatar className="absolute top-[5.5rem] left-4 size-20 border-4 border-popover rounded-2xl">
                            <AvatarImage src={server.photoURL || undefined} alt={server.name}/>
                            <AvatarFallback className="text-3xl rounded-2xl">{server.name[0]}</AvatarFallback>
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
                        {isOwner && (
                        <>
                             <MobileServerSettings server={server} members={members} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer} trigger={
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Server Settings</span>
                                </DropdownMenuItem>
                             } onClose={onClose}/>
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

      </header>

      <div className="p-4 border-y flex items-center justify-between">
          <h2 className="font-semibold">Channels</h2>
          <AddChannelDialog onCreateChannel={onCreateChannel}>
            <Button variant="ghost" size="icon"><Plus className="size-5 text-muted-foreground"/></Button>
          </AddChannelDialog>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {Object.entries(channelCategories).map(([categoryName, channelsInCategory]) => (
             <Collapsible key={categoryName} defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-1 w-full text-sm font-semibold text-muted-foreground uppercase py-2">
                   <ChevronDown className="size-4 transition-transform [&[data-state=closed]]:-rotate-90"/>
                   {categoryName}
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-1 pl-2">
                        {channelsInCategory.map(channel => (
                            <div key={channel.id} className="group flex items-center">
                                <button 
                                    onClick={() => onSelectChannel(channel)}
                                    className={cn(
                                        "flex-1 flex items-center gap-2 p-2 rounded-md",
                                        selectedChannel?.id === channel.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                    )}
                                >
                                    <Hash className="size-5"/>
                                    <span className="truncate">{channel.name}</span>
                                </button>
                                 <MobileChannelSettings channel={channel} server={server} onUpdateChannel={onUpdateChannel} trigger={
                                     <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100">
                                        <Settings className="size-4"/>
                                    </Button>
                                 }/>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
