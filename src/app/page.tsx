

'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
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
import { PendingRequests } from '@/components/app/pending-requests';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID, BOT_USERNAME } from '@/ai/bots/config';
import { AtSign, Mic, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerSidebar } from '@/components/app/server-sidebar';
import { MemberList } from '@/components/app/member-list';
import { SettingsDialog } from '@/components/app/settings-dialog';
import { UpdateLog } from '@/components/app/update-log';
import { MentionsDialog } from '@/components/app/mentions-dialog';
import { useMobileView } from '@/hooks/use-mobile-view';
import { MobileLayout } from '@/components/app/mobile-layout';
import { ErrorBoundary } from '@/components/app/error-boundary';
import { useCallingStore } from '@/hooks/use-calling-store';
import { IncomingCallNotification } from '@/components/app/incoming-call-notification';
import Image from 'next/image';


const ActiveCallView = dynamic(() => import('@/components/app/active-call-view').then(mod => mod.ActiveCallView), {
  ssr: false,
});


export default function Home() {
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
            const mostRecentChat = chats.reduce((prev, current) => {
                const prevTime = (prev.lastMessageTimestamp as any)?.toMillis() || (prev.createdAt as any)?.toMillis() || 0;
                const currentTime = (current.lastMessageTimestamp as any)?.toMillis() || (current.createdAt as any)?.toMillis() || 0;
                return (prevTime > currentTime) ? prev : current;
            });
            handleSelectChat(mostRecentChat);
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
            displayName: user.displayName || 'Anonymous'
        });
        toast({ title: 'Success', description: result });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const handleCreateChatWithBot = async () => {
    if (!user) return;

    try {
        await handleSendFriendRequest(BOT_USERNAME);
        toast({ title: "Friend Request Sent", description: `A request was sent to ${BOT_USERNAME}. It will accept automatically.`});

    } catch (e: any) {
        if (e.message.includes('already friends') || e.message.includes('already pending')) {
             toast({ title: "You are already friends!", description: `You can already chat with ${BOT_USERNAME}.`})
        } else {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    }
  };

  const handleAcceptFriendRequest = async (requestId: string, fromUser: { id: string, displayName: string }) => {
     if (!authUser) return;
    try {
        await acceptFriendRequest(requestId, fromUser);
        toast({ title: 'Friend Added!', description: `You and ${fromUser.displayName} are now friends.` });

    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
        await declineFriendRequest(requestId);
        toast({ title: 'Request Declined' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
        await deleteDoc(doc(db, 'chats', chatId));
        removeChat(chatId); 
        if (selectedChat?.id === chatId) {
            setSelectedChat(null);
        }
        toast({title: 'Chat Removed'});
    } catch (e: any) {
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
      const mostRecentUnread = getMostRecentUnreadChat;
      if (mostRecentUnread) {
        handleSelectChat(mostRecentUnread);
      } else if (chats.length > 0) {
        // Select the most recent chat if none are unread
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

  const handleDeleteServer = async (serverId: string) => {
    try {
      await deleteServer(serverId);
      toast({ title: "Server Deleted" });
      handleSelectServer(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Deleting Server', description: e.message });
    }
  }

  const handleUpdateServer = async (serverId: string, data: Partial<Omit<Server, 'id'>>) => {
    try {
      await updateServer(serverId, data);
      toast({ title: "Server Updated" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Updating Server', description: e.message });
    }
  }

  const handleCreateChannel = async (name: string) => {
    try {
      const newChannel = await createChannel(name);
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

  const handleJumpToMessage = (context: { type: 'dm', chatId: string } | { type: 'channel', serverId: string, channelId: string }) => {
    if (context.type === 'dm') {
      const chat = chats.find(c => c.id === context.chatId);
      if (chat) {
        handleSelectServer(null);
        handleSelectChat(chat);
      }
    } else {
      const serverToSelect = servers.find(s => s.id === context.serverId);
      if (serverToSelect) {
        handleSelectServer(serverToSelect);
        // The channel data will be on the server object after the state updates
        // We select it in an effect to ensure data consistency
        const channelToSelect = serverToSelect.channels?.find(c => c.id === context.channelId);
        if (channelToSelect) {
            setSelectedChannel(channelToSelect);
        }
      }
    }
  };


  if (loading || !authUser || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Image src="https://www.cdn.buymeacoffee.com/uploads/project_id_196593/63d59e63-53e3-40e1-96e0-3947b19a16f2.png" alt="Phunt Logo" width={128} height={128} />
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleAcceptCall = async (call: any) => {
      if (!user) return;
      await acceptCall(call, user);
  }

  return (
    <ErrorBoundary>
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
                onDeleteServer={handleDeleteServer}
                onAddUser={handleSendFriendRequest}
                onAddBot={handleCreateChatWithBot}
                onDeleteChat={handleDeleteChat}
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
            <SidebarProvider>
            
            <div className="flex h-screen bg-background/70">
                <Servers 
                servers={servers}
                loading={serversLoading} 
                onCreateServer={handleCreateServer} 
                selectedServer={selectedServer}
                onSelectServer={handleSelectServer}
                onSelectChat={handleSelectChat}
                />
                
                <div className="flex flex-1 min-w-0">
                <div className="w-64 flex-shrink-0 bg-secondary/30 flex flex-col hidden md:flex">
                    <div className="flex-1 overflow-y-auto">
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
                            onDeleteServer={handleDeleteServer}
                        />
                        ) : (
                        <>
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="font-semibold text-lg truncate">Direct Messages</h2>
                                <div className="flex items-center">
                                    <MentionsDialog onJumpToMessage={handleJumpToMessage}>
                                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground"><AtSign className="size-4"/></Button>
                                    </MentionsDialog>
                                    <SidebarTrigger />
                                </div>
                            </div>
                            <div className="py-2">
                            {incomingRequests.length > 0 && (
                                <PendingRequests
                                requests={incomingRequests}
                                onAccept={handleAcceptFriendRequest}
                                onDecline={handleDeclineFriendRequest}
                                />
                            )}
                            <DirectMessages
                                directMessages={chats}
                                selectedChat={selectedChat}
                                onSelectChat={handleSelectChat}
                                onAddUser={handleSendFriendRequest}
                                onAddBot={handleCreateChatWithBot}
                                onDeleteChat={handleDeleteChat}
                                loading={chatsLoading}
                            />
                            </div>
                        </>
                        )}
                    </div>
                    {activeCall && agoraClient ? (
                        <ActiveCallView client={agoraClient} />
                    ) : (
                    <div className="bg-background/50 p-2 border-t border-border">
                        <div className="flex items-center justify-between">
                        <UserNav user={user} logout={logout}/>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Mic className="size-4"/></Button>
                            <SettingsDialog>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Settings className="size-4"/></Button>
                            </SettingsDialog>
                        </div>
                        </div>
                    </div>
                    )}
                </div>
                
                <main className="flex-1 flex flex-col bg-background/50 min-w-0" style={{ width: 'calc(100vw - 36rem)' }}>
                    {server && selectedChannel && authUser ? (
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
                    ) : server ? (
                    <div className="flex flex-1 items-center justify-center h-full bg-muted/20">
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
                    <div className="flex flex-1 items-center justify-center h-full bg-muted/20">
                        <div className="text-center">
                        <h2 className="text-xl font-medium text-foreground">No Chat Selected</h2>
                        <p className="text-muted-foreground">Select a conversation from the sidebar or add a friend to start chatting.</p>
                        </div>
                    </div>
                    )}
                </main>

                {server && members.length > 0 && (
                    <MemberList server={server} members={members} loading={serverDetailsLoading} />
                )}
                </div>
            </div>
            </SidebarProvider>
        )}
    </ErrorBoundary>
  );
}
