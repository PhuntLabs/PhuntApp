
'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PopulatedChat, Message, UserProfile } from '@/lib/types';
import { Send, Trash2, Pencil, Bot } from 'lucide-react';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { MessageRenderer } from './message-renderer';
import { ChatInput } from './chat-input';

interface ChatProps {
  chat: PopulatedChat;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  currentUser: User;
}

export function Chat({ chat, messages, onSendMessage, onEditMessage, onDeleteMessage, currentUser }: ChatProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = (messageId: string) => {
    if (editingText.trim() === '') return;
    onEditMessage(messageId, editingText);
    handleCancelEdit();
  };

  const otherMember = chat.members.find(m => m.id !== currentUser.uid);
  const chatName = otherMember?.displayName || chat.name || 'Chat';
  const chatAvatar = otherMember?.photoURL;
  const isBotChat = otherMember?.isBot;

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 flex items-center gap-2 border-b">
        <SidebarTrigger className="md:hidden"/>
         <UserNav user={otherMember as UserProfile} as="trigger">
            <div className="flex items-center gap-2 cursor-pointer">
                 <Avatar className="size-8">
                  <AvatarImage src={chatAvatar || undefined} />
                  <AvatarFallback>{chatName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{chatName}</h1>
                  {isBotChat && (
                      <Badge variant="secondary" className="h-5 px-1.5 flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        <Bot className="size-3" /> BOT
                      </Badge>
                  )}
                </div>
            </div>
        </UserNav>
      </header>
      <div className="flex flex-1 flex-col h-full bg-muted/20">
        <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
          <div className="p-4 space-y-4">
            {messages.map((message, index) => {
              const sender = chat.members.find(m => m.id === message.sender) as UserProfile;
              const isCurrentUser = message.sender === currentUser?.uid;
              const isEditing = editingMessageId === message.id;
              const isMentioned = message.mentions?.includes(currentUser.uid);

              const prevMessage = messages[index - 1];
              const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "group relative flex items-start gap-3 py-0.5 px-2 rounded-md",
                    isFirstInGroup ? "mt-3" : "mt-0",
                    isMentioned ? "bg-yellow-500/10 hover:bg-yellow-500/20" : "hover:bg-foreground/5"
                  )}
                >
                  <div className="flex-1 flex gap-3 items-start">
                    {isFirstInGroup ? (
                      <UserNav user={sender} as="trigger">
                        <Avatar className="size-10 cursor-pointer mt-1">
                          <AvatarImage src={sender?.photoURL || undefined} />
                          <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                      </UserNav>
                    ) : (
                      <div className="w-10 flex-shrink-0" />
                    )}

                    <div className="flex-1 pt-1">
                      {isFirstInGroup && (
                        <div className="flex items-baseline gap-2">
                           <UserNav user={sender} as="trigger">
                              <span className="font-semibold cursor-pointer hover:underline">{sender?.displayName}</span>
                           </UserNav>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp ? format((message.timestamp as any).toDate(), 'PPpp') : 'sending...'}
                          </span>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex-1 py-1">
                          <Input 
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-sm p-2 h-auto"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(message.id);
                              }
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                           <div className="text-xs text-muted-foreground mt-1">
                            escape to cancel, enter to save
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-foreground/90">
                           <MessageRenderer content={message.text} />
                           {message.edited && <span className="text-xs text-muted-foreground/70 ml-2">(edited)</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCurrentUser && !isEditing && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-md border p-0.5">
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => handleEdit(message)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-6 text-red-500 hover:text-red-500" onClick={() => onDeleteMessage(message.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-card">
          <ChatInput 
            onSendMessage={onSendMessage}
            placeholder={`Message @${chatName}`}
            members={chat.members}
            disabled={!!editingMessageId}
          />
        </div>
      </div>
    </div>
  );
}
