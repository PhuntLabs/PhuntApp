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

const ActiveNowCard = ({ user }: { user: Partial<UserProfile> }) => {
    if (!user.currentGame) return null;
    const game = user.currentGame;

    return (
        <div className="w-40 shrink-0">
            <div className="aspect-video rounded-lg relative overflow-hidden bg-accent">
                 { "logoUrl" in game && game.logoUrl ? (
                    <Avatar className="w-full h-full rounded-lg">
                        <AvatarImage src={game.logoUrl} alt={game.name} className="object-cover"/>
                        <AvatarFallback className="rounded-lg">{game.name[0]}</AvatarFallback>
                    </Avatar>
                ) : "imageUrl" in game && game.imageUrl ? (
                    <Avatar className="w-full h-full rounded-lg">
                        <AvatarImage src={game.imageUrl} alt={game.name} className="object-cover"/>
                        <AvatarFallback className="rounded-lg">{game.name[0]}</AvatarFallback>
                    </Avatar>
                ): <div className="w-full h-full bg-accent flex items-center justify-center"><Gamepad2 className="size-8 text-muted-foreground"/></div>}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm p-1.5">
                    <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-semibold truncate text-white">{user.displayName}</p>
                    </div>
                </div>
            </div>
            <p className="font-semibold text-sm truncate mt-1">{game.name}</p>
            <p className="text-xs text-muted-foreground truncate">Roblox</p>
        </div>
    )
}

export function MobileDMList({ chats, onSelectChat, onAddUser }: MobileDMListProps) {
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(chat => {
    const otherMember = chat.members.find(m => m.id !== 'currentUser'); // replace with actual current user id
    return otherMember?.displayName?.toLowerCase().includes(search.toLowerCase());
  });
  
  const activeUsers = chats
    .map(c => c.members.find(m => m.id !== 'currentUser' && m.currentGame))
    .filter(Boolean) as UserProfile[];


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
        <div className="p-4">
             {activeUsers.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Active Now</h2>
                    <ScrollArea className="w-full" orientation="horizontal">
                        <div className="flex gap-3 pb-2">
                            {activeUsers.map(user => (
                                <ActiveNowCard key={user.uid} user={user} />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
            
            <h2 className="text-lg font-semibold mb-2">Recent Conversations</h2>
            <div className="space-y-1">
                {filteredChats.map(chat => {
                    const otherMember = chat.members.find(m => m.id !== 'currentUser');
                    if (!otherMember) return null;

                    const status = otherMember.status || 'offline';

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
                                    You: This is the last message...
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
