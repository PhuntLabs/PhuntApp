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
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { chats, loading: chatsLoading, addChat } = useChats();
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const { messages, sendMessage } = useChat(selectedChat?.id);
  const { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useFriendRequests();
  const { toast } = useToast();


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!selectedChat && chats.length > 0) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);


  const handleSendMessage = async (text: string) => {
    if (!user || !selectedChat) return;
    await sendMessage(text, user.uid);
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
     if (!user) return;
    try {
        await acceptFriendRequest(requestId, fromUser);
        toast({ title: 'Friend Added!', description: `You and ${fromUser.displayName} are now friends.` });

        // Check if chat already exists
        const q = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        const existingChat = querySnapshot.docs.find(doc => doc.data().members.includes(fromUser.id));

        if (!existingChat) {
            // Create a new chat
            const newChatRef = await addDoc(collection(db, 'chats'), {
                members: [user.uid, fromUser.id],
                createdAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp()
            });
            const newChatDoc = await getDoc(newChatRef);
            addChat({id: newChatDoc.id, ...newChatDoc.data()} as PopulatedChat);
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

  if (loading || !user || chatsLoading) {
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
          <UserNav user={user} logout={logout}/>
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
          />
          <Servers />
        </SidebarContent>
        <SidebarFooter>
          {/* Settings can go here */}
        </SidebarFooter>
      </Sidebar>
      {selectedChat && user ? (
        <Chat
          chat={selectedChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={user}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center h-screen bg-muted/20">
          <p>Select a chat to start messaging.</p>
        </div>
      )}
    </SidebarProvider>
  );
}
