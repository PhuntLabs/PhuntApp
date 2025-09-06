
'use client';

import { useState, useCallback } from 'react';
import { Home, AtSign, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopulatedChat, Server, UserProfile, Channel } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Servers } from './servers';
import { MobileDMList } from './mobile/mobile-dm-list';
import { MobileServerView } from './mobile/mobile-server-view';
import { MobileSettingsPage } from './mobile/mobile-settings-page';
import { Chat } from './chat';
import { ChannelChat } from './channel-chat';
import { Sheet, SheetContent } from '../ui/sheet';
import { Sidebar, useSidebar } from '../ui/sidebar';
import { DirectMessages } from './direct-messages';
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
    
    onJumpToMessage: (context: any) => void;
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
    onJumpToMessage,
    ...sidebarProps
}: MobileLayoutProps) {
  const [activeView, setActiveView] = useState<MainView>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on mobile
  const { setOpenMobile } = useSidebar();

  const renderMainContent = () => {
    if (selectedChat && user.uid) {
      return (
        <Chat
          chat={selectedChat}
          messages={dmMessages}
          onSendMessage={onSendDM}
          onEditMessage={onEditDM}
          onDeleteMessage={onDeleteDM}
          currentUser={{ uid: user.uid } as any}
        />
      );
    }
    if (selectedServer && sidebarProps.selectedChannel && user.uid) {
      return (
        <ChannelChat
          channel={sidebarProps.selectedChannel}
          server={selectedServer}
          currentUser={{ uid: user.uid } as any}
          members={sidebarProps.members}
          messages={channelMessages}
          onSendMessage={onSendChannelMessage}
          onEditMessage={onEditChannelMessage}
          onDeleteMessage={onDeleteChannelMessage}
        />
      );
    }
    // Default view when no chat is selected
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
          {activeView === 'home' && (
              <MobileDMList 
                chats={chats} 
                onSelectChat={(chat) => {
                    onSelectChat(chat);
                    setIsSidebarOpen(false);
                }} 
                onAddUser={sidebarProps.onAddUser}
            />
          )}
          {activeView === 'notifications' && (
              <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b">
                    <h1 className="text-2xl font-bold">Mentions</h1>
                </div>
                 <MentionsDialog onJumpToMessage={onJumpToMessage}>
                    <div className="p-4">Your mentions will appear here.</div>
                 </MentionsDialog>
              </div>
          )}
          {activeView === 'settings' && <MobileSettingsPage />}
      </div>
    );
  };
  
  const handleSelectChannel = (channel: Channel) => {
    sidebarProps.onSelectChannel(channel);
    setIsSidebarOpen(false);
  }

  const handleSelectServer = (server: Server | null) => {
    onSelectServer(server);
    // Don't close sidebar, let user pick a channel or DM
    setActiveView('home');
  }
  
  const handleSelectChat = (chat: PopulatedChat | null) => {
      onSelectChat(chat);
      setIsSidebarOpen(false);
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[calc(100vw-5rem)] flex gap-0">
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
                <MobileServerView
                  server={selectedServer}
                  channels={sidebarProps.channels}
                  selectedChannel={sidebarProps.selectedChannel}
                  members={sidebarProps.members}
                  onSelectChannel={handleSelectChannel}
                  {...sidebarProps}
                />
              ) : (
                 <MobileDMList 
                    chats={chats} 
                    onSelectChat={(chat) => {
                        onSelectChat(chat);
                        setIsSidebarOpen(false);
                    }} 
                    onAddUser={sidebarProps.onAddUser}
                />
              )}
            </main>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-h-0">{renderMainContent()}</main>

        <nav className="flex items-center justify-around p-2 border-t bg-secondary/50">
          <button
            onClick={() => setActiveView('home')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground",
              activeView === 'home' && 'text-primary'
            )}
          >
            <Home />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setActiveView('notifications')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground",
              activeView === 'notifications' && 'text-primary'
            )}
          >
            <AtSign />
            <span className="text-xs">Mentions</span>
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground",
              activeView === 'settings' && 'text-primary'
            )}
          >
            <UserIcon />
            <span className="text-xs">You</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
