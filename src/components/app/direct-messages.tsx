'use client';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { DirectMessage } from '@/lib/types';

interface DirectMessagesProps {
  directMessages: DirectMessage[];
  selectedChat: DirectMessage;
  onSelectChat: (chat: DirectMessage) => void;
}

export function DirectMessages({ directMessages, selectedChat, onSelectChat }: DirectMessagesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        Direct Messages
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </SidebarGroupLabel>
      <SidebarMenu>
        {directMessages.map((dm) => (
          <SidebarMenuItem key={dm.id}>
            <SidebarMenuButton
              tooltip={dm.name}
              isActive={selectedChat.id === dm.id}
              onClick={() => onSelectChat(dm)}
            >
              <Avatar className="size-6 rounded-md relative">
                <AvatarImage src={dm.avatar} />
                <AvatarFallback>{dm.name[0]}</AvatarFallback>
                {dm.online && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-sidebar" />
                )}
              </Avatar>
              {dm.name}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
