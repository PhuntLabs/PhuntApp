
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Bell, User as UserIcon, MessageSquare, Cog, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopulatedChat, Server, UserProfile, Channel, Game } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Servers } from './servers';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileDMList } from './mobile/mobile-dm-list';
import { MobileServerView } from './mobile/mobile-server-view';
import { MobileSettingsPage } from './mobile/mobile-settings-page';
import { Chat } from './chat';
import { ChannelChat } from './channel-chat';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { DirectMessages } from './direct-messages';
import { PendingRequests } from './pending-requests';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { useToast } from '@/hooks/use-toast';
import { ServerSidebar } from './server-sidebar';

interface MobileLayoutProps {
    user: UserProfile;
    servers: Server[];
    chats: PopulatedChat[];
    selectedServer: Server | null;
    selectedChat: PopulatedChat | null;
    onSelectServer: (server: Server | null) => void;
    onSelectChat: (chat: PopulatedChat | null) => void;
    onCreateServer: (name: string) => Promise<void>;
    
    // Props for sidebar content
    channels: Channel[];
    members: Partial<UserProfile>[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onCreateChannel: (name: string) => Promise<void>;
    onUpdateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
    onDeleteChannel: (channelId: string) => Promise<void>;
    onUpdateServer: (serverId: string, data: Partial<Omit<Server, 'id'>>) => Promise<void>;
    onDeleteServer: (serverId: string) => Promise<void>;
    onAddUser: (username: string) => void;
    onAddBot: () => void;
    onDeleteChat: (chatId: string) => void;
    
    // Message props passed down to chat views
    dmMessages: any[];
    onSendDM: any;
    onEditDM: any;
    onDeleteDM: any;
    
    channelMessages: any[];
    onSendChannelMessage: any;
    onEditChannelMessage: any;
    onDeleteChannelMessage: any;
}

type MainView = 'dms' | 'server' | 'notifications' | 'settings';

export function MobileLayout({
    user,
    servers,
    chats,
    selectedServer,
    selectedChat,
    onSelectServer,
    onSelectChat,
    onCreateServer,
    dmMessages,
    onSendDM,
    onEditDM,
    onDeleteDM,
    channelMessages,
    onSendChannelMessage,
    onEditChannelMessage,
    onDeleteChannelMessage,
    ...sidebarProps
}: MobileLayoutProps) {
  
  const renderChatContent = () => {
      if (selectedChat && user.uid) {
         return <Chat
            chat={selectedChat}
            messages={dmMessages}
            onSendMessage={onSendDM}
            onEditMessage={onEditDM}
            onDeleteMessage={onDeleteDM}
            currentUser={{ uid: user.uid } as any}
        />
      }
      if (selectedServer && sidebarProps.selectedChannel && user.uid) {
        return <ChannelChat 
            channel={sidebarProps.selectedChannel} 
            server={selectedServer} 
            currentUser={{ uid: user.uid } as any}
            members={sidebarProps.members}
            messages={channelMessages}
            onSendMessage={onSendChannelMessage}
            onEditMessage={onEditChannelMessage}
            onDeleteMessage={onDeleteChannelMessage}
            />
      }
      // This is the initial state before any chat is selected.
      // We can return a specific component here, or the sidebar can handle it.
      // For now, let's keep the main content area blank and let the sidebar be the focus.
      return (
        <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex items-center">
                <SidebarTrigger>
                    <Button variant="ghost" size="icon">
                        <Menu />
                    </Button>
                </SidebarTrigger>
                <h2 className="ml-2 font-semibold">Select a Conversation</h2>
            </div>
            <div className="flex-1 bg-muted/30 flex items-center justify-center">
                 <p className="text-muted-foreground">Select a server or DM to start</p>
            </div>
        </div>
      );
  }
  
  const { setOpenMobile } = useSidebar();
  
  const handleSelectChat = (chat: PopulatedChat) => {
    onSelectChat(chat);
    setOpenMobile(false);
  }

  const handleSelectChannel = (channel: Channel) => {
    sidebarProps.onSelectChannel(channel);
    setOpenMobile(false);
  }
  
  const handleSelectServer = (server: Server | null) => {
    onSelectServer(server);
    // Don't close sidebar, let user pick a channel
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar>
             <div className="flex h-full">
                <Servers 
                    servers={servers}
                    loading={false}
                    onCreateServer={onCreateServer}
                    selectedServer={selectedServer}
                    onSelectServer={handleSelectServer}
                    onSelectChat={handleSelectChat}
                />
                <div className="flex-1 flex flex-col bg-secondary/30">
                    <main className="flex-1 overflow-y-auto">
                        {selectedServer ? (
                            <ServerSidebar 
                                server={selectedServer}
                                channels={sidebarProps.channels}
                                selectedChannel={sidebarProps.selectedChannel}
                                members={sidebarProps.members}
                                onSelectChannel={handleSelectChannel}
                                {...sidebarProps}
                            />
                        ) : (
                            <div className="p-2">
                                <DirectMessages
                                    directMessages={chats}
                                    selectedChat={selectedChat}
                                    onSelectChat={handleSelectChat}
                                    onAddUser={sidebarProps.onAddUser}
                                    onAddBot={sidebarProps.onAddBot}
                                    onDeleteChat={sidebarProps.onDeleteChat}
                                    loading={false}
                                />
                            </div>
                        )}
                    </main>
                    <footer className="bg-background/50 p-2 border-t border-border">
                        <UserNav user={user} logout={() => {}}/>
                    </footer>
                </div>
            </div>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0">
            {renderChatContent()}
        </main>
    </div>
  );
}
