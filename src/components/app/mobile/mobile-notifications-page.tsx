
'use client';

import {
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMentions, MentionWithContext } from '@/hooks/use-mentions';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Skeleton } from '../../ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageSquare, Hash, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageRenderer } from '../message-renderer';
import Image from 'next/image';

interface MobileNotificationsPageProps {
  onJumpToMessage: (context: MentionWithContext['context']) => void;
}

const MentionItem = ({ mention }: { mention: MentionWithContext }) => {
    const isDM = mention.context.type === 'dm';
    const serverName = !isDM ? mention.context.serverName : '';
    const channelName = !isDM ? mention.context.channelName : '';
    const avatar = mention.senderProfile?.photoURL || undefined;

    return (
      <div className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg border-b">
        <div className="relative">
            <Avatar className="size-10 mt-1">
                <AvatarImage src={avatar} />
                <AvatarFallback>{mention.senderProfile?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            {!isDM && (
                 <Avatar className="absolute -bottom-1 -right-1 size-5 border-2 border-background">
                    <AvatarImage src={(mention.context as any).serverIcon} />
                    <AvatarFallback>{serverName[0]}</AvatarFallback>
                </Avatar>
            )}
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="flex items-center text-sm text-muted-foreground">
                <p className="font-semibold text-foreground truncate">{mention.senderProfile?.displayName || 'Unknown User'}</p>
                <p className="mx-1">mentioned you in</p>
                <p className="font-semibold text-foreground truncate">{isDM ? mention.context.chatName : serverName}</p>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {mention.timestamp ? formatDistanceToNowStrict((mention.timestamp as any).toDate()) : '...'}
                </span>
            </div>
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="size-3.5" />
                <p>{isDM ? 'Direct Message' : channelName}</p>
            </div>
            <div className="mt-1">
                 <MessageRenderer content={mention.text}/>
            </div>
        </div>
      </div>
    );
  };

export function MobileNotificationsPage({ onJumpToMessage }: MobileNotificationsPageProps) {
  const { mentions, loading } = useMentions(true);

  const handleJump = (mention: MentionWithContext) => {
    onJumpToMessage(mention.context);
  };


  const LoadingSkeleton = () => (
    <div className="flex items-start gap-3 p-3 border-b">
      <Skeleton className="size-10 rounded-full mt-1" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
             <div className="w-8"></div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <Button variant="ghost" size="icon">
                <MoreHorizontal />
            </Button>
        </header>
        <ScrollArea className="flex-1">
          <div className="px-1 py-2 space-y-1">
            <h2 className="px-3 text-xs font-semibold text-muted-foreground">Recent Activity</h2>
            {loading ? (
              <>
                <LoadingSkeleton />
                <LoadingSkeleton />
                <LoadingSkeleton />
                <LoadingSkeleton />
              </>
            ) : mentions.length > 0 ? (
              mentions.map((mention) => <MentionItem key={mention.id} mention={mention} />)
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="font-semibold">No recent mentions</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
        </ScrollArea>
    </div>
  );
}
