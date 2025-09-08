
'use client';

import { useState } from 'react';
import type { PopulatedChat, UserProfile, UserStatus, Game } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, Gamepad2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { AddUserDialog } from '../add-user-dialog';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { ActiveNowList } from '../active-now-list';
import { Separator } from '@/components/ui/separator';

interface MobileDMListProps {
  chats: PopulatedChat[];
  onSelectChat: (chat: PopulatedChat) => void;
  onAddUser: (username: string) => void;
}

const statusConfig: Record<UserStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
};


export function MobileDMList({ chats, onSelectChat, onAddUser }: MobileDMListProps) {
  const { authUser, user } = useAuth();
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(chat => {
    const otherMember = chat.members.find(m => m.id !== authUser?.uid);
    return otherMember?.displayName?.toLowerCase().includes(search.toLowerCase());
  });

  const activeFriends = chats
    .map(chat => chat.members.find(m => m.id !== user?.uid))
    .filter((member): member is UserProfile => !!member && member.status !== 'offline');


  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8 bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AddUserDialog onAddUser={onAddUser} onAddBot={() => {}}>
            <Button>
              <UserPlus className="mr-2 size-4" /> Add Friends
            </Button>
          </AddUserDialog>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {activeFriends.length > 0 && (
            <div className="p-4 space-y-2">
                 <h3 className="text-sm font-semibold text-muted-foreground uppercase">Active Now</h3>
                 <ActiveNowList users={activeFriends} />
                 <Separator className="!mt-4"/>
            </div>
        )}
        <div className="p-4 pt-0">
            <h2 className="text-lg font-semibold mb-2">Recent Conversations</h2>
            <div className="space-y-1">
                {filteredChats.map(chat => {
                    const otherMember = chat.members.find(m => m.id !== authUser?.uid);
                    if (!otherMember) return null;

                    const status = otherMember.status || 'offline';
                    
                    const lastMessagePrefix = chat.lastMessage?.senderId === authUser?.uid ? 'You: ' : '';

                    return (
                        <button key={chat.id} onClick={() => onSelectChat(chat)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left">
                            <div className="relative">
                                <Avatar className="size-12">
                                    <AvatarImage src={otherMember.photoURL || undefined}/>
                                    <AvatarFallback>{otherMember.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background", statusConfig[status])} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-baseline justify-between">
                                    <p className="font-semibold truncate">{otherMember.displayName}</p>
                                    <p className="text-xs text-muted-foreground shrink-0">
                                        {chat.lastMessageTimestamp ? formatDistanceToNowStrict((chat.lastMessageTimestamp as any).toDate()) : ''}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {lastMessagePrefix}{chat.lastMessage?.text || 'No messages yet.'}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
