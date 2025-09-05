
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, SmilePlus, X, AtSign, Slash, Bot, Trash, Lock, Vote, MessageSquare, Pipette, Shuffle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile, Emoji, CustomEmoji } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { Server } from '@/lib/types';
import { executeSlashCommand, SlashCommandOutput } from '@/ai/flows/slash-command-flow';

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
    onSendMessage: (text: string, imageUrl?: string, embed?: any) => void;
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
    const [pastedImage, setPastedImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user, authUser, uploadFile } = useAuth();
    const { toast } = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);
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
        }, 3000); // User is considered "not typing" after 3 seconds of inactivity
    }, [onTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setText(value);
        handleTyping();

        const cursorPosition = e.target.selectionStart;
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
            const allCommands = [...modCommands];
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
        // Timeout to allow state to update before focusing
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    
     const insertEmoji = (emoji: Emoji | CustomEmoji) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart;

        const textToInsert = 'char' in emoji ? emoji.char : `:${emoji.name}:`;

        const newText = text.substring(0, cursorPosition) + textToInsert + text.substring(cursorPosition);
        setText(newText);
        inputRef.current.focus();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setPastedImage(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if ((text.trim() === '' && !pastedImage) || isUploading) return;
        
        // Handle slash commands
        if (text.startsWith('/') && serverContext && channelId && authUser) {
            const [command, ...rawArgs] = text.substring(1).split(' ');
            
            // Check which bot owns the command
            const qolCommand = qolforuCommands.find(c => c.name === command);
            const modCommand = modCommands.find(c => c.name === command);

            let botId: string | undefined = undefined;
            if (qolCommand && hasQolBot) {
                botId = 'qolforu-bot-id';
            } else if (!modCommand) {
                 toast({ variant: 'destructive', title: 'Unknown Command', description: `The command /${command} does not exist.` });
                 return;
            }

            // Simple arg parsing: treat anything in quotes as a single argument
            const args: string[] = [];
            let currentArg = '';
            let inQuote = false;
            text.substring(1).split(' ').slice(1).join(' ').split('').forEach(char => {
                if (char === '"') {
                    if (inQuote) {
                        if (currentArg) args.push(currentArg);
                        currentArg = '';
                        inQuote = false;
                    } else {
                        inQuote = true;
                    }
                } else if (char === ' ' && !inQuote) {
                     if (currentArg) args.push(currentArg);
                     currentArg = '';
                } else {
                    currentArg += char;
                }
            });
            if(currentArg) args.push(currentArg);


            setIsUploading(true);
            try {
                const result = await executeSlashCommand({
                    executorId: authUser.uid,
                    serverId: serverContext.id,
                    channelId,
                    command,
                    args,
                    botId,
                });

                if (result.type === 'message') {
                     toast({ title: `Command Executed: /${command}`, description: result.content });
                } else if (result.type === 'embed') {
                    onSendMessage('', undefined, result.payload);
                }
               
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Command Failed', description: error.message });
            } finally {
                setIsUploading(false);
                setText('');
            }
            return;
        }

        let imageUrl: string | undefined = undefined;

        if (pastedImage) {
            setIsUploading(true);
            try {
                if (!chatId && !channelId) throw new Error("Context ID is missing for upload.");
                const uploadPath = channelId 
                    ? `chat-images/${serverContext?.id}/${channelId}`
                    : `chat-images/${chatId}`;

                imageUrl = await uploadFile(pastedImage, uploadPath as any);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
                setIsUploading(false);
                return;
            }
        }

        onSendMessage(text, imageUrl);
        onTyping(false);
        setText('');
        setPastedImage(null);
        setIsUploading(false);
        setIsAutocompleteOpen(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
         if (e.key === 'Escape') {
            setIsAutocompleteOpen(false);
        }
    };

    const AutocompletePopover = () => (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto z-10">
            {autocompleteType === 'command' && filteredCommands.length > 0 && (
                 <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Commands matching "/{autocompleteQuery}"
                    </p>
                     {filteredCommands.map(cmd => {
                        const Icon = cmd.icon;
                        const hasArgs = 'args' in cmd && cmd.args;
                        return (
                            <button
                                key={cmd.name}
                                className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-accent"
                                onClick={() => insertAutocomplete(cmd.name, 'command')}
                            >
                                <div className="size-8 bg-muted rounded-md flex items-center justify-center">
                                    <Icon className="size-5" />
                                </div>
                                <div>
                                    <p className="font-medium flex items-center gap-2">{cmd.name} {hasArgs && <span className="text-xs text-muted-foreground">{cmd.args}</span>}</p>
                                    <p className="text-sm text-muted-foreground">{cmd.description}</p>
                                </div>
                            </button>
                        )
                     })}
                 </div>
            )}
            {autocompleteType === 'mention' && filteredMembers.length > 0 && (
                <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Members matching "@${autocompleteQuery}"
                    </p>
                    {filteredMembers.map(member => (
                        <button 
                            key={member.uid} 
                            className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent"
                            onClick={() => insertAutocomplete(member.displayName!, 'mention')}
                        >
                             {member.uid === 'everyone' ? (
                                <div className="size-6 bg-muted rounded-full flex items-center justify-center">
                                    <AtSign className="size-4" />
                                </div>
                            ) : (
                                <Avatar className="size-6">
                                    <AvatarImage src={member.photoURL || undefined} />
                                    <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex-1">
                                <span className="text-sm">{member.displayName}</span>
                                {'note' in member && <p className="text-xs text-muted-foreground">{member.note}</p>}
                            </div>
                        </button>
                    ))}
                </div>
            )}
             {autocompleteType === 'emoji' && filteredEmojis.length > 0 && (
                <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Emojis matching ":"{autocompleteQuery}</p>
                    {filteredEmojis.map(emoji => (
                        <button 
                            key={emoji.name} 
                            className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent"
                            onClick={() => insertAutocomplete(emoji.name, 'emoji')}
                        >
                            {'char' in emoji ? (
                                <span className="text-xl w-8 h-8 flex items-center justify-center">{emoji.char}</span>
                            ) : (
                                <Image src={emoji.url} alt={emoji.name} width={32} height={32} className="rounded-sm" />
                            )}
                            <span className="text-sm">:{emoji.name}:</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
            {isAutocompleteOpen && AutocompletePopover()}
            {pastedImage && (
                <div className="relative w-32 h-32 bg-secondary/50 rounded-md p-2">
                    <Image
                        src={URL.createObjectURL(pastedImage)}
                        alt="Pasted image preview"
                        fill
                        className="object-contain rounded-md"
                    />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => setPastedImage(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="flex items-end gap-2">
                <Textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Send a message..."}
                    className="flex-1 resize-none pr-20"
                    rows={1}
                    disabled={disabled || isUploading}
                />
                <div className="absolute right-3 bottom-2 flex items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" disabled={disabled || isUploading}>
                                <SmilePlus className="size-5"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 p-0 border-none mb-2" side="top" align="end">
                            <Tabs defaultValue="standard">
                                <TabsList className="w-full rounded-b-none">
                                    <TabsTrigger value="standard" className="flex-1">Standard Emojis</TabsTrigger>
                                    {customEmojis.length > 0 && <TabsTrigger value="custom" className="flex-1">Custom Emojis</TabsTrigger>}
                                </TabsList>
                                <TabsContent value="standard" className="mt-0">
                                    <ScrollArea className="h-64">
                                    <div className="p-2 grid grid-cols-8 gap-1">
                                        {standardEmojis.map(emoji => (
                                            <button 
                                                key={emoji.name}
                                                type="button"
                                                onClick={() => insertEmoji(emoji)}
                                                className="aspect-square text-2xl flex items-center justify-center rounded-md hover:bg-accent"
                                            >
                                                {emoji.char}
                                            </button>
                                        ))}
                                    </div>
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="custom" className="mt-0">
                                    <ScrollArea className="h-64">
                                    <div className="p-2 grid grid-cols-8 gap-2">
                                        {customEmojis.map(emoji => (
                                            <button 
                                                key={emoji.name}
                                                type="button"
                                                onClick={() => insertEmoji(emoji)}
                                                className="aspect-square flex items-center justify-center rounded-md hover:bg-accent"
                                            >
                                                <Image src={emoji.url} alt={emoji.name} width={32} height={32} />
                                            </button>
                                        ))}
                                    </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </PopoverContent>
                    </Popover>

                    <Button type="submit" size="icon" className="size-8" disabled={disabled || isUploading || (text.trim() === '' && !pastedImage)}>
                        <Send className="size-4" />
                    </Button>
                </div>
            </div>
        </form>
    );
}
