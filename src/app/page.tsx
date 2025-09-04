'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { MessageSquare, Users, Settings, LogOut, Search, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sample data for users and messages
const directMessages = [
  { id: '1', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/100', online: true },
  { id: '2', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/100', online: false },
  { id: '3', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/100', online: true },
];

const initialMessages = [
    { id: 'm1', sender: 'Alice', text: 'Hey, how are you?' },
    { id: 'm2', sender: 'You', text: 'I am good, thanks! How about you?' },
    { id: 'm3', sender: 'Alice', text: 'Doing great! Working on the new chat app.' },
];


export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(directMessages[0]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    setMessages([...messages, { id: `m${messages.length + 1}`, sender: 'You', text: newMessage }]);
    setNewMessage('');
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
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={user.photoURL || "https://picsum.photos/100"} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{user.email}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between">
                    Direct Messages
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </SidebarGroupLabel>
                <SidebarMenu>
                {directMessages.map((dm) => (
                    <SidebarMenuItem key={dm.id}>
                    <SidebarMenuButton tooltip={dm.name} isActive={selectedChat.id === dm.id} onClick={() => setSelectedChat(dm)}>
                        <Avatar className="size-6 rounded-md relative">
                            <AvatarImage src={dm.avatar} />
                            <AvatarFallback>{dm.name[0]}</AvatarFallback>
                             {dm.online && <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-sidebar" />}
                        </Avatar>
                        {dm.name}
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Servers</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Gaming HQ">
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src="https://picsum.photos/seed/gaming/100" />
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                  Gaming HQ
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Design Nerds">
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src="https://picsum.photos/seed/design/100" />
                    <AvatarFallback>D</AvatarFallback>
                  </Avatar>
                  Design Nerds
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center gap-2 border-b">
          <SidebarTrigger />
          <Avatar className="size-8">
            <AvatarImage src={selectedChat.avatar} />
            <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-semibold">{selectedChat.name}</h1>
        </div>
        <div className="flex flex-1 flex-col h-full">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${message.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                 <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..." 
                        className="flex-1"
                    />
                    <Button type="submit">Send</Button>
                </form>
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
