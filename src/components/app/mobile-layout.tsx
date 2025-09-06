
'use client';

import { useState } from 'react';
import { Home, AtSign, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DirectMessages } from './direct-messages';
import type { PopulatedChat, Server, UserProfile } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Servers } from './servers';
import { ScrollArea } from '../ui/scroll-area';
import { AddUserDialog } from './add-user-dialog';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { MentionsDialog } from './mentions-dialog';
import { SettingsDialog } from './settings-dialog';


interface MobileLayoutProps {
  user: UserProfile;
  servers: Server[];
  chats: PopulatedChat[];
  selectedServer: Server | null;
  selectedChat: PopulatedChat | null;
  onSelectServer: (server: Server | null) => void;
  onSelectChat: (chat: PopulatedChat) => void;
  onCreateServer: (name: string) => Promise<void>;
  onJumpToMessage: (context: any) => void;
  mainContent: React.ReactNode;
}

type ActiveTab = 'home' | 'mentions' | 'you';

export function MobileLayout({
    user,
    servers,
    chats,
    selectedServer,
    selectedChat,
    onSelectServer,
    onSelectChat,
    onCreateServer,
    onJumpToMessage,
    mainContent,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  const renderContent = () => {
    switch(activeTab) {
        case 'home':
            return (
                <div className="flex h-full">
                     <Servers 
                        servers={servers}
                        loading={false} 
                        onCreateServer={onCreateServer} 
                        selectedServer={selectedServer}
                        onSelectServer={onSelectServer}
                        onSelectChat={onSelectChat}
                    />
                    <div className="flex-1">
                        {mainContent}
                    </div>
                </div>
            );
        case 'mentions':
            return (
                 <div className="h-full bg-background p-4">
                    <h1 className="text-2xl font-bold mb-4">Mentions</h1>
                    <MentionsDialog onJumpToMessage={onJumpToMessage}>
                        <div className="h-full">
                            {/* This is a simplified view. The MentionsDialog hook handles fetching */}
                           <p className="text-muted-foreground">Your recent mentions will appear here.</p>
                        </div>
                    </MentionsDialog>
                 </div>
            )
        case 'you':
            return (
                 <div className="h-full bg-background p-4">
                     <SettingsDialog defaultSection="account">
                        <div className="h-full">
                           <h1 className="text-2xl font-bold mb-4">Settings</h1>
                           <p className="text-muted-foreground">Manage your account, profile, and app settings.</p>
                        </div>
                    </SettingsDialog>
                 </div>
            )
        default:
            return mainContent;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      
      <footer className="flex items-center justify-around border-t bg-secondary/50 p-2">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground", activeTab === 'home' && "text-primary")}
        >
          <Home className="size-6" />
          <span className="text-xs">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('mentions')}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground", activeTab === 'mentions' && "text-primary")}
        >
          <AtSign className="size-6" />
          <span className="text-xs">Mentions</span>
        </button>
        <SettingsDialog defaultSection="account">
             <button className={cn("flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground")}>
                <UserIcon className="size-6" />
                <span className="text-xs">You</span>
            </button>
        </SettingsDialog>
      </footer>
    </div>
  );
}

