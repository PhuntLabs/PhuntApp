
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, SmilePlus, X, Award, Beaker, Code, Clapperboard, PlaySquare, Hash } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile, Emoji, CustomEmoji, BadgeType } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { giveBadge } from '@/ai/flows/give-badge-flow';
import { ALL_BADGES } from '@/lib/types';

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

const badgeIcons: Record<BadgeType, React.ElementType> = {
    developer: Code,
    'beta tester': Beaker,
    youtuber: PlaySquare,
    tiktoker: Clapperboard,
    goat: Award,
};


interface ChatInputProps {
    onSendMessage: (text: string, imageUrl?: string) => void;
    placeholder?: string;
    members: Partial<UserProfile>[];
    customEmojis?: CustomEmoji[];
    disabled?: boolean;
    chatId?: string;
}

export function ChatInput({ onSendMessage, placeholder, members, customEmojis = [], disabled, chatId }: ChatInputProps) {
    const [text, setText] = useState('');
    const [pastedImage, setPastedImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user, uploadFile } = useAuth();
    const { toast } = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    const [autocompleteType, setAutocompleteType] = useState<'mention' | 'emoji' | 'command' | 'badge' | null>(null);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
    
    const [filteredMembers, setFilteredMembers] = useState<Partial<UserProfile>[]>([]);
    const [filteredEmojis, setFilteredEmojis] = useState<(Emoji | CustomEmoji)[]>([]);
    const [filteredBadges, setFilteredBadges] = useState<BadgeType[]>([]);

    const combinedEmojis = [...standardEmojis, ...customEmojis];

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setText(value);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        
        const isCommand = textBeforeCursor.startsWith('/givebadge');

        if (isCommand) {
            const parts = textBeforeCursor.split(' ');
            if (parts.length === 2 && parts[1].startsWith('@')) {
                 setAutocompleteType('command');
                 setAutocompleteQuery(parts[1].substring(1));
                 setIsAutocompleteOpen(true);
            } else if (parts.length === 3) {
                 setAutocompleteType('badge');
                 setAutocompleteQuery(parts[2]);
                 setIsAutocompleteOpen(true);
            } else {
                 setIsAutocompleteOpen(false);
            }
            return;
        }

        const lastAt = textBeforeCursor.lastIndexOf('@');
        const lastColon = textBeforeCursor.lastIndexOf(':');
        const lastSpace = textBeforeCursor.lastIndexOf(' ');

        if (lastAt > lastSpace && !textBeforeCursor.substring(lastAt + 1).includes(' ')) {
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

        if (autocompleteType === 'mention' || autocompleteType === 'command') {
            const filtered = members.filter(member => 
                member.displayName?.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
            );
            setFilteredMembers(filtered);
        } else if (autocompleteType === 'emoji') {
            const filtered = combinedEmojis.filter(emoji => 
                emoji.name.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
            );
            setFilteredEmojis(filtered);
        } else if (autocompleteType === 'badge') {
             const filtered = ALL_BADGES.filter(badge =>
                badge.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
             );
             setFilteredBadges(filtered);
        }

    }, [autocompleteQuery, autocompleteType, isAutocompleteOpen, members, combinedEmojis]);

    const insertAutocomplete = (value: string, type: 'mention' | 'emoji' | 'command' | 'badge') => {
        if (!inputRef.current) return;

        const cursorPosition = inputRef.current.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        
        let newText: string;
        if(type === 'mention') {
            const lastTrigger = textBeforeCursor.lastIndexOf('@');
            newText = text.substring(0, lastTrigger) + `@${value} ` + text.substring(cursorPosition);
        } else if (type === 'emoji') {
            const lastTrigger = textBeforeCursor.lastIndexOf(':');
            newText = text.substring(0, lastTrigger) + `:${value}: ` + text.substring(cursorPosition);
        } else if (type === 'command') {
             const parts = text.split(' ');
             parts[1] = `@${value}`;
             newText = parts.join(' ') + (parts.length < 3 ? ' ' : '');
        } else { // badge
             const parts = text.split(' ');
             parts[2] = `"${value}"`;
             newText = parts.join(' ');
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
    
    const handleCommand = async (commandText: string) => {
        if (!user?.displayName) return;

        const parts = commandText.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const command = parts[0];
        
        if (command === '/givebadge') {
            if (parts.length !== 3) {
                toast({ variant: 'destructive', title: 'Invalid Command', description: 'Usage: /givebadge @username "badge-name"' });
                return;
            }
            const targetUsername = parts[1].startsWith('@') ? parts[1].substring(1) : parts[1];
            const badge = parts[2].replace(/"/g, '') as BadgeType;

            try {
                const result = await giveBadge({
                    callerUsername: user.displayName,
                    targetUsername,
                    badge,
                });
                toast({ title: 'Command Success', description: result.message });
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Command Error', description: e.message });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (text.startsWith('/')) {
            await handleCommand(text.trim());
            setText('');
            return;
        }
        
        if ((text.trim() === '' && !pastedImage) || isUploading) return;
        
        let imageUrl: string | undefined = undefined;

        if (pastedImage) {
            setIsUploading(true);
            try {
                if (!chatId) throw new Error("Chat ID is missing.");
                imageUrl = await uploadFile(pastedImage, `chat-images/${chatId}`);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
                setIsUploading(false);
                return;
            }
        }

        onSendMessage(text, imageUrl);
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
    };

    const AutocompletePopover = () => (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
            {(autocompleteType === 'mention' || autocompleteType === 'command') && filteredMembers.length > 0 && (
                <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {autocompleteType === 'mention' ? `Members matching "@${autocompleteQuery}"` : `Grant badge to @${autocompleteQuery}`}
                    </p>
                    {filteredMembers.map(member => (
                        <button 
                            key={member.id} 
                            className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent"
                            onClick={() => insertAutocomplete(member.displayName!, autocompleteType === 'mention' ? 'mention' : 'command')}
                        >
                            <Avatar className="size-6">
                                <AvatarImage src={member.photoURL || undefined} />
                                <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.displayName}</span>
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
            {autocompleteType === 'badge' && filteredBadges.length > 0 && (
                <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Badges matching "{autocompleteQuery}"</p>
                    {filteredBadges.map(badge => {
                        const Icon = badgeIcons[badge] || Hash;
                        return (
                            <button
                                key={badge}
                                className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent"
                                onClick={() => insertAutocomplete(badge, 'badge')}
                            >
                                <Icon className="size-4" />
                                <span className="text-sm">{badge}</span>
                            </button>
                        );
                    })}
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
