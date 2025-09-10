
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server, UserProfile, UserStatus } from "@/lib/types";
import { Crown, MessageCircleMore } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
             <div className="w-60 flex-shrink-0 bg-card p-2 space-y-2">
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
        <aside className="w-60 flex-shrink-0 bg-card p-2 overflow-y-auto">
             <h2 className="text-sm font-semibold uppercase text-muted-foreground px-2 mb-2">Members — {members.length}</h2>
             {roles.map(role => {
                if (membersByRole[role.name]?.length > 0) {
                    return (
                        <div key={role.id}>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground px-2 mt-4" style={{ color: role.color }}>
                                {role.name} — {membersByRole[role.name].length}
                            </h3>
                            <div className="space-y-1 mt-1">
                                {membersByRole[role.name][0] && membersByRole[role.name].map(member => (
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
    
    const serverProfile = server.memberDetails?.[member.uid!]?.profile;
    const displayUser = {
      ...member,
      displayName: serverProfile?.nickname || member.displayName,
      photoURL: serverProfile?.avatar || member.photoURL,
    };

    return (
         <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer relative overflow-hidden">
                    {member.nameplateUrl && (
                        <Image
                            src={member.nameplateUrl}
                            alt=""
                            fill
                            className="object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                        />
                    )}
                    <div className="relative z-10 flex items-center gap-2 w-full">
                        <div className="relative">
                            <Avatar className="size-8">
                                <AvatarImage src={displayUser.photoURL || undefined} />
                                <AvatarFallback>{displayUser.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card flex items-center justify-center", 
                                statusConfig[status].color
                            )}>
                                {member.customStatus && <MessageCircleMore className="size-2 text-white/70" />}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <span className={cn("font-medium text-sm truncate", member.nameplateUrl ? 'text-white text-shadow-sm' : '')} style={{ color: member.nameplateUrl ? undefined : topRoleColor }}>
                                {displayUser.displayName}
                            </span>
                            {member.customStatus && (
                                <p className={cn("text-xs truncate", member.nameplateUrl ? 'text-white/80' : 'text-muted-foreground')}>{member.customStatus}</p>
                            )}
                        </div>
                        {isOwner && <Crown className="size-4 text-yellow-500 z-10" />}
                    </div>
                </div>
            </PopoverTrigger>
             <PopoverContent className="w-80 mb-2 p-0 border-none" side="left" align="start">
                <UserNav user={member as UserProfile} serverContext={server}/>
            </PopoverContent>
        </Popover>
    )
}
