
'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Channel, Server, Message, UserProfile, Emoji, CustomEmoji } from '@/lib/types';
import { Hash, Pencil, Send, Trash2, Reply, SmilePlus, X, BadgeCheck } from 'lucide-react';
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
import { useTypingStatus } from '@/hooks/use-typing-status';
import { usePermissions } from '@/hooks/use-permissions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';
import { Badge } from '../ui/badge';

const standardEmojis: Emoji[] = [
    { name: "grinning", char: "😀", keywords: ["happy", "joy", "smile"] },
    { name: "joy", char: "😂", keywords: ["happy", "lol", "laugh"] },
    { name: "sob", char: "😭", keywords: ["sad", "cry", "tear"] },
    { name: "thinking", char: "🤔", keywords: ["idea", "question", "hmm"] },
    { name: "thumbsup", char: "👍", keywords: ["agree", "yes", "like"] },
    { name: "heart", char: "❤️", keywords: ["love", "like", "romance"] },
    { name: "fire", char: "🔥", keywords: ["hot", "lit", "burn"] },
    { name: "rocket", char: "🚀", keywords: ["launch", "space", "fast"] },
];

interface ChannelChatProps {
    channel: Channel;
    server: Server;
    currentUser: User;
    members: Partial<UserProfile>[];
    messages: Message[];
    onSendMessage: (text: string, imageUrl?: string, replyTo?: Message['replyTo']) => void;
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
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { handleTyping } = useTypingStatus(server.id, channel.id);
    const { hasPermission } = usePermissions(server, channel.id);

    const canSendMessages = hasPermission('sendMessages');
    
    const typingUsers = useMemo(() => {
        return members.filter(m => m.uid !== currentUser.uid && channel.typing?.[m.uid!]);
    }, [channel.typing, members, currentUser.uid]);

    useEffect(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
    }, [messages, typingUsers]);

    useEffect(() => {
        // Reset reply state if channel changes
        setReplyingTo(null);
    }, [channel.id]);


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

    const handleSendMessageWrapper = (text: string, imageUrl?: string) => {
        let replyInfo: Message['replyTo'] | undefined = undefined;
        if (replyingTo) {
            const senderProfile = getSenderProfile(replyingTo.sender);
            replyInfo = {
                messageId: replyingTo.id,
                senderId: replyingTo.sender,
                senderDisplayName: senderProfile?.displayName || 'Unknown User',
                text: replyingTo.text,
            };
        }
        onSendMessage(text, imageUrl, replyInfo);
        setReplyingTo(null);
    }
    
    const displayName = channel.name.replace(/-/g, ' ');

    const getSenderProfile = (senderId: string) => {
        return members.find(m => m.uid === senderId);
    }
    
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

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Hash className="size-6 text-muted-foreground" />
                <div className="flex-1">
                    <h1 className="text-xl font-semibold">{displayName}</h1>
                    {channel.topic && <p className="text-sm text-muted-foreground truncate">{channel.topic}</p>}
                </div>
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
                        <div className="p-4 space-y-1">
                            {messages.map((message, index) => {
                                const sender = getSenderProfile(message.sender);
                                const isCurrentUser = message.sender === currentUser?.uid;
                                const isEditing = editingMessageId === message.id;
                                const isMentioned = message.mentions?.includes(currentUser.uid) || message.text.includes('@everyone');

                                const prevMessage = messages[index - 1];
                                const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender || !!message.replyTo;

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
                                        <UserNav user={sender as UserProfile} as="trigger" serverContext={server}>
                                            <Avatar className="size-10 cursor-pointer mt-1">
                                                <AvatarImage src={sender?.photoURL || undefined} />
                                                <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
                                            </Avatar>
                                        </UserNav>
                                        ) : (
                                        <div className="w-10 flex-shrink-0" />
                                        )}

                                        <div className="flex-1 pt-1">
                                             {message.replyTo && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <Reply className="size-3.5" />
                                                    <Avatar className="size-4">
                                                        <AvatarImage src={getSenderProfile(message.replyTo.senderId)?.photoURL || undefined} />
                                                        <AvatarFallback>{message.replyTo.senderDisplayName[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold text-foreground/80">{message.replyTo.senderDisplayName}</span>
                                                    <p className="truncate flex-1">{message.replyTo.text}</p>
                                                </div>
                                            )}

                                            {isFirstInGroup && (
                                                <div className="flex items-baseline gap-2">
                                                <UserNav user={sender as UserProfile} as="trigger" serverContext={server}>
                                                    <span className="font-semibold cursor-pointer hover:underline">{sender?.displayName}</span>
                                                </UserNav>
                                                {sender?.displayName === 'heina' && (
                                                    <Badge variant="outline" className="h-5 px-1.5 flex items-center gap-1 border-blue-500 text-blue-400 bg-blue-500/10">
                                                        <BadgeCheck className="size-3" /> DEVELOPER
                                                    </Badge>
                                                )}
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
                                                <>
                                                    <div className="text-sm text-foreground/90">
                                                    <MessageRenderer content={message.text} customEmojis={server.customEmojis} />
                                                    {message.edited && <span className="text-xs text-muted-foreground/70 ml-2">(edited)</span>}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-md border p-0.5">
                                            <Button variant="ghost" size="icon" className="size-6" onClick={() => setReplyingTo(message)}><Reply className="size-3.5" /></Button>
                                            {isCurrentUser && <>
                                                <Button variant="ghost" size="icon" className="size-6" onClick={() => handleEdit(message)}><Pencil className="size-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="size-6 text-red-500 hover:text-red-500" onClick={() => onDeleteMessage(message.id)}><Trash2 className="size-3.5" /></Button>
                                            </>}
                                        </div>
                                    )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
                 <TypingIndicator />
            </div>
             <div className="p-4 border-t bg-card flex-shrink-0">
                {replyingTo && (
                    <div className="flex items-center justify-between text-sm bg-secondary px-3 py-1.5 rounded-t-md -mb-1 mx-[-1px]">
                       <p className="text-muted-foreground">
                           Replying to <span className="font-semibold text-foreground">{getSenderProfile(replyingTo.sender)?.displayName}</span>
                       </p>
                       <Button variant="ghost" size="icon" className="size-5" onClick={() => setReplyingTo(null)}><X className="size-3.5"/></Button>
                    </div>
                )}
                <ChatInput 
                    onSendMessage={handleSendMessageWrapper}
                    onTyping={handleTyping}
                    placeholder={canSendMessages ? `Message #${displayName}` : `You do not have permission to send messages in #${displayName}`}
                    members={members}
                    customEmojis={server.customEmojis}
                    disabled={!!editingMessageId || !canSendMessages}
                    serverContext={server}
                    channelId={channel.id}
                />
            </div>
        </div>
    )
}
