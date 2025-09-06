
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
  const [mainView, setMainView] = useState<MainView>(selectedServer ? 'server' : 'dms');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { incomingRequests, acceptFriendRequest, declineFriendRequest } = useFriendRequests(true);
  const { toast } = useToast();

  const handleSelectChat = (chat: PopulatedChat) => {
    onSelectChat(chat);
    setIsSidebarOpen(false);
  }

  const handleSelectChannel = (channel: Channel) => {
    sidebarProps.onSelectChannel(channel);
    setIsSidebarOpen(false);
  }
  
  const handleSelectServer = (server: Server | null) => {
    onSelectServer(server);
    setMainView(server ? 'server' : 'dms');
  }
  
  const handleAccept = async (requestId: string, fromUser: { id: string, displayName: string }) => {
     try {
        await acceptFriendRequest(requestId, fromUser);
        toast({ title: 'Friend Added!', description: `You and ${fromUser.displayName} are now friends.` });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const handleDecline = async (requestId: string) => {
    try {
        await declineFriendRequest(requestId);
        toast({ title: 'Request Declined' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }


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
      return (
        <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="text-center">
                <h2 className="text-xl font-semibold">No Chat Selected</h2>
                <p className="text-muted-foreground">Select a channel or DM to start talking.</p>
            </div>
        </div>
      );
  }
  
  const renderSidebarContent = () => {
    switch (mainView) {
        case 'dms':
            return (
                <div className="p-2">
                     {incomingRequests.length > 0 && (
                        <PendingRequests
                            requests={incomingRequests}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    )}
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
            );
        case 'server':
             if (selectedServer) {
                return <ServerSidebar 
                    server={selectedServer}
                    channels={sidebarProps.channels}
                    selectedChannel={sidebarProps.selectedChannel}
                    members={sidebarProps.members}
                    onSelectChannel={handleSelectChannel}
                    {...sidebarProps}
                />;
             }
             return null;
        case 'notifications':
             return (
                <div className="p-4">
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground">Coming Soon!</p>
                </div>
            );
        case 'settings':
            return <MobileSettingsPage />;
        default:
            return null;
    }
  };
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="flex gap-0 p-0 w-[calc(100vw-3.5rem)]">
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
                        {renderSidebarContent()}
                    </main>
                    <footer className="flex items-center justify-around border-t bg-background/50 p-2">
                        <button 
                          onClick={() => setMainView(selectedServer ? 'server' : 'dms')}
                          className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", (mainView === 'dms' || mainView === 'server') ? "text-primary" : "text-muted-foreground")}
                        >
                          <MessageSquare className="size-6" />
                        </button>
                        <button 
                            onClick={() => setMainView('notifications')}
                            className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", mainView === 'notifications' ? "text-primary" : "text-muted-foreground")}
                        >
                          <Bell className="size-6" />
                        </button>
                        <button 
                             onClick={() => setMainView('settings')}
                             className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", mainView === 'settings' ? "text-primary" : "text-muted-foreground")}
                        >
                            <UserIcon className="size-6" />
                        </button>
                    </footer>
                </div>
            </SheetContent>
        </Sheet>
        
        <main className="flex-1 flex flex-col min-w-0 relative">
            <header className="absolute top-0 left-0 p-2">
                 <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                    <Menu />
                 </Button>
            </header>
            {renderChatContent()}
        </main>
    </div>
  );
}
