'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { UserNav } from '@/components/app/user-nav';
import { Chat } from '@/components/app/chat';
import { DirectMessages } from '@/components/app/direct-messages';
import { Servers } from '@/components/app/servers';
import type { DirectMessage } from '@/lib/types';
import { useChat } from '@/hooks/use-chat';

// Sample data
const directMessages: DirectMessage[] = [
  { id: '1', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/100', online: true },
  { id: '2', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/100', online: false },
  { id: '3', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/100', online: true },
];


export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState(directMessages[0]);
  const { messages, sendMessage } = useChat(selectedChat.id);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;
    await sendMessage(text, user.uid);
  };

  if (loading || !user) {
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
            directMessages={directMessages}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
          <Servers />
        </SidebarContent>
        <SidebarFooter>
          {/* Settings can go here */}
        </SidebarFooter>
      </Sidebar>
      <Chat
        chat={selectedChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={user}
      />
    </SidebarProvider>
  );
}
