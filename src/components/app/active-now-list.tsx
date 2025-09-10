'use client';

import type { UserProfile } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { UserNav } from './user-nav';
import { Gamepad2 } from 'lucide-react';

const statusRingColor: Record<string, string> = {
    online: 'ring-green-500',
    idle: 'ring-yellow-500',
    dnd: 'ring-red-500',
    offline: 'ring-gray-500',
}

const statusBgColor: Record<string, string> = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
};


export function ActiveNowList({ users }: { users: UserProfile[] }) {

    const onlineUsers = users.filter(u => u.status !== 'offline');
    const offlineUsers = users.filter(u => u.status === 'offline');

    return (
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
                {onlineUsers.map(user => (
                     <UserNav key={user.id} user={user} as="trigger">
                        <div className="w-48 h-20 rounded-lg bg-card border overflow-hidden cursor-pointer group relative">
                             <div className="h-10 bg-accent/50 relative">
                                {user.bannerURL && <Image src={user.bannerURL} alt="" fill className="object-cover opacity-50 group-hover:opacity-80 transition-opacity" />}
                            </div>
                            <div className="p-1.5 flex items-end gap-2 absolute top-0 left-0 right-0 bottom-0">
                                 <div className="relative">
                                    <Avatar className="size-12 border-4 border-card rounded-full">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card", statusBgColor[user.status || 'offline'])} />
                                </div>
                                <div className="flex-1 overflow-hidden -space-y-1 pb-1">
                                    <p className="text-sm font-semibold truncate">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        {user.currentGame ? <Gamepad2 className="size-3"/> : null}
                                        {user.currentGame ? `Playing ${user.currentGame.name}` : user.customStatus || user.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                     </UserNav>
                ))}
                 {offlineUsers.map(user => (
                    <UserNav key={user.id} user={user} as="trigger">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger>
                                     <div className="w-20 h-20 rounded-lg bg-card border overflow-hidden cursor-pointer group relative">
                                         <Avatar className="size-20 rounded-lg">
                                            <AvatarImage src={user.photoURL || undefined} />
                                            <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/50" />
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                                            <p className="text-xs font-semibold text-white truncate px-1 rounded-full bg-black/30">{user.displayName}</p>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{user.displayName}</p>
                                    <p className="capitalize">{user.status}</p>
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
