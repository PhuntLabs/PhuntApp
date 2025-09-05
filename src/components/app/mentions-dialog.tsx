
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMentions, MentionWithContext } from '@/hooks/use-mentions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Hash } from 'lucide-react';

interface MentionsDialogProps {
  children: React.ReactNode;
  onJumpToMessage: (context: MentionWithContext['context']) => void;
}

export function MentionsDialog({ children, onJumpToMessage }: MentionsDialogProps) {
  const { mentions, loading } = useMentions(true);

  const handleJump = (mention: MentionWithContext) => {
    onJumpToMessage(mention.context);
  };

  const MentionItem = ({ mention }: { mention: MentionWithContext }) => {
    return (
      <div className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg">
        <Avatar className="size-10 mt-1">
          <AvatarImage src={mention.senderProfile?.photoURL || undefined} />
          <AvatarFallback>{mention.senderProfile?.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{mention.senderProfile?.displayName || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">
              {mention.timestamp ? formatDistanceToNow((mention.timestamp as any).toDate(), { addSuffix: true }) : '...'}
            </span>
          </div>
          <p className="text-sm text-foreground/90">{mention.text}</p>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {mention.context.type === 'dm' ? (
                <>
                    <MessageSquare className="size-3" />
                    <span>In your DM with <strong>{mention.context.chatName}</strong></span>
                </>
            ) : (
                <>
                    <Hash className="size-3" />
                    <span>in <strong>#{mention.context.channelName}</strong> on <strong>{mention.context.serverName}</strong></span>
                </>
            )}
          </div>
        </div>
        <DialogClose asChild>
            <Button variant="ghost" size="sm" onClick={() => handleJump(mention)}>Jump</Button>
        </DialogClose>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="size-10 rounded-full mt-1" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-60" />
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recent Mentions</DialogTitle>
          <DialogDescription>
            Here are the latest messages where you've been mentioned.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] -mx-6">
          <div className="px-6 py-2 space-y-1">
            {loading ? (
              <>
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
      </DialogContent>
    </Dialog>
  );
}
