'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { PopulatedChat, ChatDocument } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useChats } from '@/hooks/use-chats';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { PendingRequests } from '@/components/app/pending-requests';
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { processEcho } from '@/ai/flows/echo-bot-flow';
import { BOT_ID } from '@/ai/bots/config';

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
    // If there is no selected chat or the selected chat is no longer in the list
    if ((!selectedChat || !chats.find(c => c.id === selectedChat.id)) && chats.length > 0) {
      // Find the most recent chat to select
      const mostRecentChat = chats.reduce((prev, current) => {
        const prevTime = (prev.lastMessageTimestamp as any)?.toMillis() || (prev.createdAt as any)?.toMillis() || 0;
        const currentTime = (current.lastMessageTimestamp as any)?.toMillis() || (current.createdAt as any)?.toMillis() || 0;
        return (prevTime > currentTime) ? prev : current;
      });
      setSelectedChat(mostRecentChat);
    }
  }, [chats, selectedChat]);


  const handleSendMessage = async (text: string) => {
    if (!authUser || !selectedChat) return;
    const sentMessage = await sendMessage(text, authUser.uid);

    // If talking to echo-bot, trigger the flow
    const echoBot = selectedChat.members.find(m => m.id === BOT_ID);
    if (echoBot && sentMessage) {
        await processEcho({ chatId: selectedChat.id, message: { id: sentMessage.id, text, sender: authUser.uid }});
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
            const newChatRef = await addDoc(collection(db, 'chats'), {
                members: [authUser.uid, fromUser.id],
                createdAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp()
            });
            const newChatDoc = await getDoc(newChatRef);
            if (newChatDoc.exists()){
                const newChatData = {id: newChatDoc.id, ...newChatDoc.data()} as ChatDocument;
                const populatedChat = await addChat(newChatData);
                setSelectedChat(populatedChat);
            }
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
  
  const handleCreateChatWithBot = async () => {
    if (!authUser) return;
    try {
      // Check if chat already exists
      const q = query(collection(db, 'chats'), where('members', 'array-contains', authUser.uid));
      const querySnapshot = await getDocs(q);
      const existingChat = querySnapshot.docs.find(doc => doc.data().members.includes(BOT_ID));
      
      if (existingChat) {
        toast({ title: 'Chat Already Exists', description: "You're already chatting with echo-bot." });
        const populated = chats.find(c => c.id === existingChat.id);
        if (populated) setSelectedChat(populated);
        return;
      }

      // Create a new chat
      const newChatRef = await addDoc(collection(db, 'chats'), {
        members: [authUser.uid, BOT_ID],
        createdAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp()
      });
      const newChatDoc = await getDoc(newChatRef);

      if (newChatDoc.exists()) {
        const newChatData = {id: newChatDoc.id, ...newChatDoc.data()} as ChatDocument;
        const populatedChat = await addChat(newChatData); // addChat now returns the populated chat
        setSelectedChat(populatedChat);
        toast({ title: 'Bot Added', description: 'Started a chat with echo-bot.' });
      }

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }


  if (loading || !authUser || !user || chatsLoading) {
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
