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
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { PendingRequests } from '@/components/app/pending-requests';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID, BOT_USERNAME } from '@/ai/bots/config';

export default function Home() {
  const { user, authUser, loading, logout } = useAuth();
  const router = useRouter();
  const { chats, loading: chatsLoading, addChat } = useChats();
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const { messages, sendMessage, editMessage, deleteMessage } = useChat(selectedChat?.id);
  const { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useFriendRequests();
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
    } catch (e: any) {
        if (e.message.includes('already sent a request')) {
             // If request is already sent, maybe we just need to accept it.
            // Or maybe the chat already exists.
            toast({ title: "Already friends", description: "You already have a chat with echo-bot."})
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

        // Check if chat already exists
        const q = query(collection(db, 'chats'), where('members', 'array-contains', authUser.uid));
        const querySnapshot = await getDocs(q);
        const existingChat = querySnapshot.docs.find(doc => doc.data().members.includes(fromUser.id));

        if (!existingChat) {
            // Create a new chat
            const chatRef = await addDoc(collection(db, 'chats'), {
                members: [authUser.uid, fromUser.id],
                createdAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp()
            });
            // The useChats hook will automatically pick up the new chat
        }

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
        // The useChats hook will automatically remove the chat from the state
        if (selectedChat?.id === chatId) {
            setSelectedChat(null);
        }
        toast({title: 'Chat Removed'});
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
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
          <Servers />
        </SidebarContent>
        <SidebarFooter>
          <UserNav user={user} logout={logout}/>
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
          <p>Select a chat to start messaging.</p>
        </div>
      )}
    </SidebarProvider>
  );
}
