'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PopulatedChat, Message } from '@/lib/types';
import { Send, CheckCircle, Trash2, Pencil, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatProps {
  chat: PopulatedChat;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  currentUser: User;
}

export function Chat({ chat, messages, onSendMessage, onEditMessage, onDeleteMessage, currentUser }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

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
  const chatAvatar = otherMember?.photoURL || chat.photoURL;

  return (
    <SidebarInset>
      <div className="p-4 flex items-center gap-2 border-b">
        <SidebarTrigger />
        <Avatar className="size-8">
          <AvatarImage src={chatAvatar || undefined} />
          <AvatarFallback>{chatName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{chatName}</h1>
          {chat.isOfficial && (
            <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-500">
              <CheckCircle className="size-3" /> OFFICIAL
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col h-full bg-muted/20">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const sender = chat.members.find(m => m.id === message.sender);
              const isCurrentUser = message.sender === currentUser?.uid;
              const isEditing = editingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`group flex items-end gap-2 ${
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isCurrentUser && (
                    <Avatar className="size-8">
                       <AvatarImage src={sender?.photoURL || undefined} />
                      <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  {isCurrentUser && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => handleEdit(message)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:text-red-500" onClick={() => onDeleteMessage(message.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex-1 max-w-xs lg:max-w-md">
                      <Input 
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="text-sm p-3 h-auto"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(message.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                       <div className="text-xs text-muted-foreground mt-1">
                        escape to cancel, enter to save
                        <Button variant="link" size="sm" className="p-0 h-auto ml-2" onClick={() => handleSaveEdit(message.id)}>Save</Button>
                        <Button variant="link" size="sm" className="p-0 h-auto ml-2" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      {message.edited && <span className="text-xs text-muted-foreground/70 ml-2">(edited)</span>}
                    </div>
                  )}

                   {isCurrentUser && !isEditing && (
                    <Avatar className="size-8">
                      <AvatarImage src={currentUser.photoURL || undefined} />
                      <AvatarFallback>{currentUser.displayName?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
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
              disabled={!!editingMessageId}
            />
            <Button type="submit" size="icon" disabled={!!editingMessageId}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </SidebarInset>
  );
}
