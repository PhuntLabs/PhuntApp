
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { ChannelChat } from '@/components/app/channel-chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { PopulatedChat, Server, Channel, ChannelType, Message, UserProfile } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useChats } from '@/hooks/use-chats';
import { useServers } from '@/hooks/use-servers';
import { useServer } from '@/hooks/use-server';
import { useChannels } from '@/hooks/use-channels';
import { useChannelMessages } from '@/hooks/use-channel-messages';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID, BOT_USERNAME } from '@/ai/bots/config';
import { Loader2, Mic, Settings, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerSidebar } from '@/components/app/server-sidebar';
import { MemberList } from '@/components/app/member-list';
import { SettingsDialog } from '@/components/app/settings-dialog';
import { UpdateLog } from '@/components/app/update-log';
import { useMobileView } from '@/hooks/use-mobile-view';
import { MobileLayout } from '@/components/app/mobile-layout';
import { ErrorBoundary } from '@/components/app/error-boundary';
import { useCallingStore } from '@/hooks/use-calling-store';
import { IncomingCallNotification } from '@/components/app/incoming-call-notification';
import { ActiveNowList } from '@/components/app/active-now-list';


export default function AppRootPage() {
  const { user, authUser, loading, logout } = useAuth();
  const router = useRouter();
  const { isMobileView } = useMobileView();
  
  // Only initialize hooks if auth has loaded and user exists
  const authReady = !loading && !!authUser;
  const { chats, loading: chatsLoading, addChat, removeChat } = useChats(authReady);
  const { servers, setServers, loading: serversLoading, createServer } = useServers(authReady);
  const { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useFriendRequests(authReady);
  const { activeCall, incomingCall, listenForIncomingCalls, stopListeningForIncomingCalls, initCall, acceptCall, declineCall, agoraClient } = useCallingStore();


  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const { messages, sendMessage, editMessage, deleteMessage } = useChat(selectedChat);
  const { server, setServer, members, loading: serverDetailsLoading, updateServer, deleteServer } = useServer(selectedServer?.id);
  const { channels, createChannel, updateChannel, deleteChannel } = useChannels(selectedServer?.id);
  const { 
    messages: channelMessages, 
    sendMessage: sendChannelMessage,
    editMessage: editChannelMessage,
    deleteMessage: deleteChannelMessage,
  } = useChannelMessages(selectedServer, selectedChannel?.id);


  const { toast } = useToast();

  const handleSelectChat = (chat: PopulatedChat | null) => {
    setSelectedServer(null); // Make sure no server is selected when a DM is chosen
    setSelectedChannel(null);
    setSelectedChat(chat);
    // When a user selects a chat, clear their unread count for it.
    if (user && chat && chat.unreadCount?.[user.uid] > 0) {
      const chatRef = doc(db, 'chats', chat.id);
      updateDoc(chatRef, { [`unreadCount.${user.uid}`]: 0 });
    }
  };

  const getMostRecentUnreadChat = useMemo(() => {
    if (!user) return null;
    const unreadChats = chats.filter(c => (c.unreadCount?.[user.uid] || 0) > 0);
    if (unreadChats.length === 0) return null;

    return unreadChats.reduce((prev, current) => {
      const prevTime = (prev.lastMessageTimestamp as any)?.toMillis() || 0;
      const currentTime = (current.lastMessageTimestamp as any)?.toMillis() || 0;
      return (prevTime > currentTime) ? prev : current;
    });
  }, [chats, user]);


  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login');
    }
  }, [authUser, loading, router]);
  
   useEffect(() => {
    if (user?.uid && user.callingEnabled) {
      listenForIncomingCalls(user.uid);
    } else {
      stopListeningForIncomingCalls();
    }
    return () => {
      stopListeningForIncomingCalls();
    };
  }, [user, listenForIncomingCalls, stopListeningForIncomingCalls]);

  useEffect(() => {
    if (chatsLoading) return;

    if (selectedChat && !chats.find(c => c.id === selectedChat.id)) {
      setSelectedChat(null);
    }
    
    if (initialLoad && (!selectedChat || !chats.find(c => c.id === selectedChat.id)) && chats.length > 0 && !selectedServer) {
        if (!isMobileView) {
            handleSelectChat(chats[0]);
        }
    } else if (chats.length === 0 && !selectedServer && !isMobileView) {
        setSelectedChat(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, selectedChat, chatsLoading, selectedServer, initialLoad]);

  useEffect(() => {
    // This effect handles the very first load of the app
    if (serversLoading || !authReady || !initialLoad) return;
    
    if (servers.length > 0 && !selectedServer && chats.length === 0 && !isMobileView) {
      handleSelectServer(servers[0]);
    }
    setInitialLoad(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, serversLoading, authReady, initialLoad, chats]);


  const handleSendMessage = async (text: string, file?: File, replyTo?: Message['replyTo']) => {
    if (!authUser || !selectedChat) return;
    const sentMessage = await sendMessage(text, file, replyTo);

    if (sentMessage && !file) { // Don't echo images for now
        const echoBot = selectedChat.members.find(m => m.id === BOT_ID);
        if (echoBot) {
            processEcho({ chatId: selectedChat.id, message: { id: sentMessage.id, text, sender: authUser.uid }});
        }
    }
  };
  
  const handleSendFriendRequest = async (username: string) => {
    if (!user) return;
    try {
        const result = await sendFriendRequest(username, {
            id: user.uid,
            displayName: user.username || 'Anonymous'
        });
        toast({ title: 'Success', description: result });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const handleCreateServer = async (name: string) => {
    try {
        const newServer = await createServer(name);
        if (newServer) {
            setServers(prev => [...prev, newServer]);
            handleSelectServer(newServer);
            toast({ title: "Server Created!", description: `The server "${name}" has been created.`});
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Creating Server', description: e.message });
    }
  }

  function handleSelectServer(server: Server | null) {
    if (server === null && !selectedServer) {
      // If we are already in DMs, and we click DM root, do nothing.
      return;
    }
    
    if (server === null) {
      // If navigating to DMs from a server
      if (chats.length > 0) {
        handleSelectChat(chats[0]);
      }
    }
    setSelectedServer(server);
    setSelectedChat(null); // Deselect chat when switching server context
    if (server && channels?.[0]) {
        handleSelectChannel(channels[0]);
    } else {
        setSelectedChannel(null);
    }
  }
  
  const handleSelectChannel = async (channel: Channel) => {
    setSelectedChannel(channel);
  }

  const handleUpdateServer = async (serverId: string, data: Partial<Omit<Server, 'id'>>) => {
    try {
      await updateServer(serverId, data);
      toast({ title: "Server Updated" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Updating Server', description: e.message });
    }
  }

  const handleCreateChannel = async (name: string, type: ChannelType) => {
    try {
      const newChannel = await createChannel(name, type);
      if (newChannel) {
        // Local state update can be removed if using snapshots effectively
        toast({ title: `#${newChannel.name} created!` });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Creating Channel', description: e.message });
    }
  }
  
  const handleUpdateChannel = async (channelId: string, data: { name?: string, type?: ChannelType, topic?: string}) => {
    try {
      await updateChannel(channelId, data);
      toast({ title: "Channel Updated" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Updating Channel', description: e.message });
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await deleteChannel(channelId);
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(channels?.[0] || null);
      }
      toast({ title: "Channel Deleted" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Deleting Channel', description: e.message });
    }
  }

  const allFriends = useMemo(() => chats
    .map(chat => chat.members.find(m => m.id !== user?.uid))
    .filter((member): member is UserProfile => !!member), [chats, user]);


  if (loading || chatsLoading || serversLoading || !authUser || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <UpdateLog />
        {incomingCall && <IncomingCallNotification />}
        {isMobileView ? (
            <MobileLayout 
                user={user}
                servers={servers}
                chats={chats}
                selectedServer={selectedServer}
                selectedChat={selectedChat}
                onSelectServer={handleSelectServer}
                onSelectChat={handleSelectChat}
                onCreateServer={handleCreateServer}
                // Pass down all props needed by sub-components
                channels={channels}
                members={members}
                selectedChannel={selectedChannel}
                onSelectChannel={handleSelectChannel}
                onCreateChannel={handleCreateChannel}
                onUpdateChannel={handleUpdateChannel}
                onDeleteChannel={handleDeleteChannel}
                onUpdateServer={handleUpdateServer}
                onDeleteServer={deleteServer}
                onAddUser={handleSendFriendRequest}
                onAddBot={() => {}}
                onDeleteChat={() => {}}
                // Message props
                dmMessages={messages}
                onSendDM={handleSendMessage}
                onEditDM={editMessage}
                onDeleteDM={deleteMessage}
                channelMessages={channelMessages}
                onSendChannelMessage={sendChannelMessage}
                onEditChannelMessage={editChannelMessage}
                onDeleteChannelMessage={deleteChannelMessage}
            />
        ) : (
            <div className="flex h-screen bg-secondary/30 text-sm">
                <Servers 
                    servers={servers}
                    loading={serversLoading} 
                    onCreateServer={handleCreateServer} 
                    selectedServer={selectedServer}
                    onSelectServer={handleSelectServer}
                    onSelectChat={handleSelectChat}
                />
                
                 <div className="w-64 flex-shrink-0 bg-card flex flex-col">
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {server ? (
                        <ServerSidebar 
                            server={server}
                            channels={channels}
                            members={members as UserProfile[]}
                            selectedChannel={selectedChannel}
                            onSelectChannel={handleSelectChannel}
                            onCreateChannel={handleCreateChannel}
                            onUpdateChannel={handleUpdateChannel}
                            onDeleteChannel={handleDeleteChannel}
                            onUpdateServer={handleUpdateServer}
                            onDeleteServer={deleteServer}
                        />
                        ) : (
                        <DirectMessages
                            directMessages={chats}
                            selectedChat={selectedChat}
                            onSelectChat={handleSelectChat}
                            onAddUser={handleSendFriendRequest}
                            loading={chatsLoading}
                        />
                        )}
                    </div>
                     <div className="p-2 bg-secondary/50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <UserNav user={user} />
                            <div className="flex items-center">
                                <SettingsDialog>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Settings className="size-5" />
                                    </Button>
                                </SettingsDialog>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div className="flex-1 flex flex-col bg-background min-w-0">
                    {server && selectedChannel && authUser ? (
                     <div className="flex flex-1 min-h-0">
                        <main className="flex-1 flex flex-col min-w-0">
                            <ChannelChat 
                                channel={selectedChannel} 
                                server={server} 
                                currentUser={authUser}
                                members={members}
                                messages={channelMessages}
                                onSendMessage={sendChannelMessage}
                                onEditMessage={editChannelMessage}
                                onDeleteMessage={deleteChannelMessage}
                            />
                        </main>
                        <MemberList members={members as UserProfile[]} server={server} loading={serverDetailsLoading} />
                     </div>
                    ) : server ? (
                    <div className="flex flex-1 items-center justify-center h-full">
                        <div className="text-center">
                            <h2 className="text-xl font-medium text-foreground">{`Welcome to ${server.name}`}</h2>
                            <p className="text-muted-foreground">Select a channel to start talking.</p>
                        </div>
                    </div>
                    ) : selectedChat && user ? (
                    <Chat
                        chat={selectedChat}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onEditMessage={editMessage}
                        onDeleteMessage={deleteMessage}
                        currentUser={authUser}
                        onInitiateCall={(callee) => initCall(user, callee, selectedChat.id)}
                    />
                    ) : (
                        <ActiveNowList 
                            users={allFriends}
                            pendingRequests={incomingRequests}
                            onAcceptFriendRequest={acceptFriendRequest}
                            onDeclineFriendRequest={declineFriendRequest}
                        />
                    )}
                 </div>
            </div>
        )}
      </SidebarProvider>
    </ErrorBoundary>
  );
}



    