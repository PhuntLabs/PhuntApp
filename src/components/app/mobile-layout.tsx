
'use client';

import { useState, useEffect } from 'react';
import { Home, AtSign, User as UserIcon, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DirectMessages } from './direct-messages';
import type { PopulatedChat, Server, UserProfile, Channel } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Servers } from './servers';
import { ScrollArea } from '../ui/scroll-area';
import { ServerSidebar } from './server-sidebar';
import { SettingsDialog } from './settings-dialog';
import { AccountSettings } from './settings/account-settings';
import { Button } from '../ui/button';

interface MobileLayoutProps {
    user: UserProfile;
    servers: Server[];
    chats: PopulatedChat[];
    selectedServer: Server | null;
    selectedChat: PopulatedChat | null;
    onSelectServer: (server: Server | null) => void;
    onSelectChat: (chat: PopulatedChat) => void;
    onCreateServer: (name: string) => Promise<void>;
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
}

type View = 'chat' | 'sidebar' | 'settings';

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
    ...sidebarProps
}: MobileLayoutProps) {
  const [viewStack, setViewStack] = useState<View[]>(['sidebar']);
  const activeView = viewStack[viewStack.length - 1];

  const navigateTo = (view: View) => {
    setViewStack(prev => [...prev, view]);
  }
  
  const goBack = () => {
    setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }

  useEffect(() => {
    // When the user selects a chat or channel, switch back to the chat view
    if (selectedChat || sidebarProps.selectedChannel) {
        setViewStack(['chat']);
    }
  }, [selectedChat, sidebarProps.selectedChannel]);


  const renderMainContent = () => {
     switch(activeView) {
        case 'sidebar':
            return (
                <div className="h-full flex">
                    <Servers 
                        servers={servers}
                        loading={false} 
                        onCreateServer={onCreateServer} 
                        selectedServer={selectedServer}
                        onSelectServer={onSelectServer}
                        onSelectChat={onSelectChat}
                    />
                     <div className="flex-1 overflow-y-auto bg-secondary/30">
                        {selectedServer ? (
                             <ServerSidebar 
                                server={selectedServer}
                                channels={sidebarProps.channels}
                                members={sidebarProps.members}
                                selectedChannel={sidebarProps.selectedChannel}
                                onSelectChannel={sidebarProps.onSelectChannel}
                                onCreateChannel={sidebarProps.onCreateChannel}
                                onUpdateChannel={sidebarProps.onUpdateChannel}
                                onDeleteChannel={sidebarProps.onDeleteChannel}
                                onUpdateServer={sidebarProps.onUpdateServer}
                                onDeleteServer={sidebarProps.onDeleteServer}
                            />
                        ) : (
                             <div className="p-2">
                                <DirectMessages
                                    directMessages={chats}
                                    selectedChat={selectedChat}
                                    onSelectChat={onSelectChat}
                                    onAddUser={sidebarProps.onAddUser}
                                    onAddBot={sidebarProps.onAddBot}
                                    onDeleteChat={sidebarProps.onDeleteChat}
                                    loading={false}
                                />
                             </div>
                        )}
                     </div>
                </div>
            );
        case 'settings':
            return (
                 <div className="h-full bg-background p-4 overflow-y-auto">
                    <Button variant="ghost" className="mb-4" onClick={goBack}>
                        <ChevronLeft /> Back
                    </Button>
                    <AccountSettings />
                 </div>
            )
        case 'chat':
        default:
            return mainContent;
    }
  }

  const handleTabClick = (view: View) => {
    if (activeView === view) {
        // If current view is already the tab, go to its root
        if (view === 'sidebar') setViewStack(['sidebar']);
    } else {
        setViewStack([view]);
    }
  }


  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        {renderMainContent()}
      </main>
      
      <footer className="flex items-center justify-around border-t bg-secondary/50 p-2">
        <button 
          onClick={() => handleTabClick('sidebar')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground", activeView === 'sidebar' && "text-primary")}
        >
          <Home className="size-6" />
          <span className="text-xs">Home</span>
        </button>
        <button 
            disabled 
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground/50"
        >
          <AtSign className="size-6" />
          <span className="text-xs">Mentions</span>
        </button>
        <button 
             onClick={() => handleTabClick('settings')}
             className={cn("flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground", activeView === 'settings' && "text-primary")}
        >
            <UserIcon className="size-6" />
            <span className="text-xs">You</span>
        </button>
      </footer>
    </div>
  );
}
