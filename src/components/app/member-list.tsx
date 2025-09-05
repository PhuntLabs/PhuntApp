
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server, UserProfile, UserStatus } from "@/lib/types";
import { Crown, MessageCircleMore } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";

interface MemberListProps {
    members: Partial<UserProfile>[];
    server: Server;
    loading: boolean;
}

const statusConfig: Record<UserStatus, { color: string }> = {
    online: { color: 'bg-green-500' },
    idle: { color: 'bg-yellow-500' },
    dnd: { color: 'bg-red-500' },
    offline: { color: 'bg-gray-500' },
};


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
    
    // Group members by their top role
    const roles = [...(server.roles || [])].sort((a,b) => a.priority - b.priority);
    const membersByRole: { [roleName: string]: Partial<UserProfile>[] } = {};
    const membersWithoutRoles: Partial<UserProfile>[] = [];

    roles.forEach(role => {
        membersByRole[role.name] = [];
    });
    
    members.forEach(member => {
        const memberRoleIds = server.memberDetails?.[member.uid!]?.roles || [];
        const topRole = roles.find(role => memberRoleIds.includes(role.id));

        if (topRole) {
            membersByRole[topRole.name].push(member);
        } else {
            membersWithoutRoles.push(member);
        }
    });


    return (
        <aside className="w-60 flex-shrink-0 bg-secondary/30 p-2 overflow-y-auto">
             <h2 className="text-sm font-semibold uppercase text-muted-foreground px-2 mb-2">Members — {members.length}</h2>
             {roles.map(role => {
                if (membersByRole[role.name]?.length > 0) {
                    return (
                        <div key={role.id}>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground px-2 mt-4" style={{ color: role.color }}>
                                {role.name} — {membersByRole[role.name].length}
                            </h3>
                            <div className="space-y-1 mt-1">
                                {membersByRole[role.name].map(member => (
                                     <MemberItem key={member.uid} member={member} server={server} topRoleColor={role.color} />
                                ))}
                            </div>
                        </div>
                    )
                }
                return null;
             })}
              {membersWithoutRoles.length > 0 && (
                <div>
                     <h3 className="text-xs font-bold uppercase text-muted-foreground px-2 mt-4">
                        Members — {membersWithoutRoles.length}
                    </h3>
                    <div className="space-y-1 mt-1">
                        {membersWithoutRoles.map(member => (
                             <MemberItem key={member.uid} member={member} server={server} />
                        ))}
                    </div>
                </div>
             )}
        </aside>
    )
}

const MemberItem = ({ member, server, topRoleColor }: { member: Partial<UserProfile>, server: Server, topRoleColor?: string }) => {
    const isOwner = member.uid === server.ownerId;
    const status = member.status || 'offline';

    return (
         <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                    <div className="relative">
                        <Avatar className="size-8">
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-secondary/30 flex items-center justify-center", 
                            statusConfig[status].color
                        )}>
                             {member.customStatus && <MessageCircleMore className="size-2 text-white/70" />}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <span className="font-medium text-sm truncate" style={{ color: topRoleColor }}>
                            {member.displayName}
                        </span>
                        {member.customStatus && (
                            <p className="text-xs text-muted-foreground truncate">{member.customStatus}</p>
                        )}
                    </div>
                    {isOwner && <Crown className="size-4 text-yellow-500" />}
                </div>
            </PopoverTrigger>
             <PopoverContent className="w-80 mb-2 p-0 border-none" side="left" align="start">
                <UserNav user={member as UserProfile} serverContext={server}/>
            </PopoverContent>
        </Popover>
    )
}
