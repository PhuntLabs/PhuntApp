
'use client';
import { useState, useRef, useEffect } from 'react';
import type { Channel, Server, Message, UserProfile } from '@/lib/types';
import { Hash, Pencil, Send, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'firebase/auth';
import { MessageRenderer } from './message-renderer';
import { ChatInput } from './chat-input';

interface ChannelChatProps {
    channel: Channel;
    server: Server;
    currentUser: User;
    members: Partial<UserProfile>[];
    messages: Message[];
    onSendMessage: (text: string) => void;
    onEditMessage: (messageId: string, newText: string) => void;
    onDeleteMessage: (messageId: string) => void;
}

export function ChannelChat({ 
    channel, 
    server, 
    currentUser,
    members,
    messages,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
}: ChannelChatProps) {
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

    const displayName = channel.name.replace(/-/g, ' ');

    const getSenderProfile = (senderId: string) => {
        return members.find(m => m.uid === senderId);
    }

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Hash className="size-6 text-muted-foreground" />
                <h1 className="text-xl font-semibold">{displayName}</h1>
            </header>

            <div className="flex-1 flex flex-col h-full bg-muted/20 overflow-hidden">
                <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
                    {messages.length === 0 ? (
                         <div className="flex flex-col justify-end items-start p-4 h-full">
                             <div className="p-4 rounded-lg bg-background/50">
                                <h2 className="text-2xl font-bold">Welcome to #{displayName}!</h2>
                                <p className="text-muted-foreground">This is the beginning of the #{displayName} channel.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {messages.map((message, index) => {
                                const sender = getSenderProfile(message.sender);
                                const isCurrentUser = message.sender === currentUser?.uid;
                                const isEditing = editingMessageId === message.id;
                                const isMentioned = message.mentions?.includes(currentUser.uid);

                                const prevMessage = messages[index - 1];
                                const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;

                                if (!sender) return null; // Or show a fallback for deleted users

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
                                        <UserNav user={sender as UserProfile} as="trigger">
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
                                                <UserNav user={sender as UserProfile} as="trigger">
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
                    )}
                </ScrollArea>
            </div>
             <div className="p-4 border-t bg-card flex-shrink-0">
                <ChatInput 
                    onSendMessage={onSendMessage}
                    placeholder={`Message #${displayName}`}
                    members={members}
                    disabled={!!editingMessageId}
                />
            </div>
        </div>
    )
}
