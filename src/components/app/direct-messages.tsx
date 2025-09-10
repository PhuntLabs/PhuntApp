
'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot, X, CircleDot, Moon, XCircle, MessageCircleMore, Gamepad2, Users } from 'lucide-react';
import type { PopulatedChat, UserProfile, UserStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { AddUserDialog } from './add-user-dialog';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '../ui/scroll-area';
import { ActiveNowList } from './active-now-list';
import { Separator } from '../ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface DirectMessagesProps {
  directMessages: PopulatedChat[];
  selectedChat: PopulatedChat | null;
  onSelectChat: (chat: PopulatedChat) => void;
  onAddUser: (username: string) => void;
  onAddBot: () => void;
  onDeleteChat: (chatId: string) => void;
  loading: boolean;
}

const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'bg-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'bg-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'bg-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'bg-gray-500' },
};

export function DirectMessages({ directMessages, selectedChat, onSelectChat, onAddUser, onAddBot, onDeleteChat, loading }: DirectMessagesProps) {
  const { user } = useAuth();
  
  const allFriends = directMessages
    .map(chat => chat.members.find(m => m.id !== user?.uid))
    .filter((member): member is UserProfile => !!member);

  if (loading) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
                Direct Messages
            </SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuSkeleton showIcon={true} />
                <SidebarMenuSkeleton showIcon={true} />
            </SidebarMenu>
        </SidebarGroup>
    );
  }
  
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between !px-3 !text-base !font-semibold !text-foreground">
          Message
          <Badge className="bg-muted text-muted-foreground">12</Badge>
        </SidebarGroupLabel>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>
          Recent Chats
        </SidebarGroupLabel>
        <SidebarMenu>
          {directMessages.map((chat) => {
            const otherMember = chat.members.find(m => m.id !== user?.uid);
            const chatName = otherMember?.displayName || chat.name || 'Chat';
            const chatAvatar = otherMember?.photoURL || chat.photoURL;
            const isBotChat = otherMember?.isBot;
            const status = otherMember?.status || 'offline';
            
            let subtext = otherMember?.customStatus || statusConfig[status].label;
            let SubIcon = null;

            if (otherMember?.currentGame) {
              subtext = `Playing ${otherMember.currentGame.name}`;
              SubIcon = Gamepad2;
            } else if (otherMember?.currentSong) {
              subtext = `Listening to ${otherMember.currentSong.title}`;
              SubIcon = Bot; // Placeholder, should be a music icon
            }

            const hasUnread = chat.unreadCount && chat.unreadCount[user?.uid || ''] > 0;
            
            return (
              <SidebarMenuItem key={chat.id} className="group/item">
                <SidebarMenuButton
                  tooltip={chatName}
                  isActive={selectedChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn("h-auto py-2.5", hasUnread && "font-semibold")}
                >
                  <div className="relative z-10 flex items-center gap-3 w-full">
                      <div className="relative">
                        <Avatar className="size-10 rounded-full relative">
                          <AvatarImage src={chatAvatar || undefined} />
                          <AvatarFallback>{chatName[0]}</AvatarFallback>
                        </Avatar>
                         <div className={cn(
                              "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card",
                              statusConfig[status].color
                          )} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className={cn("truncate", otherMember?.nameplateUrl ? 'text-white' : '')}>{chatName}</span>
                          <span className="text-xs text-muted-foreground">{chat.lastMessageTimestamp ? formatDistanceToNow((chat.lastMessageTimestamp as any).toDate(), { addSuffix: true }) : ''}</span>
                        </div>
                        <p className={cn("text-xs truncate flex items-center gap-1 text-muted-foreground")}>
                          {chat.lastMessage?.text || 'No messages yet.'}
                        </p>
                      </div>
                  </div>
                </SidebarMenuButton>

                  {hasUnread && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1.5 flex items-center justify-center z-20">
                          {chat.unreadCount?.[user?.uid || '']}
                      </div>
                  )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
