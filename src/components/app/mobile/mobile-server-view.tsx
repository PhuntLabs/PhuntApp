'use client';

import { useState } from 'react';
import type { Server, Channel, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Settings, Trash, UserPlus, Pencil, MoreVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ServerSidebar } from '../server-sidebar';
import { MobileServerSettings } from './mobile-server-settings';
import { MobileChannelSettings } from './mobile-channel-settings';
import { EditServerDialog } from '../edit-server-dialog';
import { AddChannelDialog } from '../add-channel-dialog';
import { EditChannelDialog } from '../edit-channel-dialog';
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
    onDeleteChannel
}: MobileServerViewProps) {
  const [sheetOpen, setSheetOpen] = useState<'server' | 'channel' | null>(null);

  return (
    <div className="flex flex-col h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-4 border-b flex items-center justify-between w-full text-left">
            <h1 className="text-xl font-bold truncate">{server.name}</h1>
            <ChevronDown className="size-5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <EditServerDialog server={server} members={members} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer}>
                <div className="w-full flex items-center"><Settings className="mr-2 h-4 w-4" />Server Settings</div>
              </EditServerDialog>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <AddChannelDialog onCreateChannel={onCreateChannel}>
                 <div className="w-full flex items-center"><Plus className="mr-2 h-4 w-4" />Create Channel</div>
            </AddChannelDialog>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Leave Server
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {channels.map(channel => (
            <div key={channel.id} className="group flex items-center justify-between rounded-md hover:bg-accent pr-1">
              <button 
                onClick={() => onSelectChannel(channel)}
                className="flex-1 p-2 text-left text-muted-foreground flex items-center gap-2"
              >
                <span className="text-xl">#</span>
                <span className="truncate">{channel.name}</span>
              </button>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <EditChannelDialog channel={channel} server={server} onUpdateChannel={onUpdateChannel}>
                        <div className="w-full flex items-center"><Pencil className="mr-2 size-4" />Edit Channel</div>
                      </EditChannelDialog>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator/>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()} disabled={channel.name === 'general'}>
                              <Trash className="mr-2 size-4" />Delete Channel
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
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
