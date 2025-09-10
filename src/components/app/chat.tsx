
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { PopulatedChat, Message, UserProfile, UserStatus } from '@/lib/types';
import { Send, Trash2, Pencil, Bot, Reply, SmilePlus, X, Menu, Sword, Zap, Car, Bike, BadgeCheck, Phone, Video, ChevronLeft, CircleDot, Moon, XCircle, Info, Grid3x3, Users, Inbox } from 'lucide-react';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MessageRenderer } from './message-renderer';
import { ChatInput } from './chat-input';
import { useTypingStatus } from '@/hooks/use-typing-status';
import { useCallingStore } from '@/hooks/use-calling-store';
import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';

const CallView = dynamic(() => import('@/components/app/call-view').then(mod => mod.CallView), {
  ssr: false,
});


const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'bg-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'bg-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'bg-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'bg-gray-500' },
};

interface ChatProps {
  chat: PopulatedChat;
  messages: Message[];
  onSendMessage: (text: string, file?: File, replyTo?: Message['replyTo']) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  currentUser: User;
  sidebarTrigger?: React.ReactNode;
  onBack?: () => void;
  onInitiateCall: (callee: UserProfile) => void;
}

export function Chat({ chat, messages, onSendMessage, onEditMessage, onDeleteMessage, currentUser, sidebarTrigger, onBack, onInitiateCall }: ChatProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { handleTyping } = useTypingStatus(chat.id);
  const { activeCall } = useCallingStore();
  
  const typingUsers = useMemo(() => {
    return chat.members.filter(m => m.id !== currentUser.uid && chat.typing?.[m.id!]);
  }, [chat.typing, chat.members, currentUser.uid]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    setReplyingTo(null);
  }, [chat.id]);


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

  const handleSendMessageWrapper = (text: string, file?: File) => {
    let replyInfo: Message['replyTo'] | undefined = undefined;
    if (replyingTo) {
      const senderProfile = chat.members.find(m => m.id === replyingTo.sender);
      replyInfo = {
        messageId: replyingTo.id,
        senderId: replyingTo.sender,
        senderDisplayName: senderProfile?.displayName || 'Unknown User',
        text: replyingTo.text,
      };
    }
    onSendMessage(text, file, replyInfo);
    setReplyingTo(null);
  }

  const otherMember = chat.members.find(m => m.id !== currentUser.uid);
  const chatName = otherMember?.displayName || chat.name || 'Chat';
  const chatAvatar = otherMember?.photoURL;
  const isBotChat = otherMember?.isBot;
  
  const isCallActiveInThisChat = activeCall && activeCall.chatId === chat.id;

  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.map(u => u.displayName).join(', ');
    const text = `${names} ${typingUsers.length > 1 ? 'are' : 'is'} typing...`;

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 pb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="italic">{text}</span>
        </div>
    );
  }

  const handleCallClick = () => {
      if(otherMember) {
          onInitiateCall(otherMember as UserProfile);
      }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-3 flex items-center gap-3 border-b flex-shrink-0">
          <Avatar className="size-6">
              <AvatarImage src={chatAvatar || undefined} />
              <AvatarFallback>{chatName?.[0]}</AvatarFallback>
          </Avatar>
          <h1 className="text-base font-semibold">{chatName}</h1>
          <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleCallClick}><Phone /></Button>
              <Button variant="ghost" size="icon" disabled><Video /></Button>
              <Button variant="ghost" size="icon" disabled><Users /></Button>
              <Button variant="ghost" size="icon" disabled><Inbox /></Button>
          </div>
      </header>
        {isCallActiveInThisChat && (
            <div className="h-96">
              <CallView />
            </div>
        )}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
            <div className="p-4 space-y-1">
              {messages.length === 0 ? (
                  <div className="flex flex-col justify-end items-start p-4 h-full">
                      <Avatar className="size-20 mb-4">
                          <AvatarImage src={chatAvatar || undefined} />
                          <AvatarFallback className="text-3xl">{chatName?.[0]}</AvatarFallback>
                      </Avatar>
                      <h2 className="text-3xl font-bold">@{chatName}</h2>
                      <p className="text-muted-foreground">This is the beginning of your direct message history with @{chatName}.</p>
                  </div>
              ) : (
                  messages.map((message, index) => {
                    const sender = chat.members.find(m => m.id === message.sender) as UserProfile;
                    const isCurrentUser = message.sender === currentUser?.uid;
                    const isEditing = editingMessageId === message.id;

                    const prevMessage = messages[index - 1];
                    const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender || !!message.replyTo || (new Date((message.timestamp as any)?.toDate()).getTime() - new Date((prevMessage.timestamp as any)?.toDate()).getTime() > 5 * 60 * 1000);

                    return (
                        <div
                            key={message.id}
                            className={cn(
                                "group relative flex items-start gap-4 py-0.5 px-4 rounded-md hover:bg-foreground/5",
                                isFirstInGroup ? "mt-4" : "mt-0"
                            )}
                        >
                            {isFirstInGroup ? (
                                <Avatar className="size-10 cursor-pointer">
                                    <AvatarImage src={sender?.photoURL || undefined} />
                                    <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="w-10 flex-shrink-0 text-right text-xs text-muted-foreground/0 group-hover:text-muted-foreground/100">
                                    {message.timestamp ? format((message.timestamp as any).toDate(), 'HH:mm') : ''}
                                </div>
                            )}
                            <div className="flex-1 pt-1">
                                {isFirstInGroup && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold cursor-pointer hover:underline">{sender?.displayName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {message.timestamp ? format((message.timestamp as any).toDate(), 'PPpp') : 'sending...'}
                                        </span>
                                    </div>
                                )}
                                {isEditing ? (
                                    <div className="flex-1 py-1">
                                        <ChatInput 
                                            onSendMessage={(text) => handleSaveEdit(message.id)}
                                            onTyping={() => {}}
                                            placeholder="Edit message..."
                                            members={[]}
                                        />
                                    </div>
                                ) : (
                                    <MessageRenderer 
                                        content={message.text}
                                        fileInfo={message.fileInfo}
                                        embed={message.embed}
                                        reactions={message.reactions}
                                        messageId={message.id}
                                        messageContext={{ type: 'dm', chatId: chat.id }}
                                    />
                                )}
                                {message.edited && !isEditing && <span className="text-xs text-muted-foreground/70 ml-2">(edited)</span>}
                            </div>
                            {!isEditing && (
                                <div className="absolute right-4 top-0 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-md border p-0.5 shadow-md">
                                    <Button variant="ghost" size="icon" className="size-6"><SmilePlus className="size-4" /></Button>
                                    <Button variant="ghost" size="icon" className="size-6"><Reply className="size-4" /></Button>
                                    {isCurrentUser && (
                                        <Button variant="ghost" size="icon" className="size-6" onClick={() => handleEdit(message)}><Pencil className="size-4" /></Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                  })
              )}
            </div>
          </ScrollArea>
          <TypingIndicator />
          <div className="p-4 border-t flex-shrink-0">
              {replyingTo && (
                  <div className="flex items-center justify-between text-sm bg-secondary px-3 py-1.5 rounded-t-md -mb-1 mx-[-1px]">
                      <p className="text-muted-foreground">
                          Replying to <span className="font-semibold text-foreground">{chat.members.find(m => m.id === replyingTo.sender)?.displayName}</span>
                      </p>
                      <Button variant="ghost" size="icon" className="size-5" onClick={() => setReplyingTo(null)}><X className="size-3.5"/></Button>
                  </div>
              )}
            <ChatInput 
              onSendMessage={handleSendMessageWrapper}
              onTyping={handleTyping}
              placeholder={`Message @${chatName}`}
              members={chat.members}
              disabled={!!editingMessageId}
              chatId={chat.id}
            />
          </div>
        </div>
    </div>
  );
}
