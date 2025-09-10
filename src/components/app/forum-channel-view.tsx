'use client';
import type { Channel, Server, Message, UserProfile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Tag, Trophy, MessageSquare, Star, ArrowDown, ArrowUp, Search } from 'lucide-react';
import { CreatePostForm } from './create-post-form';
import { ForumPostCard } from './forum-post-card';

interface ForumChannelViewProps {
  channel: Channel;
  server: Server;
  members: Partial<UserProfile>[];
  posts: Message[];
  onSendMessage: (text: string, file?: File, embed?: any, replyTo?: any, forumPost?: any) => void;
}

export function ForumChannelView({ channel, server, members, posts, onSendMessage }: ForumChannelViewProps) {
    const forumPosts = posts.filter(p => p.forumPost);
    
    return (
        <div className="flex h-full">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    <CreatePostForm channel={channel} onSendMessage={onSendMessage} />
                    <div className="flex items-center gap-4 text-sm">
                        <Button variant="secondary" size="sm" className="rounded-full">
                            <ArrowDown className="mr-2 size-4" />
                            Recent Activity
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full">
                            <Star className="mr-2 size-4" />
                            Most Upvotes
                        </Button>
                         <Button variant="ghost" size="sm" className="rounded-full">
                            <MessageSquare className="mr-2 size-4" />
                            Most Comments
                        </Button>
                    </div>
                     <div className="space-y-3">
                        {forumPosts.map(post => (
                            <ForumPostCard key={post.id} post={post} channel={channel} members={members} />
                        ))}
                    </div>
                </div>
            </ScrollArea>
            <aside className="w-80 hidden md:block bg-secondary/30 p-4 border-l">
                <div className="p-4 bg-background/50 rounded-lg space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <Check className="size-5 text-green-500"/>
                        <h3 className="font-semibold">Post Guidelines</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {channel.guidelines || "No guidelines have been set for this forum."}
                    </p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg">
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {channel.tags?.map(tag => (
                            <Button key={tag.id} variant="secondary" size="sm" className="rounded-full">
                                {tag.emoji && <span className="mr-2">{tag.emoji}</span>}
                                {tag.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    )
}
