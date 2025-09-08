
'use client';

import type { UserProfile } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { UserNav } from './user-nav';

const statusRingColor: Record<string, string> = {
    online: 'ring-green-500',
    idle: 'ring-yellow-500',
    dnd: 'ring-red-500',
    offline: 'ring-gray-500',
}

export function ActiveNowList({ users }: { users: UserProfile[] }) {
    return (
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
                {users.map(user => (
                    <UserNav key={user.id} user={user} as="trigger">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex flex-col items-center gap-2 w-16 cursor-pointer">
                                        <Avatar className={cn(
                                            "size-14 ring-2 ring-offset-2 ring-offset-background",
                                            statusRingColor[user.status || 'offline']
                                        )}>
                                            {user.currentGame ? (
                                                <Image 
                                                    src={"logoUrl" in user.currentGame ? user.currentGame.logoUrl : user.currentGame.imageUrl} 
                                                    alt={user.currentGame.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <>
                                                    <AvatarImage src={user.photoURL || undefined} />
                                                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <p className="text-xs truncate text-muted-foreground">{user.displayName}</p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{user.displayName}</p>
                                    {user.currentGame ? (
                                        <p>Playing {user.currentGame.name}</p>
                                    ) : (
                                        <p className="capitalize">{user.status}</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </UserNav>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
