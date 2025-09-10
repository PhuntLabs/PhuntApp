
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, SmilePlus, X, AtSign, Slash, Bot, Trash, Lock, Vote, MessageSquare, Pipette, Shuffle, Paperclip, Plus, Gamepad2, Gift, Mic } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile, Emoji, CustomEmoji, Server, Message, Embed } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { executeSlashCommand, SlashCommandOutput } from '@/ai/flows/slash-command-flow';
import { useMobileView } from '@/hooks/use-mobile-view';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

const standardEmojis: Emoji[] = [
    { name: "grinning", char: "😀", keywords: ["happy", "joy", "smile"] },
    { name: "joy", char: "😂", keywords: ["happy", "lol", "laugh"] },
    { name: "sob", char: "😭", keywords: ["sad", "cry", "tear"] },
    { name: "thinking", char: "🤔", keywords: ["idea", "question", "hmm"] },
    { name: "thumbsup", char: "👍", keywords: ["agree", "yes", "like"] },
    { name: "heart", char: "❤️", keywords: ["love", "like", "romance"] },
    { name: "fire", char: "🔥", keywords: ["hot", "lit", "burn"] },
    { name: "rocket", char: "🚀", keywords: ["launch", "space", "fast"] },
    { name: "wave", char: "👋", keywords: ["hand", "hello", "bye"] },
    { name: "clap", char: "👏", keywords: ["praise", "applause", "congrats"] },
    { name: "star", char: "⭐", keywords: ["favorite", "rate", "special"] },
    { name: "tada", char: "🎉", keywords: ["party", "celebrate", "hooray"] },
];

const modCommands = [
    { name: 'clean', description: 'Deletes the last 100 messages in the channel.', icon: Trash, permission: 'manageChannels' },
    { name: 'lock', description: 'Lock the channel to prevent members from sending messages.', icon: Lock, permission: 'manageChannels' },
    { name: 'kick', description: 'Kick a member from the server.', icon: Bot, permission: 'kickMembers' },
    { name: 'ban', description: 'Ban a member from the server.', icon: Bot, permission: 'banMembers' },
];

const qolforuCommands = [
    { name: 'poll', description: 'Create a poll with multiple choices.', icon: Vote, args: '"Question" "Option A" "Option B" ...' },
    { name: 'embed', description: 'Create a custom embed message.', icon: MessageSquare, args: '"Title" "Description" #color' },
    { name: 'suggest', description: 'Create a suggestion embed for voting.', icon: Pipette, args: '"Your idea"' },
    { name: 'random-user', description: 'Pick a random user from the channel.', icon: Shuffle, args: '' },
];


interface ChatInputProps {
    onSendMessage: (text: string, file?: File, embed?: Embed | { embed: Embed, reactions?: string[] }) => void;
    onTyping: (isTyping: boolean) => void;
    placeholder?: string;
    members: Partial<UserProfile>[];
    customEmojis?: CustomEmoji[];
    disabled?: boolean;
    chatId?: string;
    serverContext?: Server;
    channelId?: string;
}

