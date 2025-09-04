'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle, Bot } from 'lucide-react';
import type { PopulatedChat } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { AddUserDialog } from './add-user-dialog';

interface DirectMessagesProps {
  directMessages: PopulatedChat[];
  selectedChat: PopulatedChat | null;
  onSelectChat: (chat: PopulatedChat) => void;
  onAddUser: (username: string) => void;
  onAddBot: () => void;
  loading: boolean;
}

export function DirectMessages({ directMessages, selectedChat, onSelectChat, onAddUser, onAddBot, loading }: DirectMessagesProps) {
  const { user } = useAuth();
  
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
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        Direct Messages
        <AddUserDialog onAddUser={onAddUser} onAddBot={onAddBot}>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </AddUserDialog>
      </SidebarGroupLabel>
      <SidebarMenu>
        {directMessages.map((chat) => {
          const otherMember = chat.members.find(m => m.id !== user?.uid);
          const chatName = otherMember?.displayName || chat.name || 'Chat';
          const chatAvatar = otherMember?.photoURL || chat.photoURL;
          const isBotChat = otherMember?.isBot;

          return (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                tooltip={chatName}
                isActive={selectedChat?.id === chat.id}
                onClick={() => onSelectChat(chat)}
              >
                <Avatar className="size-6 rounded-md relative">
                  <AvatarImage src={chatAvatar || undefined} />
                  <AvatarFallback>{chatName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span>{chatName}</span>
                   {chat.isOfficial && (
                      <Badge variant="outline" className="h-4 px-1 flex items-center gap-0.5 border-green-500 text-green-500">
                        <CheckCircle className="size-2" /> OFFICIAL
                      </Badge>
                  )}
                  {isBotChat && (
                      <Badge variant="secondary" className="h-4 px-1 flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        <Bot className="size-2.5" /> BOT
                      </Badge>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
