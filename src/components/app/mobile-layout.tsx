
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Bell, User as UserIcon, MessageSquare, Cog } from 'lucide-react';
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

interface MobileLayoutProps {
    user: UserProfile;
    servers: Server[];
    chats: PopulatedChat[];
    selectedServer: Server | null;
    selectedChat: PopulatedChat | null;
    onSelectServer: (server: Server | null) => void;
    onSelectChat: (chat: PopulatedChat) => void;
    onCreateServer: (name: string) => Promise<void>;

    // Chat content props
    mainContent: React.ReactNode;
    
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

type Panel = 'servers' | 'main' | 'chat' | 'settings';

export function MobileLayout({
    user,
    servers,
    chats,
    selectedServer,
    selectedChat,
    onSelectServer,
    onSelectChat,
    onCreateServer,
    mainContent,
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
  const [activeTab, setActiveTab] = useState<'home' | 'notifications' | 'you'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (selectedChat || sidebarProps.selectedChannel) {
      setIsChatOpen(true);
    }
  }, [selectedChat, sidebarProps.selectedChannel]);
  
  const handleCloseChat = () => {
    setIsChatOpen(false);
    // Important: we deselect server/chat when closing the chat view to have a clean state
    onSelectServer(null); 
    onSelectChat(null);
  }

  const renderMainPanelContent = () => {
    if (activeTab === 'you') {
        return <MobileSettingsPage />;
    }
    
    if (activeTab === 'notifications') {
        return (
             <div className="p-4">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">Coming Soon!</p>
            </div>
        )
    }

    if (selectedServer) {
      return (
        <MobileServerView 
            server={selectedServer}
            channels={sidebarProps.channels}
            selectedChannel={sidebarProps.selectedChannel}
            onSelectChannel={sidebarProps.onSelectChannel}
            members={sidebarProps.members}
            onUpdateServer={sidebarProps.onUpdateServer}
            onDeleteServer={sidebarProps.onDeleteServer}
            onCreateChannel={sidebarProps.onCreateChannel}
            onUpdateChannel={sidebarProps.onUpdateChannel}
            onDeleteChannel={sidebarProps.onDeleteChannel}
        />
      );
    }
    
    // Default to DM list
    return (
        <MobileDMList 
            chats={chats}
            onSelectChat={onSelectChat}
            onAddUser={sidebarProps.onAddUser}
        />
    );
  };
  
  const renderChatContent = () => {
      if (!isChatOpen) return null;
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
      return null;
  }
  
  const handleTabSelect = (tab: 'home' | 'notifications' | 'you') => {
      setActiveTab(tab);
      setIsChatOpen(false); // Close any open chat when switching main tabs
      onSelectServer(null); // Deselect server
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
        <Servers 
            servers={servers}
            loading={false}
            onCreateServer={onCreateServer}
            selectedServer={selectedServer}
            onSelectServer={(server) => {
                onSelectServer(server);
                setActiveTab('home'); // Ensure home tab is active when a server is clicked
                if (server) { // If a server is selected, close any open DM chat
                   setIsChatOpen(false);
                }
            }}
            onSelectChat={onSelectChat}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 overflow-y-auto">
                {renderMainPanelContent()}
            </main>
            <footer className="flex items-center justify-around border-t bg-secondary/50 p-2">
                <button 
                  onClick={() => handleTabSelect('home')}
                  className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", activeTab === 'home' ? "text-primary" : "text-muted-foreground")}
                >
                  <MessageSquare className="size-6" />
                </button>
                <button 
                    onClick={() => handleTabSelect('notifications')}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", activeTab === 'notifications' ? "text-primary" : "text-muted-foreground")}
                >
                  <Bell className="size-6" />
                </button>
                <button 
                     onClick={() => handleTabSelect('you')}
                     className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", activeTab === 'you' ? "text-primary" : "text-muted-foreground")}
                >
                    <UserIcon className="size-6" />
                </button>
            </footer>
        </div>

        <AnimatePresence>
            {isChatOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute top-0 left-0 w-full h-full bg-background z-20"
                    onDoubleClick={handleCloseChat} // Easy close gesture
                >
                    {renderChatContent()}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
