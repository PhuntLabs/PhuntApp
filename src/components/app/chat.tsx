'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DirectMessage, Message } from '@/lib/types';

interface ChatProps {
  chat: DirectMessage;
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentUser: User | null;
}

export function Chat({ chat, messages, onSendMessage, currentUser }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <SidebarInset>
      <div className="p-4 flex items-center gap-2 border-b">
        <SidebarTrigger />
        <Avatar className="size-8">
          <AvatarImage src={chat.avatar} />
          <AvatarFallback>{chat.name[0]}</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold">{chat.name}</h1>
      </div>
      <div className="flex flex-1 flex-col h-full bg-muted/20">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  message.sender === 'You' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender !== 'You' && (
                  <Avatar className="size-8">
                     <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${
                    message.sender === 'You'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                 {message.sender === 'You' && currentUser && (
                  <Avatar className="size-8">
                    <AvatarImage src={currentUser.photoURL || undefined} />
                    <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-card">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
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
  );
}
