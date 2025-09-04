'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { DirectMessage, PopulatedChat } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';
import { useChats } from '@/hooks/use-chats';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { chats, loading: chatsLoading } = useChats();
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const { messages, sendMessage } = useChat(selectedChat?.id);


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
          <DirectMessages
            directMessages={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
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
