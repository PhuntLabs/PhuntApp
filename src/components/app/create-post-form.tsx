'use client';

import { useState } from 'react';
import type { Channel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Tag, SmilePlus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CreatePostFormProps {
    channel: Channel;
    onSendMessage: (text: string, file?: File, embed?: any, replyTo?: any, forumPost?: any) => void;
}

export function CreatePostForm({ channel, onSendMessage }: CreatePostFormProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const { toast } = useToast();

    const handleTagClick = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(t => t !== tagId));
        } else {
            if (selectedTags.length >= 5) {
                toast({
                    variant: 'destructive',
                    title: 'Too many tags',
                    description: 'You can select up to 5 tags.',
                });
                return;
            }
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !message.trim()) {
             toast({
                variant: 'destructive',
                title: 'Missing content',
                description: 'Please provide a title and a message for your post.',
            });
            return;
        }

        const forumPostData = {
            title,
            tags: selectedTags,
        };
        
        onSendMessage(message, undefined, undefined, undefined, forumPostData);
        
        // Reset form
        setTitle('');
        setMessage('');
        setSelectedTags([]);
    };

    return (
        <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
                <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 text-lg font-semibold border-none focus-visible:ring-0 shadow-none p-0 h-auto"
                />
            </div>
             <Textarea
                placeholder="Enter a first message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-none focus-visible:ring-0 shadow-none p-0 min-h-[60px]"
            />
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="size-8">
                                <Tag className="size-5 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <h4 className="font-medium text-sm mb-2">Select tags</h4>
                            <div className="flex flex-wrap gap-1">
                                {channel.tags?.map(tag => (
                                    <Badge 
                                        key={tag.id}
                                        onClick={() => handleTagClick(tag.id)}
                                        variant={selectedTags.includes(tag.id) ? 'default' : 'secondary'}
                                        className="cursor-pointer"
                                    >
                                        {tag.emoji} {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" className="size-8"><Paperclip className="size-5 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" className="size-8"><SmilePlus className="size-5 text-muted-foreground" /></Button>
                </div>
                 <Button onClick={handleSubmit}>
                    <Send className="mr-2 size-4" />
                    Post
                </Button>
            </div>
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 border-t pt-2">
                    {selectedTags.map(tagId => {
                        const tag = channel.tags?.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                            <Badge key={tagId} variant="secondary">
                                {tag.emoji} {tag.name}
                                <button onClick={() => handleTagClick(tagId)} className="ml-1.5 opacity-50 hover:opacity-100"><X className="size-3"/></button>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
