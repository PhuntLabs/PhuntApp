
'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { ChannelChat } from '@/components/app/channel-chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { PopulatedChat, Server, Channel } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useChats } from '@/hooks/use-chats';
import { useServers } from '@/hooks/use-servers';
import { useServer } from '@/hooks/use-server';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { PendingRequests } from '@/components/app/pending-requests';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID, BOT_USERNAME } from '@/ai/bots/config';
import { Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServerSidebar } from '@/components/app/server-sidebar';
import { MemberList } from '@/components/app/member-list';


export default function Home() {
  const { user, authUser, loading, logout } = useAuth();
  const router = useRouter();
  const { chats, loading: chatsLoading, addChat, removeChat } = useChats();
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const { messages, sendMessage, editMessage, deleteMessage } = useChat(selectedChat?.id);
  const { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useFriendRequests();
  const { servers, setServers, loading: serversLoading, createServer } = useServers();
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const { server, members, loading: serverDetailsLoading, updateServer, deleteServer } = useServer(selectedServer?.id);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login');
    }
  }, [authUser, loading, router]);
  
  useEffect(() => {
    if (chatsLoading) return;

    if (selectedChat && !chats.find(c => c.id === selectedChat.id)) {
      setSelectedChat(null);
    }
    
    // If there is no selected chat or the selected chat is no longer in the list
    if ((!selectedChat || !chats.find(c => c.id === selectedChat.id)) && chats.length > 0 && !selectedServer) {
      // Find the most recent chat to select
      const mostRecentChat = chats.reduce((prev, current) => {
        const prevTime = (prev.lastMessageTimestamp as any)?.toMillis() || (prev.createdAt as any)?.toMillis() || 0;
        const currentTime = (current.lastMessageTimestamp as any)?.toMillis() || (current.createdAt as any)?.toMillis() || 0;
        return (prevTime > currentTime) ? prev : current;
      });
      setSelectedChat(mostRecentChat);
    } else if (chats.length === 0 && !selectedServer) {
        setSelectedChat(null);
    }
  }, [chats, selectedChat, chatsLoading, selectedServer]);

  // When servers load, select the first one by default if none is selected
  useEffect(() => {
    if (!serversLoading && servers.length > 0 && !selectedServer) {
        const sortedServers = [...servers].sort((a, b) => {
            const timeA = (a.createdAt as any)?.toMillis() || 0;
            const timeB = (b.createdAt as any)?.toMillis() || 0;
            return timeA - timeB; // oldest first
        });
        // This line is commented out to prevent auto-selecting a server on load.
        // User starts at Direct Messages.
        // setSelectedServer(sortedServers[0]); 
    }
    // If a server is selected but no longer exists (e.g., deleted), reset selection
    if (selectedServer && !servers.find(s => s.id === selectedServer.id)) {
        setSelectedServer(null); // Default back to Direct Messages
    }
  }, [servers, serversLoading, selectedServer]);


  const handleSendMessage = async (text: string) => {
    if (!authUser || !selectedChat) return;
    const sentMessage = await sendMessage(text, authUser.uid);

    // If talking to echo-bot, trigger the flow
    const echoBot = selectedChat.members.find(m => m.id === BOT_ID);
    if (echoBot && sentMessage) {
        // No await needed, let it run in the background
        processEcho({ chatId: selectedChat.id, message: { id: sentMessage.id, text, sender: authUser.uid }});
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
        removeChat(chatId); // Optimistically update the UI
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
            setSelectedServer(newServer);
            toast({ title: "Server Created!", description: `The server "${name}" has been created.`});
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Creating Server', description: e.message });
    }
  }

  const handleSelectServer = (server: Server | null) => {
    setSelectedServer(server);
    // When switching servers, clear the selected chat and channel
    setSelectedChat(null);
    setSelectedChannel(null);
  }

  const handleDeleteServer = async (serverId: string) => {
    try {
      await deleteServer(serverId);
      toast({ title: "Server Deleted" });
      setSelectedServer(null); // Go back to DMs
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Deleting Server', description: e.message });
    }
  }

  const handleUpdateServer = async (serverId: string, name: string, photoURL: string) => {
    try {
      await updateServer(serverId, { name, photoURL });
      toast({ title: "Server Updated" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error Updating Server', description: e.message });
    }
  }


  if (loading || !authUser || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen bg-background/70">
            <Servers 
                servers={servers}
                loading={serversLoading} 
                onCreateServer={handleCreateServer} 
                selectedServer={selectedServer}
                onSelectServer={handleSelectServer}
            />
          
          <div className="flex flex-1 min-w-0">
             <div className="w-64 flex-shrink-0 bg-secondary/30 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                 {server ? (
                    <ServerSidebar 
                        server={server}
                        selectedChannel={selectedChannel}
                        onSelectChannel={setSelectedChannel}
                        onUpdateServer={handleUpdateServer}
                        onDeleteServer={handleDeleteServer}
                    />
                 ) : (
                    <>
                        <SidebarHeader className="p-4 border-b">
                            <h2 className="font-semibold text-lg">Direct Messages</h2>
                        </SidebarHeader>
                        <SidebarContent className="py-2">
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
                            onSelectChat={setSelectedChat}
                            onAddUser={handleSendFriendRequest}
                            onAddBot={handleCreateChatWithBot}
                            onDeleteChat={handleDeleteChat}
                            loading={chatsLoading}
                        />
                        </SidebarContent>
                    </>
                 )}
                 </div>
                 <SidebarFooter className="bg-background/50 p-2">
                    <div className="flex items-center justify-between">
                        <UserNav user={user} logout={logout}/>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Mic className="size-4"/></Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Settings className="size-4"/></Button>
                        </div>
                    </div>
                </SidebarFooter>
             </div>

            <main className="flex-1 flex flex-col bg-background/50 min-w-0">
              {server && selectedChannel ? (
                <ChannelChat channel={selectedChannel} server={server} />
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
  );
}
