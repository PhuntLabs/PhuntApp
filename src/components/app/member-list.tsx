'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/lib/types";

interface MemberListProps {
    members: Partial<UserProfile>[];
    loading: boolean;
}

export function MemberList({ members, loading }: MemberListProps) {
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
                {members.map(member => (
                    <div key={member.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                        <Avatar className="size-8">
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">{member.displayName}</span>
                    </div>
                ))}
            </div>
        </aside>
    )
}
