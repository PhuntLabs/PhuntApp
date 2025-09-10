

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PopulatedChat, Message, UserProfile, Emoji, CustomEmoji, UserStatus } from '@/lib/types';
import { Send, Trash2, Pencil, Bot, Reply, SmilePlus, X, Menu, Sword, Zap, Car, Bike, BadgeCheck, Phone, Video, ChevronLeft, CircleDot, Moon, XCircle, Info, Grid3x3 } from 'lucide-react';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { MessageRenderer } from './message-renderer';
import { ChatInput } from './chat-input';
import { useTypingStatus } from '@/hooks/use-typing-status';
import { useChat } from '@/hooks/use-chat';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useBadges } from '@/hooks/use-badges';
import { useCallingStore } from '@/hooks/use-calling-store';
import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';
import { Separator } from '../ui/separator';

const CallView = dynamic(() => import('@/components/app/call-view').then(mod => mod.CallView), {
  ssr: false,
});


const tagIcons = {
    Sword, Zap, Car, Bike
};

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { handleTyping } = useTypingStatus(chat.id);
  const { getBadgeDetails, getBadgeIcon } = useBadges();
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
  const status = otherMember?.status || 'offline';
  const { label: statusLabel, icon: StatusIcon, color: statusColor } = statusConfig[status];
  
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
    <div className="flex h-full bg-background">
      <div className={cn("flex flex-col h-full bg-background flex-1", isInfoOpen && 'hidden md:flex')}>
        <header className="p-3 flex items-center gap-3 border-b bg-gradient-to-r from-card to-background">
          {onBack && (
              <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
                  <ChevronLeft />
              </Button>
          )}
          {sidebarTrigger}
          <UserNav user={otherMember as UserProfile} as="trigger">
              <div className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage src={chatAvatar || undefined} />
                        <AvatarFallback>{chatName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background", statusConfig[status].color)} />
                  </div>
                  <div className="flex flex-col -space-y-1">
                    <h1 className="text-base font-semibold">{chatName}</h1>
                    <p className="text-xs text-muted-foreground">{otherMember?.members?.length || 2} members</p>
                  </div>
              </div>
          </UserNav>
          <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleCallClick}><Phone /></Button>
              <Button variant="ghost" size="icon" onClick={() => setIsInfoOpen(!isInfoOpen)}><Info /></Button>
              <Button variant="ghost" size="icon"><Grid3x3 /></Button>
          </div>
        </header>
        {isCallActiveInThisChat && (
            <div className="h-96">
              <CallView />
            </div>
          )}
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
            <TooltipProvider>
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
                    const isMentioned = message.mentions?.includes(currentUser.uid);

                    const prevMessage = messages[index - 1];
                    const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender || !!message.replyTo;
                    
                    if (!sender) return null;

                    const isHeina = sender.displayName?.toLowerCase() === 'heina';
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "group relative flex flex-col",
                          isCurrentUser ? "items-end" : "items-start",
                          isFirstInGroup ? "mt-3" : "mt-0",
                        )}
                      >
                       <div className={cn("flex gap-3 items-start", isCurrentUser && "flex-row-reverse")}>
                          {isFirstInGroup && (
                            <UserNav user={sender} as="trigger">
                              <Avatar className="size-10 cursor-pointer mt-1">
                                <AvatarImage src={sender?.photoURL || undefined} />
                                <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
                              </Avatar>
                            </UserNav>
                          )}
                          <div 
                            className={cn(
                              "p-3 rounded-2xl max-w-md",
                              isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card rounded-bl-none",
                              !isFirstInGroup && (isCurrentUser ? "mr-14" : "ml-14")
                            )}
                          >
                               <MessageRenderer 
                                  content={message.text} 
                                  fileInfo={message.fileInfo}
                                  embed={message.embed}
                                  reactions={message.reactions}
                                  messageId={message.id}
                                  messageContext={{ type: 'dm', chatId: chat.id }}
                                />
                          </div>
                       </div>
                      </div>
                    )
                  })
              )}
            </div>
            </TooltipProvider>
          </ScrollArea>
          <TypingIndicator />
          <div className="p-2 md:p-4 border-t">
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
       {isInfoOpen && otherMember && (
         <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-4 border-b text-center">
              <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={() => setIsInfoOpen(false)}><X/></Button>
              <Avatar className="size-20 mx-auto">
                <AvatarImage src={otherMember.photoURL || undefined} />
                <AvatarFallback className="text-3xl">{otherMember.displayName[0]}</AvatarFallback>
              </Avatar>
              <h3 className="mt-2 text-lg font-semibold">{otherMember.displayName}</h3>
              <p className="text-sm text-muted-foreground">{statusLabel}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm">Description</h4>
                <p className="text-sm text-muted-foreground">{otherMember.bio || "No description provided."}</p>
              </div>
              <Separator />
               <div>
                <h4 className="font-semibold text-sm mb-2">Media</h4>
                <div className="grid grid-cols-3 gap-1">
                   <div className="aspect-square bg-muted rounded-md"/>
                   <div className="aspect-square bg-muted rounded-md"/>
                   <div className="aspect-square bg-muted rounded-md"/>
                </div>
              </div>
            </div>
         </div>
       )}
    </div>
  );
}