export function ChatInput({ 
    onSendMessage, 
    onTyping,
    placeholder, 
    members, 
    customEmojis = [], 
    disabled, 
    chatId,
    serverContext,
    channelId,
}: ChatInputProps) {
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, authUser } = useAuth();
    const { toast } = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [autocompleteType, setAutocompleteType] = useState<'mention' | 'emoji' | 'command' | null>(null);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
    
    const [filteredMembers, setFilteredMembers] = useState<Partial<UserProfile>[]>([]);
    const [filteredEmojis, setFilteredEmojis] = useState<(Emoji | CustomEmoji)[]>([]);
    const [filteredCommands, setFilteredCommands] = useState<(typeof modCommands[0] | typeof qolforuCommands[0])[]>([]);
   
    const combinedEmojis = [...standardEmojis, ...customEmojis];

    const { hasPermission } = usePermissions(serverContext || null, channelId || null);
    const canMentionEveryone = hasPermission('mentionEveryone');
    const hasQolBot = serverContext?.members.some(id => id === 'qolforu-bot-id');
    const { isMobileView } = useMobileView();

    const everyoneAndHereOption = useMemo(() => {
        return { uid: 'everyone', displayName: 'everyone', note: 'Notifies everyone in this channel.' };
    }, []);

    const handleTyping = useCallback(() => {
        onTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 3000);
    }, [onTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const value = e.target.value;
        setText(value);
        handleTyping();

        const cursorPosition = e.target.selectionStart;
        if (cursorPosition === null) return;
        const textBeforeCursor = value.substring(0, cursorPosition);
        
        const lastAt = textBeforeCursor.lastIndexOf('@');
        const lastColon = textBeforeCursor.lastIndexOf(':');
        const lastSlash = textBeforeCursor.lastIndexOf('/');
        const lastSpace = textBeforeCursor.lastIndexOf(' ');

        if (lastSlash === 0 && !textBeforeCursor.includes(' ')) {
            const query = textBeforeCursor.substring(lastSlash + 1);
            setAutocompleteType('command');
            setAutocompleteQuery(query);
            setIsAutocompleteOpen(true);
        } else if (lastAt > lastSpace && !textBeforeCursor.substring(lastAt + 1).includes(' ')) {
            const query = textBeforeCursor.substring(lastAt + 1);
            setAutocompleteType('mention');
            setAutocompleteQuery(query);
            setIsAutocompleteOpen(true);
        } else if (lastColon > lastSpace && !textBeforeCursor.substring(lastColon + 1).includes(' ')) {
            const query = textBeforeCursor.substring(lastColon + 1);
            setAutocompleteType('emoji');
            setAutocompleteQuery(query);
            setIsAutocompleteOpen(true);
        } else {
            setIsAutocompleteOpen(false);
            setAutocompleteType(null);
        }
    };

    useEffect(() => {
        if (!isAutocompleteOpen || !autocompleteType) return;

        if (autocompleteType === 'command') {
            const allCommands: (typeof modCommands[0] | typeof qolforuCommands[0])[] = [...modCommands];
            if(hasQolBot) allCommands.push(...qolforuCommands);

            const matches = allCommands.filter(cmd => 
                cmd.name.toLowerCase().startsWith(autocompleteQuery.toLowerCase()) &&
                ('permission' in cmd ? hasPermission(cmd.permission as any) : true)
            );
            setFilteredCommands(matches);
        } else if (autocompleteType === 'mention') {
            let matches = members.filter(member => 
                member.displayName?.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
            );
            if (canMentionEveryone && 'everyone'.startsWith(autocompleteQuery.toLowerCase())) {
                matches = [everyoneAndHereOption, ...matches];
            }
            setFilteredMembers(matches);
        } else if (autocompleteType === 'emoji') {
            const filtered = combinedEmojis.filter(emoji => 
                emoji.name.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
            );
            setFilteredEmojis(filtered);
        }

    }, [autocompleteQuery, autocompleteType, isAutocompleteOpen, members, combinedEmojis, canMentionEveryone, everyoneAndHereOption, hasPermission, hasQolBot]);

    const insertAutocomplete = (value: string, type: 'mention' | 'emoji' | 'command') => {
        if (!inputRef.current) return;

        const cursorPosition = inputRef.current.selectionStart;
        if (cursorPosition === null) return;
        const textBeforeCursor = text.substring(0, cursorPosition);
        
        let newText: string;
        if (type === 'command') {
            newText = `/${value} `;
        } else if(type === 'mention') {
            const lastTrigger = textBeforeCursor.lastIndexOf('@');
            newText = text.substring(0, lastTrigger) + `@${value} ` + text.substring(cursorPosition);
        } else { // emoji
            const lastTrigger = textBeforeCursor.lastIndexOf(':');
            newText = text.substring(0, lastTrigger) + `:${value}: ` + text.substring(cursorPosition);
        }


        setText(newText);
        setIsAutocompleteOpen(false);
        setAutocompleteType(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    
     const insertEmoji = (emoji: Emoji | CustomEmoji) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart;
        if (cursorPosition === null) return;

        const textToInsert = 'char' in emoji ? emoji.char : `:${emoji.name}:`;

        const newText = text.substring(0, cursorPosition) + textToInsert + text.substring(cursorPosition);
        setText(newText);
        inputRef.current.focus();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setAttachment(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if ((text.trim() === '' && !attachment) || isSubmitting) return;
        setIsSubmitting(true);
        
        if (text.startsWith('/') && serverContext && channelId && authUser) {
            const [command, ...args] = text.substring(1).split(' ');
            const qolBot = serverContext.members.find(id => id === 'qolforu-bot-id');

            try {
                const result = await executeSlashCommand({
                    executorId: authUser.uid,
                    serverId: serverContext.id,
                    channelId: channelId,
                    command,
                    args,
                    botId: qolBot ? 'qolforu-bot-id' : undefined
                });

                if (result.type === 'embed') {
                    onSendMessage('', undefined, result.payload);
                }
                
            } catch(error: any) {
                toast({ variant: 'destructive', title: 'Command Error', description: error.message });
            }

        } else {
             onSendMessage(text, attachment || undefined);
        }
        
        onTyping(false);
        setText('');
        setAttachment(null);
        setIsSubmitting(false);
        setIsAutocompleteOpen(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
         if (e.key === 'Escape') {
            setIsAutocompleteOpen(false);
        }
    };

    const AutocompletePopover = () => (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto z-10">
           {autocompleteType === 'mention' && (
                <div className="space-y-1">
                    {filteredMembers.map(member => (
                        <button key={member.uid} onClick={() => insertAutocomplete(member.displayName!, 'mention')} className="flex items-center gap-2 p-2 rounded w-full text-left hover:bg-accent">
                            <Avatar className="size-6">
                                <AvatarImage src={member.photoURL || undefined} />
                                <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{member.displayName}</span>
                            {'note' in member && <span className="text-xs text-muted-foreground ml-auto">{member.note}</span>}
                        </button>
                    ))}
                </div>
            )}
             {autocompleteType === 'emoji' && (
                <div className="space-y-1">
                    {filteredEmojis.map(emoji => (
                        <button key={emoji.name} onClick={() => insertAutocomplete(emoji.name, 'emoji')} className="flex items-center gap-2 p-2 rounded w-full text-left hover:bg-accent">
                            {'char' in emoji ? (
                                <span className="text-2xl">{emoji.char}</span>
                            ) : (
                                <Image src={emoji.url} alt={emoji.name} width={24} height={24} />
                            )}
                            <span className="font-mono text-sm">:{emoji.name}:</span>
                        </button>
                    ))}
                </div>
            )}
             {autocompleteType === 'command' && (
                <div className="space-y-1">
                     {filteredCommands.map(cmd => (
                        <button key={cmd.name} onClick={() => insertAutocomplete(cmd.name, 'command')} className="flex items-center gap-3 p-2 rounded w-full text-left hover:bg-accent">
                            <div className="size-8 rounded-md bg-secondary/50 flex items-center justify-center">
                                <cmd.icon className="size-5" />
                            </div>
                            <div>
                                <p className="font-semibold">{cmd.name}</p>
                                <p className="text-xs text-muted-foreground">{cmd.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
            {isAutocompleteOpen && AutocompletePopover()}
            {attachment && (
                <div className="relative w-32 h-32 bg-secondary/50 rounded-md p-2">
                    <Image
                        src={URL.createObjectURL(attachment)}
                        alt="Pasted image preview"
                        fill
                        className="object-contain rounded-md"
                    />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => setAttachment(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="flex items-start gap-2 bg-muted p-2 rounded-xl">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="size-9 shrink-0" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isSubmitting}
                >
                    <Plus className="size-5 text-muted-foreground bg-accent rounded-full p-0.5"/>
                </Button>
                <Textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Send a message..."}
                    className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2 text-base"
                    rows={1}
                    disabled={disabled || isSubmitting}
                />
                <div className="flex items-center">
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" disabled={disabled || isSubmitting}>
                        <Gift className="size-5"/>
                    </Button>
                     <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" disabled={disabled || isSubmitting}>
                        <Gamepad2 className="size-5"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" disabled={disabled || isSubmitting}>
                        <SmilePlus className="size-5"/>
                    </Button>
                </div>
            </div>
        </form>
    );
}
