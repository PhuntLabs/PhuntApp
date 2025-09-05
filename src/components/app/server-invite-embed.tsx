
'use client';

import { useServer } from '@/hooks/use-server';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

interface ServerInviteEmbedProps {
  serverId: string;
}

export function ServerInviteEmbed({ serverId }: ServerInviteEmbedProps) {
  const { server, loading } = useServer(serverId);

  if (loading) {
    return (
      <Card className="my-2 max-w-sm bg-background/50">
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardFooter className="p-4 pt-0">
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (!server) {
    return (
        <Card className="my-2 max-w-sm border-destructive/50 bg-destructive/20">
            <CardHeader className="p-4">
                <CardTitle className="text-sm text-destructive-foreground">Invite Invalid</CardTitle>
                <CardDescription className="text-xs text-destructive-foreground/80">
                    This server may have been deleted or the invite is no longer valid.
                </CardDescription>
            </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="my-2 max-w-sm bg-background/50">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarImage src={server.photoURL || undefined} alt={server.name} />
          <AvatarFallback>{server.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-base">{server.name}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="mr-1 size-3" /> {server.members?.length || 0} Members
          </div>
        </div>
      </CardHeader>
       <CardFooter className="p-4 pt-0">
        <Link href={`/join/${server.id}`}>
            <Button size="sm">Join Server</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
