
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
import { MentionsDialog } from './mentions-dialog';
import { Button } from '../ui/button';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { authUser } = useAuth();

  const handleSelectChat = (chat: PopulatedChat) => {
    onSelectChat(chat);
    setIsSidebarOpen(false);
  };

  const handleSelectChannel = (channel: Channel) => {
    sidebarProps.onSelectChannel(channel);
    setIsSidebarOpen(false);
  };
  
  const handleSelectServer = (server: Server | null) => {
      onSelectServer(server);
      setActiveView('home');
  }

  const handleSelectHome = () => {
    onSelectServer(null); // Go to DMs when home is clicked
    setActiveView('home');
  };
  
  const onJumpToMessage = () => {} // Placeholder

  const renderHomeContent = () => {
    const sidebarTrigger = (
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu />
            </Button>
        </SheetTrigger>
    );

    if (selectedChat && authUser) {
        return <Chat chat={selectedChat} messages={dmMessages} onSendMessage={onSendDM} onEditMessage={onEditDM} onDeleteMessage={onDeleteDM} currentUser={authUser} sidebarTrigger={sidebarTrigger} />;
    }
    if (selectedServer && sidebarProps.selectedChannel && authUser) {
        return <ChannelChat channel={sidebarProps.selectedChannel} server={selectedServer} currentUser={authUser} members={sidebarProps.members} messages={channelMessages} onSendMessage={onSendChannelMessage} onEditMessage={onEditChannelMessage} onDeleteMessage={onDeleteChannelMessage} sidebarTrigger={sidebarTrigger} />;
    }
    // Default to DM list if no chat/channel is selected
    return <MobileDMList chats={chats} onSelectChat={handleSelectChat} onAddUser={sidebarProps.onAddUser} />;
  };
  
  const renderSidebarContent = () => {
      if (selectedServer) {
           return (
            <MobileServerView
                server={selectedServer}
                channels={sidebarProps.channels}
                selectedChannel={sidebarProps.selectedChannel}
                members={sidebarProps.members}
                onSelectChannel={handleSelectChannel}
                onClose={() => setIsSidebarOpen(false)}
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
  }

  const renderMainContent = () => {
      if (activeView === 'home') {
          return (
             <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <div className="flex h-full">
                    <div className="hidden sm:flex">
                        <Servers
                            servers={servers}
                            loading={false}
                            onCreateServer={onCreateServer}
                            selectedServer={selectedServer}
                            onSelectServer={handleSelectServer}
                            onSelectChat={handleSelectChat}
                        />
                    </div>
                    <div className="flex-1">
                        {renderHomeContent()}
                    </div>
                </div>
                 <SheetContent side="left" className="p-0 w-[85vw] max-w-sm flex">
                    <Servers
                        servers={servers}
                        loading={false}
                        onCreateServer={onCreateServer}
                        selectedServer={selectedServer}
                        onSelectServer={handleSelectServer}
                        onSelectChat={handleSelectChat}
                    />
                    <div className="flex-1">
                        {renderSidebarContent()}
                    </div>
                </SheetContent>
            </Sheet>
          )
      }
      if (activeView === 'notifications') {
         return (
              <div className="flex-1 flex flex-col h-full">
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
