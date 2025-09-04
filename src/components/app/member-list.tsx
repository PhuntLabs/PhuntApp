
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server, UserProfile } from "@/lib/types";
import { Crown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserNav } from "./user-nav";

interface MemberListProps {
    members: Partial<UserProfile>[];
    server: Server;
    loading: boolean;
}

export function MemberList({ members, server, loading }: MemberListProps) {
    if (loading) {
        return (
             <div className="w-60 flex-shrink-0 bg-secondary/30 p-2 space-y-2">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground px-2">Members — ?</h2>
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                 <div className="flex items-center gap-2 p-2">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>
        )
    }
    
    return (
        <aside className="w-60 flex-shrink-0 bg-secondary/30 p-2">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground px-2 mb-2">Members — {members.length}</h2>
            <div className="space-y-1">
                {members.map(member => {
                    const isOwner = member.uid === server.ownerId;
                    return (
                        <Popover key={member.id}>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                    <div className="relative">
                                        <Avatar className="size-8">
                                            <AvatarImage src={member.photoURL || undefined} />
                                            <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary/30" />
                                    </div>
                                    <span className="font-medium text-sm truncate">{member.displayName}</span>
                                    {isOwner && <Crown className="size-4 text-yellow-500" />}
                                </div>
                            </PopoverTrigger>
                             <PopoverContent className="w-80 mb-2 p-0 border-none" side="left" align="start">
                                <UserNav user={member as UserProfile} />
                            </PopoverContent>
                        </Popover>
                    )
                })}
            </div>
        </aside>
    )
}
