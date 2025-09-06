
'use client';

import { useState, useCallback } from 'react';
import { Home, AtSign, User as UserIcon, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopulatedChat, Server, UserProfile, Channel } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Servers } from './servers';
import { MobileDMList } from './mobile/mobile-dm-list';
import { MobileServerView } from './mobile/mobile-server-view';
import { MobileSettingsPage } from './mobile/mobile-settings-page';
import { Chat } from './chat';
import { ChannelChat } from './channel-chat';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { UserNav } from './user-nav';
import { MentionsDialog } from './mentions-dialog';

interface MobileLayoutProps {
    user: UserProfile;
    servers: Server[];
    chats: PopulatedChat[];
    selectedServer: Server | null;
    selectedChat: PopulatedChat | null;
    onSelectServer: (server: Server | null) => void;
    onSelectChat: (chat: PopulatedChat | null) => void;
    onCreateServer: (name: string) => Promise<void>;
    
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
    
    dmMessages: any[];
    onSendDM: any;
    onEditDM: any;
    onDeleteDM: any;
    
    channelMessages: any[];
    onSendChannelMessage: any;
    onEditChannelMessage: any;
    onDeleteChannelMessage: any;
    
}

type MainView = 'home' | 'notifications' | 'settings';

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
  const [activeView, setActiveView] = useState<MainView>('home');
  const { authUser, logout } = useAuth();

  const handleSelectChat = (chat: PopulatedChat) => {
    onSelectChat(chat);
  };

  const handleSelectChannel = (channel: Channel) => {
    sidebarProps.onSelectChannel(channel);
  };
  
  const handleSelectServer = (server: Server | null) => {
      onSelectServer(server);
      // When a server is selected, ensure we are on the home tab
      setActiveView('home');
  }

  const handleSelectHome = () => {
    setActiveView('home');
    onSelectServer(null);
  };
  
  const onJumpToMessage = () => {} // Placeholder

  const renderHomeContent = () => {
    if (selectedChat && authUser) {
      return (
        <Chat
          chat={selectedChat}
          messages={dmMessages}
          onSendMessage={onSendDM}
          onEditMessage={onEditDM}
          onDeleteMessage={onDeleteDM}
          currentUser={authUser}
        />
      );
    }
    if (selectedServer && sidebarProps.selectedChannel && authUser) {
      return (
        <ChannelChat
          channel={sidebarProps.selectedChannel}
          server={selectedServer}
          currentUser={authUser}
          members={sidebarProps.members}
          messages={channelMessages}
          onSendMessage={onSendChannelMessage}
          onEditMessage={onEditChannelMessage}
          onDeleteMessage={onDeleteChannelMessage}
        />
      );
    }
    
    // Default Home view: The list of DMs or Channels
    if (selectedServer) {
        return (
            <MobileServerView
                server={selectedServer}
                channels={sidebarProps.channels}
                selectedChannel={sidebarProps.selectedChannel}
                members={sidebarProps.members}
                onSelectChannel={handleSelectChannel}
                {...sidebarProps}
            />
        )
    }

    return (
      <MobileDMList 
        chats={chats} 
        onSelectChat={handleSelectChat} 
        onAddUser={sidebarProps.onAddUser}
      />
    );
  };
  
  const renderMainContent = () => {
      if (activeView === 'home') {
          return (
             <div className="flex h-full">
                <Servers
                    servers={servers}
                    loading={false}
                    onCreateServer={onCreateServer}
                    selectedServer={selectedServer}
                    onSelectServer={handleSelectServer}
                    onSelectChat={handleSelectChat}
                />
                <div className="flex-1 min-w-0">
                    {renderHomeContent()}
                </div>
            </div>
          )
      }
      if (activeView === 'notifications') {
         return (
              <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b">
                    <h1 className="text-2xl font-bold">Mentions</h1>
                </div>
                 <MentionsDialog onJumpToMessage={onJumpToMessage}>
                    <div className="p-4">Your mentions will appear here. (Content is in a dialog for now)</div>
                 </MentionsDialog>
              </div>
          );
    }

    if (activeView === 'settings') {
        return <MobileSettingsPage />;
    }
  }


  return (
    <div className="h-screen bg-background flex flex-col">
        <main className="flex-1 min-h-0">{renderMainContent()}</main>

        <nav className="flex items-center justify-around p-2 border-t bg-secondary/30">
          <button
              onClick={handleSelectHome}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'home' && 'text-primary'
              )}
          >
              <Home />
              <span className="text-xs">Home</span>
          </button>
          <button
              onClick={() => setActiveView('notifications')}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'notifications' && 'text-primary'
              )}
          >
              <AtSign />
              <span className="text-xs">Mentions</span>
          </button>
          <button
              onClick={() => setActiveView('settings')}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'settings' && 'text-primary'
              )}
          >
              <UserIcon />
              <span className="text-xs">You</span>
          </button>
        </nav>
    </div>
  );
}
