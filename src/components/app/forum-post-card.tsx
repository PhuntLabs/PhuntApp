'use client';

import type { Message, Channel, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface ForumPostCardProps {
  post: Message;
  channel: Channel;
  members: Partial<UserProfile>[];
}

export function ForumPostCard({ post, channel, members }: ForumPostCardProps) {
    if (!post.forumPost) return null;

    const author = members.find(m => m.uid === post.sender);
    const postTags = channel.tags?.filter(t => post.forumPost?.tags.includes(t.id));
    const firstImage = post.text.match(/!\[.*?\]\((.*?)\)/)?.[1];
    
    // These are placeholders for now
    const upvotes = 17;
    const commentCount = 89;

    return (
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <div className="p-4 flex gap-4">
                <Avatar className="size-10">
                    <AvatarImage src={author?.photoURL || undefined} />
                    <AvatarFallback>{author?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                         {postTags?.map(tag => (
                            <Badge key={tag.id} variant="secondary">{tag.emoji} {tag.name}</Badge>
                         ))}
                    </div>
                    <h3 className="text-lg font-semibold mt-1">{post.forumPost.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{author?.displayName}</span>
                        <span>•</span>
                        <span>{post.timestamp ? formatDistanceToNow((post.timestamp as any).toDate(), { addSuffix: true }) : '...'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                         <span className="flex items-center gap-1"><Star className="size-4" /> {upvotes}</span>
                         <span className="flex items-center gap-1"><MessageSquare className="size-4" /> {commentCount}</span>
                    </div>
                </div>
                 {firstImage && (
                    <Image 
                        src={firstImage}
                        alt="Post image"
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                    />
                )}
            </div>
        </Card>
    )
}
