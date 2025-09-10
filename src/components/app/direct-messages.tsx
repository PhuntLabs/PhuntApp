
'use client';

import { Button } from '@/components/ui/button';
import { Plus, Users, Compass, Store, MessageSquare, Gem } from 'lucide-react';
import type { PopulatedChat, UserProfile, UserStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddUserDialog } from './add-user-dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface DirectMessagesProps {
  directMessages: PopulatedChat[];
  selectedChat: PopulatedChat | null;
  onSelectChat: (chat: PopulatedChat) => void;
  onAddUser: (username: string) => void;
  loading: boolean;
}

const statusConfig: Record<UserStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
};


export function DirectMessages({ directMessages, selectedChat, onSelectChat, onAddUser, loading }: DirectMessagesProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  if (loading) {
    return (
        <div className="p-2 space-y-2">
            {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-10 bg-muted/50 rounded-md animate-pulse" />
            ))}
        </div>
    );
  }
  
  return (
    <>
      <div className="p-3">
          <Button variant="secondary" className="w-full h-8 justify-start px-2">
            Find or start a conversation
          </Button>
      </div>
      <div className="p-2 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Users className="size-5" /> Friends
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => router.push('/turbo')}>
            <Gem className="size-5" /> Turbo
          </Button>
      </div>

       <div className="px-3 mt-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground">Direct Messages</h2>
            <AddUserDialog onAddUser={onAddUser} onAddBot={() => {}}>
                <Button variant="ghost" size="icon" className="size-5"><Plus/></Button>
            </AddUserDialog>
        </div>
        <ScrollArea className="flex-1 p-2">
            {directMessages.map((chat) => {
                const otherMember = chat.members.find(m => m.id !== user?.uid);
                const chatName = otherMember?.displayName || chat.name || 'Chat';
                const chatAvatar = otherMember?.photoURL || chat.photoURL;
                const status = otherMember?.status || 'offline';
                
                const hasUnread = chat.unreadCount && chat.unreadCount[user?.uid || ''] > 0;
                
                return (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className={cn(
                            "h-11 px-2 rounded-md flex items-center gap-3 w-full text-left transition-colors group",
                            selectedChat?.id === chat.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                        )}
                        >
                        <div className="relative">
                            <Avatar className="size-8 rounded-full">
                                <AvatarImage src={chatAvatar || undefined} />
                                <AvatarFallback>{chatName[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                                statusConfig[status]
                            )} />
                        </div>
                        <span className="truncate flex-1">{chatName}</span>
                         {hasUnread && (
                            <div className="text-[10px] font-bold bg-red-500 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                                {chat.unreadCount?.[user?.uid || '']}
                            </div>
                        )}
                    </button>
                )
            })}
        </ScrollArea>
    </>
  );
}

