

'use client';

import { useState } from 'react';
import type { Server, Channel, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Settings, Trash, UserPlus, Pencil, MoreVertical, Search, ListFilter, Hash, Mic, Volume2 } from 'lucide-react';
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
  onCreateChannel: (name: string) => Promise<void>;
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

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex-shrink-0">
        <div className="h-32 bg-accent relative">
            {server.bannerURL && (
                <Image src={server.bannerURL} alt="Server Banner" fill style={{objectFit: 'cover'}} />
            )}
        </div>
        <div className="p-4 space-y-3">
             <MobileServerSettings server={server} members={members} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer} trigger={
                 <button className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold truncate">{server.name}</h1>
                    <ChevronDown className="size-5 shrink-0" />
                </button>
             } onClose={onClose}/>
            
            <p className="text-sm text-muted-foreground">{server.members.length} Members</p>
            <div className="flex gap-2">
                <div className="relative flex-1">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
                     <Input placeholder="Search" className="pl-8 bg-card border-none focus-visible:ring-1"/>
                </div>
                <Button variant="secondary" size="icon">
                    <UserPlus className="size-5"/>
                </Button>
            </div>
        </div>
      </header>

      <div className="p-4 border-y flex items-center justify-between">
          <h2 className="font-semibold">Channels & Roles</h2>
          <ListFilter className="size-5 text-muted-foreground"/>
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
                            <button 
                                key={channel.id}
                                onClick={() => onSelectChannel(channel)}
                                className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-md",
                                    selectedChannel?.id === channel.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                )}
                            >
                                <Hash className="size-5"/>
                                <span className="truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
          ))}
           <div className="p-4 mt-4">
                <Button variant="secondary" className="w-full">
                    <Volume2 className="mr-2"/> Show All
                </Button>
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
