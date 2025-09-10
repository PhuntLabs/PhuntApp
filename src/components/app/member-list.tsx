
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Server, UserProfile, UserStatus } from "@/lib/types";
import { Crown, Bot, Music, Gamepad2 } from "lucide-react";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";

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
    
    const roles = [...(server.roles || [])].sort((a,b) => a.priority - b.priority);
    
    const getTopRole = (member: Partial<UserProfile>): (typeof roles[0] & { isOwner: boolean }) | null => {
        if (member.uid === server.ownerId) {
            return { id: 'owner', name: 'OWNER', color: '#f59e0b', priority: -1, permissions: {}, isOwner: true };
        }
        const memberRoleIds = server.memberDetails?.[member.uid!]?.roles || [];
        const memberRoles = roles
            .filter(r => memberRoleIds.includes(r.id) && r.name !== '@everyone')
            .sort((a,b) => a.priority - b.priority);
        return memberRoles.length > 0 ? { ...memberRoles[0], isOwner: false } : null;
    }

    const onlineMembers = members.filter(m => m.status !== 'offline');
    const offlineMembers = members.filter(m => m.status === 'offline');
    
    const groupedMembers: { [roleName: string]: { role: (typeof roles[0] & { isOwner?: boolean }), members: Partial<UserProfile>[] }} = {};

    onlineMembers.forEach(member => {
        const topRole = getTopRole(member);
        const roleName = topRole ? topRole.name : 'ONLINE';
        if (!groupedMembers[roleName]) {
            groupedMembers[roleName] = { role: topRole || { id: 'online', name: 'ONLINE', color: '#808080', priority: 999, permissions: {} }, members: []};
        }
        groupedMembers[roleName].members.push(member);
    });

    const sortedGroups = Object.values(groupedMembers).sort((a,b) => a.role.priority - b.role.priority);
    
    const activityMembers = onlineMembers.filter(m => m.currentGame || m.currentSong);

    return (
        <aside className="w-60 flex-shrink-0 bg-card p-3 flex flex-col">
            <ScrollArea className="flex-1">
                {activityMembers.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground px-1 mb-2">
                           Activity — {activityMembers.length}
                        </h3>
                        <div className="space-y-1">
                             {activityMembers.map(member => (
                                <MemberItem key={member.uid} member={member} server={server} topRoleColor={getTopRole(member)?.color} />
                            ))}
                        </div>
                    </div>
                )}
                 {sortedGroups.map(({ role, members }) => (
                    <div key={role.id} className="mb-4">
                        <h3 className="text-xs font-bold uppercase px-1 mb-2" style={{ color: role.color }}>
                            {role.name} — {members.length}
                        </h3>
                        <div className="space-y-1">
                            {members.map(member => (
                                <MemberItem key={member.uid} member={member} server={server} topRoleColor={role.color} />
                            ))}
                        </div>
                    </div>
                 ))}

                {offlineMembers.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground px-1 mb-2">
                            Offline — {offlineMembers.length}
                        </h3>
                         <div className="space-y-1 opacity-60">
                            {offlineMembers.map(member => (
                                 <MemberItem key={member.uid} member={member} server={server} />
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
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

    let activityText = member.customStatus || '';
    let ActivityIcon = null;
    if (member.currentGame) {
      activityText = `Playing ${member.currentGame.name}`;
      ActivityIcon = Gamepad2;
    } else if (member.currentSong) {
      activityText = `Listening to ${member.currentSong.title}`;
      ActivityIcon = Music;
    } else if (member.isBot) {
      activityText = "Bot"
      ActivityIcon = Bot;
    }

    return (
        <UserNav user={member as UserProfile} serverContext={server} as="trigger">
             <div className="relative group/member rounded-md">
                {member.nameplateUrl && (
                    <Image
                        src={member.nameplateUrl}
                        alt="Nameplate"
                        fill
                        objectFit="cover"
                        className="absolute inset-0 rounded-md opacity-30 group-hover/member:opacity-50 transition-opacity"
                    />
                )}
                <div className="flex items-center gap-3 p-1.5 relative overflow-hidden">
                     <div className="relative z-10 flex items-center gap-3 w-full">
                        <div className="relative">
                            <Avatar className="size-8">
                                <AvatarImage src={displayUser.photoURL || undefined} />
                                <AvatarFallback>{displayUser.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", 
                                statusConfig[status].color
                            )} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center">
                                <span className="font-medium text-sm truncate" style={{ color: topRoleColor }}>
                                    {displayUser.displayName}
                                </span>
                                 {isOwner && <Crown className="size-3.5 text-yellow-400 ml-1.5" />}
                            </div>
                            {activityText && (
                                <p className="text-xs truncate text-muted-foreground flex items-center gap-1.5">
                                    {ActivityIcon && <ActivityIcon className="size-3"/>}
                                    {activityText}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </UserNav>
    )
}
