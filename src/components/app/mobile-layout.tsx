

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Home, Bell, User as UserIcon, Menu, AtSign } from 'lucide-react';
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
import { Button } from '../ui/button';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileProfilePage } from './mobile/mobile-profile-page';
import { MobileNotificationsPage } from './mobile/mobile-notifications-page';

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

type MainView = 'home' | 'notifications' | 'profile';

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
  
  const isChatOpen = !!selectedChat || !!sidebarProps.selectedChannel;

  useEffect(() => {
    // When navigating away from home or closing a chat, close the sidebar.
    if (activeView !== 'home' || !isChatOpen) {
      setIsSidebarOpen(false);
    }
  }, [activeView, isChatOpen]);


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
  }

  const handleBackFromChat = () => {
    onSelectChat(null);
    if(selectedServer) {
        // If we were in a server, deselect the channel
        sidebarProps.onSelectChannel(null as any);
    } else {
        // If we were in a DM, do nothing, the main view will show the DM list
    }
  }

  const onJumpToMessage = () => {} // Placeholder

  const renderHomeContent = () => {
    const sidebarTrigger = (
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
            <Menu />
        </Button>
      </SheetTrigger>
    );

    if (isChatOpen) {
       if (selectedChat && authUser) {
           return <Chat chat={selectedChat} messages={dmMessages} onSendMessage={onSendDM} onEditMessage={onEditDM} onDeleteMessage={onDeleteDM} currentUser={authUser} onBack={handleBackFromChat} />;
       }
       if (selectedServer && sidebarProps.selectedChannel && authUser) {
           return <ChannelChat channel={sidebarProps.selectedChannel} server={selectedServer} currentUser={authUser} members={sidebarProps.members} messages={channelMessages} onSendMessage={onSendChannelMessage} onEditMessage={onEditChannelMessage} onDeleteMessage={onDeleteChannelMessage} onBack={handleBackFromChat} />;
       }
    }
    
    // Default Home View (List view)
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
             <div className="flex-1">
                {selectedServer ? (
                    <MobileServerView
                        server={selectedServer}
                        channels={sidebarProps.channels}
                        selectedChannel={sidebarProps.selectedChannel}
                        members={sidebarProps.members}
                        onSelectChannel={handleSelectChannel}
                        onClose={() => setIsSidebarOpen(false)}
                        {...sidebarProps}
                    />
                ) : (
                    <MobileDMList 
                        chats={chats} 
                        onSelectChat={handleSelectChat}
                        onAddUser={sidebarProps.onAddUser}
                    />
                )}
            </div>
        </div>
    );
  };
  
  const renderMainContent = () => {
      if (activeView === 'home') {
          return renderHomeContent();
      }
      if (activeView === 'notifications') {
         return (
              <MobileNotificationsPage onJumpToMessage={onJumpToMessage}/>
          );
    }

    if (activeView === 'profile') {
        return <MobileProfilePage />;
    }
  }


  return (
    <div className="h-screen bg-background flex flex-col">
       <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <main className="flex-1 min-h-0">{renderMainContent()}</main>

            <SheetContent side="left" className="p-0 w-[85vw] max-w-sm flex">
                 <AnimatePresence>
                     {isSidebarOpen && (
                         <motion.div
                            key={selectedServer?.id || 'dms'}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex"
                          >
                            <Servers
                                servers={servers}
                                loading={false}
                                onCreateServer={onCreateServer}
                                selectedServer={selectedServer}
                                onSelectServer={handleSelectServer}
                                onSelectChat={handleSelectChat}
                            />
                            <div className="flex-1 border-l">
                                {selectedServer ? (
                                     <MobileServerView
                                        server={selectedServer}
                                        channels={sidebarProps.channels}
                                        selectedChannel={sidebarProps.selectedChannel}
                                        members={sidebarProps.members}
                                        onSelectChannel={handleSelectChannel}
                                        onClose={() => setIsSidebarOpen(false)}
                                        {...sidebarProps}
                                    />
                                ) : (
                                    <MobileDMList 
                                        chats={chats} 
                                        onSelectChat={handleSelectChat}
                                        onAddUser={sidebarProps.onAddUser}
                                    />
                                )}
                            </div>
                        </motion.div>
                     )}
                 </AnimatePresence>
            </SheetContent>
        </Sheet>

        <nav className="flex items-center justify-around p-2 border-t bg-secondary/30">
          <button
              onClick={() => setActiveView('home')}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'home' && 'text-primary'
              )}
          >
              <AtSign />
              <span className="text-xs">Mentions</span>
          </button>
          <button
              onClick={() => setActiveView('notifications')}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'notifications' && 'text-primary'
              )}
          >
              <Bell />
              <span className="text-xs">Notifications</span>
          </button>
          <button
              onClick={() => setActiveView('profile')}
              className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground w-1/3",
                  activeView === 'profile' && 'text-primary'
              )}
          >
              <UserIcon />
              <span className="text-xs">You</span>
          </button>
        </nav>
    </div>
  );
}
