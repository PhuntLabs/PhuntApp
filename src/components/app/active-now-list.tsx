'use client';

import type { UserProfile } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { UserNav } from './user-nav';
import { Gamepad2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

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

    if (users.length === 0) {
        return (
            <div className="text-center text-muted-foreground pt-10">
                <p className="font-semibold">No friends yet...</p>
                <p className="text-sm">Use the "Add Friend" button to start connecting!</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <h3 className="uppercase text-xs font-bold text-muted-foreground mb-2">Online - {onlineUsers.length}</h3>
            {onlineUsers.map(user => (
                <UserNav key={user.id} user={user} as="trigger">
                    <div className="w-full rounded-lg hover:bg-accent cursor-pointer group flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="size-8 rounded-full">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                </Avatar>
                                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background", statusBgColor[user.status || 'offline'])} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    {user.currentGame ? <Gamepad2 className="size-3"/> : null}
                                    {user.currentGame ? `Playing ${user.currentGame.name}` : user.customStatus || user.status}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                             <Button size="icon" variant="ghost" className="size-8 rounded-full"><MessageSquareMore className="size-5"/></Button>
                             <Button size="icon" variant="ghost" className="size-8 rounded-full"><MoreVertical className="size-5"/></Button>
                        </div>
                    </div>
                </UserNav>
            ))}

            <h3 className="uppercase text-xs font-bold text-muted-foreground my-2">Offline - {offlineUsers.length}</h3>
            {offlineUsers.map(user => (
                <UserNav key={user.id} user={user} as="trigger">
                    <div className="w-full rounded-lg hover:bg-accent cursor-pointer group flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="size-8 rounded-full opacity-50">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="opacity-50">
                                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    Offline
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                             <Button size="icon" variant="ghost" className="size-8 rounded-full"><MessageSquareMore className="size-5"/></Button>
                             <Button size="icon" variant="ghost" className="size-8 rounded-full"><MoreVertical className="size-5"/></Button>
                        </div>
                    </div>
                </UserNav>
            ))}
        </div>
    );
}

// Dummy imports for button icons
import { MessageSquareMore, MoreVertical } from 'lucide-react';
