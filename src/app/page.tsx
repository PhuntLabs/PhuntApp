'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { PopulatedChat } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useChats } from '@/hooks/use-chats';
import { useServers } from '@/hooks/use-servers';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { PendingRequests } from '@/components/app/pending-requests';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID, BOT_USERNAME } from '@/ai/bots/config';
import { Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, authUser, loading, logout } = useAuth();
  const router = useRouter();
  const { chats, loading: chatsLoading, addChat, removeChat } = useChats();
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const { messages, sendMessage, editMessage, deleteMessage } = useChat(selectedChat?.id);
  const { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useFriendRequests();
  const { servers, loading: serversLoading, createServer } = useServers();
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
    if ((!selectedChat || !chats.find(c => c.id === selectedChat.id)) && chats.length > 0) {
      // Find the most recent chat to select
      const mostRecentChat = chats.reduce((prev, current) => {
        const prevTime = (prev.lastMessageTimestamp as any)?.toMillis() || (prev.createdAt as any)?.toMillis() || 0;
        const currentTime = (current.lastMessageTimestamp as any)?.toMillis() || (current.createdAt as any)?.toMillis() || 0;
        return (prevTime > currentTime) ? prev : current;
      });
      setSelectedChat(mostRecentChat);
    } else if (chats.length === 0) {
        setSelectedChat(null);
    }
  }, [chats, selectedChat, chatsLoading]);


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
        await createServer(name);
        toast({ title: "Server Created!", description: `The server "${name}" has been created.`});
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error Creating Server', description: e.message });
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
      <Sidebar>
        <SidebarHeader>
           {/* Maybe a search bar or something can go here */}
        </SidebarHeader>
        <SidebarContent>
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
          <Servers servers={servers} loading={serversLoading} onCreateServer={handleCreateServer} />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between">
              <UserNav user={user} logout={logout}/>
              <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Mic className="size-4"/></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Settings className="size-4"/></Button>
              </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      {selectedChat && user ? (
        <Chat
          chat={selectedChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          currentUser={authUser}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center h-screen bg-muted/20">
          <div className="text-center">
            <h2 className="text-xl font-medium text-foreground">No Chat Selected</h2>
            <p className="text-muted-foreground">Select a conversation from the sidebar or add a friend to start chatting.</p>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
