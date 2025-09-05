
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile, Emoji } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

const emojiList: Emoji[] = [
    { name: "grinning", char: "😀", keywords: ["happy", "joy", "smile"] },
    { name: "joy", char: "😂", keywords: ["happy", "lol", "laugh"] },
    { name: "sob", char: "😭", keywords: ["sad", "cry", "tear"] },
    { name: "thinking", char: "🤔", keywords: ["idea", "question", "hmm"] },
    { name: "thumbsup", char: "👍", keywords: ["agree", "yes", "like"] },
    { name: "heart", char: "❤️", keywords: ["love", "like", "romance"] },
    { name: "fire", char: "🔥", keywords: ["hot", "lit", "burn"] },
    { name: "rocket", char: "🚀", keywords: ["launch", "space", "fast"] },
];

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    placeholder?: string;
    members: Partial<UserProfile>[];
    disabled?: boolean;
}

export function ChatInput({ onSendMessage, placeholder, members, disabled }: ChatInputProps) {
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // Autocomplete state
    const [autocompleteType, setAutocompleteType] = useState<'mention' | 'emoji' | null>(null);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
    
    const [filteredMembers, setFilteredMembers] = useState<Partial<UserProfile>[]>([]);
    const [filteredEmojis, setFilteredEmojis] = useState<Emoji[]>([]);


    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setText(value);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');
        const lastColon = textBeforeCursor.lastIndexOf(':');
        const lastSpace = textBeforeCursor.lastIndexOf(' ');

        if (lastAt > lastSpace) {
            const query = textBeforeCursor.substring(lastAt + 1);
            setAutocompleteType('mention');
            setAutocompleteQuery(query);
            setIsAutocompleteOpen(true);
        } else if (lastColon > lastSpace) {
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

        if (autocompleteType === 'mention') {
            const filtered = members.filter(member => 
                member.displayName?.toLowerCase().startsWith(autocompleteQuery.toLowerCase())
            );
            setFilteredMembers(filtered);
        } else if (autocompleteType === 'emoji') {
            const filtered = emojiList.filter(emoji => 
                emoji.name.toLowerCase().startsWith(autocompleteQuery.toLowerCase()) || 
                emoji.keywords.some(k => k.startsWith(autocompleteQuery.toLowerCase()))
            );
            setFilteredEmojis(filtered);
        }
    }, [autocompleteQuery, autocompleteType, isAutocompleteOpen, members]);

    const insertAutocomplete = (value: string, type: 'mention' | 'emoji') => {
        if (!inputRef.current) return;

        const cursorPosition = inputRef.current.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastTrigger = textBeforeCursor.lastIndexOf(type === 'mention' ? '@' : ':');
        
        const newText = 
            text.substring(0, lastTrigger) + 
            (type === 'mention' ? `@${value} ` : `${value} `) +
            text.substring(cursorPosition);

        setText(newText);
        setIsAutocompleteOpen(false);
        setAutocompleteType(null);
        inputRef.current.focus();
    };

    const handleEmojiSelect = (emojiObject: { emoji: string }) => {
        if (!inputRef.current) return;
        const cursorPosition = inputRef.current.selectionStart;
        const newText = text.substring(0, cursorPosition) + emojiObject.emoji + text.substring(cursorPosition);
        setText(newText);
        inputRef.current.focus();
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() === '') return;
        onSendMessage(text);
        setText('');
        setIsAutocompleteOpen(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const AutocompletePopover = () => (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
            {autocompleteType === 'mention' && filteredMembers.length > 0 && (
                <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Members matching "@"{autocompleteQuery}</p>
                    {filteredMembers.map(member => (
                        <button 
                            key={member.id} 
                            className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent"
                            onClick={() => insertAutocomplete(member.displayName!, 'mention')}
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
                            onClick={() => insertAutocomplete(emoji.char, 'emoji')}
                        >
                            <span className="text-xl">{emoji.char}</span>
                            <span className="text-sm">:{emoji.name}:</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            {isAutocompleteOpen && AutocompletePopover()}
            <Textarea
                ref={inputRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Send a message..."}
                className="flex-1 resize-none pr-20"
                rows={1}
                disabled={disabled}
            />
            <div className="absolute right-3 bottom-2 flex items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" disabled={disabled}>
                            <SmilePlus className="size-5"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none mb-2" side="top" align="end">
                         <EmojiPicker 
                            onEmojiClick={handleEmojiSelect}
                            emojiStyle={EmojiStyle.NATIVE}
                            theme="dark"
                            lazyLoadEmojis
                         />
                    </PopoverContent>
                </Popover>

                <Button type="submit" size="icon" className="size-8" disabled={disabled || text.trim() === ''}>
                    <Send className="size-4" />
                </Button>
            </div>
        </form>
    );
}

